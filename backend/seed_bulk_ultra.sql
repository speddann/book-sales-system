SET NOCOUNT ON;

-- ULTRA non-destructive bulk seed for heavy testing.
-- This script ONLY inserts data and can be re-run safely.

DECLARE @BooksToAdd INT = 300;
DECLARE @CustomersToAdd INT = 1200;
DECLARE @SalesToAdd INT = 12000;
DECLARE @InventoryTransactionsToAdd INT = 18000;

BEGIN TRY
    BEGIN TRAN;

    -- -----------------------------
    -- 1) Add books
    -- -----------------------------
    DECLARE @BaseBookIndex INT = ISNULL((SELECT MAX(Id) FROM Books), 0);

    ;WITH N AS (
        SELECT TOP (@BooksToAdd) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
        FROM sys.all_objects
    )
    INSERT INTO Books (Title, Author, Price, Stock)
    SELECT
        CONCAT('Ultra Test Book ', @BaseBookIndex + n),
        CONCAT('Ultra Author ', ((@BaseBookIndex + n) % 220) + 1),
        CAST(ROUND(5 + (ABS(CHECKSUM(NEWID())) % 5000) / 100.0, 2) AS DECIMAL(18,2)),
        80 + (ABS(CHECKSUM(NEWID())) % 450)
    FROM N;

    -- -----------------------------
    -- 2) Add customers
    -- -----------------------------
    DECLARE @BaseCustomerIndex INT = ISNULL((SELECT MAX(Id) FROM Customers), 0);

    ;WITH N AS (
        SELECT TOP (@CustomersToAdd) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
        FROM sys.all_objects
    )
    INSERT INTO Customers (Name, Phone, Email, CreatedDate)
    SELECT
        CONCAT('Ultra Customer ', @BaseCustomerIndex + n),
        CONCAT('555-', RIGHT(CONCAT('0000', (1000 + ((@BaseCustomerIndex + n) % 9000))), 4)),
        CONCAT('ultra.customer.', @BaseCustomerIndex + n, '@example.com'),
        DATEADD(DAY, -1 * (ABS(CHECKSUM(NEWID())) % 540), SYSUTCDATETIME())
    FROM N;

    -- Pools for random lookup
    CREATE TABLE #BookPool
    (
        RowNum INT PRIMARY KEY,
        BookId INT NOT NULL,
        Price DECIMAL(18,2) NOT NULL
    );

    INSERT INTO #BookPool (RowNum, BookId, Price)
    SELECT ROW_NUMBER() OVER (ORDER BY Id), Id, Price
    FROM Books;

    CREATE TABLE #CustomerPool
    (
        RowNum INT PRIMARY KEY,
        CustomerId INT NOT NULL
    );

    INSERT INTO #CustomerPool (RowNum, CustomerId)
    SELECT ROW_NUMBER() OVER (ORDER BY Id), Id
    FROM Customers;

    DECLARE @BookCount INT = (SELECT COUNT(*) FROM #BookPool);
    DECLARE @CustomerCount INT = (SELECT COUNT(*) FROM #CustomerPool);

    -- -----------------------------
    -- 3) Add sales (large batch)
    -- -----------------------------
    CREATE TABLE #NewSales
    (
        SaleId INT PRIMARY KEY
    );

    ;WITH N AS (
        SELECT TOP (@SalesToAdd) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
        FROM sys.all_objects a
        CROSS JOIN sys.all_objects b
    ), Seed AS (
        SELECT
            DATEADD(DAY, -1 * (ABS(CHECKSUM(NEWID())) % 540), SYSUTCDATETIME()) AS SaleDate,
            CASE ABS(CHECKSUM(NEWID())) % 3
                WHEN 0 THEN 'Cash'
                WHEN 1 THEN 'Card'
                ELSE 'ETransfer'
            END AS PaymentMethod,
            CASE
                WHEN ABS(CHECKSUM(NEWID())) % 10 = 0 THEN NULL
                ELSE (SELECT c.CustomerId
                      FROM #CustomerPool c
                      WHERE c.RowNum = (ABS(CHECKSUM(NEWID())) % @CustomerCount) + 1)
            END AS CustomerId
        FROM N
    )
    INSERT INTO Sales (Date, PaymentMethod, Subtotal, PaymentFee, FinalTotal, CustomerId, Status)
    OUTPUT INSERTED.Id INTO #NewSales(SaleId)
    SELECT SaleDate, PaymentMethod, 0, 0, 0, CustomerId, 'Completed'
    FROM Seed;

    -- -----------------------------
    -- 4) Add sale items (2 to 6 items per sale)
    -- -----------------------------
    ;WITH SaleItemRows AS (
        SELECT ns.SaleId,
               (ABS(CHECKSUM(NEWID())) % 5) + 2 AS ItemCount
        FROM #NewSales ns
    )
    INSERT INTO SaleItems (SaleId, BookId, Quantity, ReturnedQuantity)
    SELECT
        sir.SaleId,
        bp.BookId,
        (ABS(CHECKSUM(NEWID())) % 5) + 1 AS Quantity,
        0 AS ReturnedQuantity
    FROM SaleItemRows sir
    CROSS APPLY (
        SELECT TOP (sir.ItemCount) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
        FROM sys.all_objects
    ) x
    CROSS APPLY (
        SELECT b.BookId
        FROM #BookPool b
        WHERE b.RowNum = (ABS(CHECKSUM(NEWID())) % @BookCount) + 1
    ) bp;

    -- -----------------------------
    -- 5) Simulate full/partial returns
    -- -----------------------------
    CREATE TABLE #FullReturnCandidates (SaleId INT PRIMARY KEY);
    INSERT INTO #FullReturnCandidates (SaleId)
    SELECT ns.SaleId
    FROM #NewSales ns
    WHERE ABS(CHECKSUM(NEWID())) % 100 < 7; -- ~7% fully returned

    UPDATE si
    SET si.ReturnedQuantity = si.Quantity
    FROM SaleItems si
    INNER JOIN #FullReturnCandidates frc ON frc.SaleId = si.SaleId;

    CREATE TABLE #PartialReturnCandidates (SaleId INT PRIMARY KEY);
    INSERT INTO #PartialReturnCandidates (SaleId)
    SELECT ns.SaleId
    FROM #NewSales ns
    WHERE ns.SaleId NOT IN (SELECT SaleId FROM #FullReturnCandidates)
      AND ABS(CHECKSUM(NEWID())) % 100 < 18; -- ~18% partial returns

    ;WITH OneItemPerSale AS (
        SELECT
            si.Id,
            si.SaleId,
            si.Quantity,
            ROW_NUMBER() OVER (PARTITION BY si.SaleId ORDER BY si.Id) AS rn
        FROM SaleItems si
        INNER JOIN #PartialReturnCandidates prc ON prc.SaleId = si.SaleId
    )
    UPDATE si
    SET si.ReturnedQuantity = CASE
        WHEN si.Quantity = 1 THEN 1
        ELSE si.Quantity - 1
    END
    FROM SaleItems si
    INNER JOIN OneItemPerSale oips ON oips.Id = si.Id
    WHERE oips.rn = 1;

    -- -----------------------------
    -- 6) Update totals and status
    -- -----------------------------
    ;WITH SaleTotals AS (
        SELECT
            si.SaleId,
            CAST(SUM(si.Quantity * b.Price) AS DECIMAL(18,2)) AS Subtotal
        FROM SaleItems si
        INNER JOIN Books b ON b.Id = si.BookId
        WHERE si.SaleId IN (SELECT SaleId FROM #NewSales)
        GROUP BY si.SaleId
    )
    UPDATE s
    SET
        s.Subtotal = st.Subtotal,
        s.PaymentFee = CASE
            WHEN s.PaymentMethod = 'ETransfer' THEN CAST(ROUND(st.Subtotal * 0.05, 2) AS DECIMAL(18,2))
            ELSE 0
        END,
        s.FinalTotal = st.Subtotal + CASE
            WHEN s.PaymentMethod = 'ETransfer' THEN CAST(ROUND(st.Subtotal * 0.05, 2) AS DECIMAL(18,2))
            ELSE 0
        END
    FROM Sales s
    INNER JOIN SaleTotals st ON st.SaleId = s.Id;

    ;WITH StatusAgg AS (
        SELECT
            si.SaleId,
            SUM(CASE WHEN si.ReturnedQuantity = si.Quantity THEN 1 ELSE 0 END) AS FullReturnedItems,
            SUM(CASE WHEN si.ReturnedQuantity > 0 THEN 1 ELSE 0 END) AS AnyReturnedItems,
            COUNT(*) AS TotalItems
        FROM SaleItems si
        WHERE si.SaleId IN (SELECT SaleId FROM #NewSales)
        GROUP BY si.SaleId
    )
    UPDATE s
    SET s.Status = CASE
        WHEN sa.FullReturnedItems = sa.TotalItems THEN 'Returned'
        WHEN sa.AnyReturnedItems > 0 THEN 'PartiallyReturned'
        ELSE 'Completed'
    END
    FROM Sales s
    INNER JOIN StatusAgg sa ON sa.SaleId = s.Id;

    -- -----------------------------
    -- 7) Add inventory transactions
    -- -----------------------------
    ;WITH N AS (
        SELECT TOP (@InventoryTransactionsToAdd) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
        FROM sys.all_objects a
        CROSS JOIN sys.all_objects b
    ), Tx AS (
        SELECT
            (SELECT bp.BookId FROM #BookPool bp WHERE bp.RowNum = (ABS(CHECKSUM(NEWID())) % @BookCount) + 1) AS BookId,
            CASE WHEN ABS(CHECKSUM(NEWID())) % 2 = 0 THEN 'increase' ELSE 'decrease' END AS TxType,
            (ABS(CHECKSUM(NEWID())) % 25) + 1 AS Qty,
            DATEADD(DAY, -1 * (ABS(CHECKSUM(NEWID())) % 540), SYSUTCDATETIME()) AS TxDate,
            ABS(CHECKSUM(NEWID())) % 500 AS StockBefore
        FROM N
    )
    INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
    SELECT
        t.BookId,
        t.TxType,
        t.Qty,
        CASE t.TxType
            WHEN 'increase' THEN 'Ultra test bulk restock'
            ELSE 'Ultra test bulk adjustment'
        END,
        t.StockBefore,
        CASE
            WHEN t.TxType = 'increase' THEN t.StockBefore + t.Qty
            WHEN t.StockBefore >= t.Qty THEN t.StockBefore - t.Qty
            ELSE 0
        END,
        t.TxDate
    FROM Tx t;

    COMMIT TRAN;

    SELECT
        (SELECT COUNT(*) FROM Books) AS TotalBooks,
        (SELECT COUNT(*) FROM Customers) AS TotalCustomers,
        (SELECT COUNT(*) FROM Sales) AS TotalSales,
        (SELECT COUNT(*) FROM SaleItems) AS TotalSaleItems,
        (SELECT COUNT(*) FROM InventoryTransactions) AS TotalInventoryTransactions;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    THROW;
END CATCH;
