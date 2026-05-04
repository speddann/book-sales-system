SET NOCOUNT ON;

-- Non-destructive bulk seed for testing.
-- This script ONLY inserts data; it never deletes existing rows.

DECLARE @BooksToAdd INT = 120;
DECLARE @CustomersToAdd INT = 300;
DECLARE @SalesToAdd INT = 1800;
DECLARE @InventoryTransactionsToAdd INT = 2200;

BEGIN TRY
    BEGIN TRAN;

    -- -----------------------------
    -- 1) Add many books
    -- -----------------------------
    DECLARE @BaseBookIndex INT = ISNULL((SELECT MAX(Id) FROM Books), 0);

    ;WITH N AS (
        SELECT TOP (@BooksToAdd) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
        FROM sys.all_objects
    )
    INSERT INTO Books (Title, Author, Price, Stock)
    SELECT
        CONCAT('Test Book ', @BaseBookIndex + n),
        CONCAT('Author ', ((@BaseBookIndex + n) % 75) + 1),
        CAST(ROUND(6 + (ABS(CHECKSUM(NEWID())) % 2500) / 100.0, 2) AS DECIMAL(18,2)),
        50 + (ABS(CHECKSUM(NEWID())) % 250)
    FROM N;

    -- -----------------------------
    -- 2) Add many customers
    -- -----------------------------
    DECLARE @BaseCustomerIndex INT = ISNULL((SELECT MAX(Id) FROM Customers), 0);

    ;WITH N AS (
        SELECT TOP (@CustomersToAdd) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
        FROM sys.all_objects
    )
    INSERT INTO Customers (Name, Phone, Email, CreatedDate)
    SELECT
        CONCAT('Test Customer ', @BaseCustomerIndex + n),
        CONCAT('555-', RIGHT(CONCAT('0000', (1000 + ((@BaseCustomerIndex + n) % 9000))), 4)),
        CONCAT('test.customer.', @BaseCustomerIndex + n, '@example.com'),
        DATEADD(DAY, -1 * (ABS(CHECKSUM(NEWID())) % 365), SYSUTCDATETIME())
    FROM N;

    -- Pools for random lookups
    CREATE TABLE #BookPool
    (
        RowNum INT PRIMARY KEY,
        BookId INT NOT NULL
    );

    INSERT INTO #BookPool (RowNum, BookId)
    SELECT ROW_NUMBER() OVER (ORDER BY Id), Id
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
    -- 3) Add many sales
    -- -----------------------------
    CREATE TABLE #NewSales
    (
        SaleId INT PRIMARY KEY
    );

    ;WITH N AS (
        SELECT TOP (@SalesToAdd) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
        FROM sys.all_objects a
        CROSS JOIN sys.all_objects b
    ), SalesSeed AS (
        SELECT
            DATEADD(DAY, -1 * (ABS(CHECKSUM(NEWID())) % 365), SYSUTCDATETIME()) AS SaleDate,
            CASE ABS(CHECKSUM(NEWID())) % 3
                WHEN 0 THEN 'Cash'
                WHEN 1 THEN 'Card'
                ELSE 'ETransfer'
            END AS PaymentMethod,
            CASE
                WHEN ABS(CHECKSUM(NEWID())) % 8 = 0 THEN NULL
                ELSE (SELECT c.CustomerId
                      FROM #CustomerPool c
                      WHERE c.RowNum = (ABS(CHECKSUM(NEWID())) % @CustomerCount) + 1)
            END AS CustomerId
        FROM N
    )
    INSERT INTO Sales (Date, PaymentMethod, Subtotal, PaymentFee, FinalTotal, CustomerId, Status)
    OUTPUT INSERTED.Id INTO #NewSales(SaleId)
    SELECT SaleDate, PaymentMethod, 0, 0, 0, CustomerId, 'Completed'
    FROM SalesSeed;

    -- -----------------------------
    -- 4) Add sale items (1 to 4 per sale)
    -- -----------------------------
    ;WITH SaleItemRows AS (
        SELECT ns.SaleId,
               (ABS(CHECKSUM(NEWID())) % 4) + 1 AS ItemCount
        FROM #NewSales ns
    )
    INSERT INTO SaleItems (SaleId, BookId, Quantity, ReturnedQuantity)
    SELECT
        sir.SaleId,
        bp.BookId,
        (ABS(CHECKSUM(NEWID())) % 4) + 1 AS Quantity,
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
    -- 5) Randomly mark some as returned/partially returned
    -- -----------------------------
    -- Fully returned candidate sales
    CREATE TABLE #ReturnCandidates (SaleId INT PRIMARY KEY);
    INSERT INTO #ReturnCandidates (SaleId)
    SELECT ns.SaleId
    FROM #NewSales ns
    WHERE ABS(CHECKSUM(NEWID())) % 100 < 9; -- ~9%

    UPDATE si
    SET si.ReturnedQuantity = si.Quantity
    FROM SaleItems si
    INNER JOIN #ReturnCandidates rc ON rc.SaleId = si.SaleId;

    -- Partial return candidates (~14% excluding fully returned)
    CREATE TABLE #PartialCandidates (SaleId INT PRIMARY KEY);
    INSERT INTO #PartialCandidates (SaleId)
    SELECT ns.SaleId
    FROM #NewSales ns
    WHERE ns.SaleId NOT IN (SELECT SaleId FROM #ReturnCandidates)
      AND ABS(CHECKSUM(NEWID())) % 100 < 14;

    ;WITH OneItem AS (
        SELECT
            si.Id,
            si.SaleId,
            si.Quantity,
            ROW_NUMBER() OVER (PARTITION BY si.SaleId ORDER BY si.Id) AS rn
        FROM SaleItems si
        INNER JOIN #PartialCandidates pc ON pc.SaleId = si.SaleId
    )
    UPDATE si
    SET si.ReturnedQuantity = CASE
        WHEN si.Quantity = 1 THEN 1
        ELSE si.Quantity - 1
    END
    FROM SaleItems si
    INNER JOIN OneItem oi ON oi.Id = si.Id
    WHERE oi.rn = 1;

    -- -----------------------------
    -- 6) Update sale totals and status from items
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
    -- 7) Add many inventory transactions
    -- -----------------------------
    ;WITH N AS (
        SELECT TOP (@InventoryTransactionsToAdd) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
        FROM sys.all_objects a
        CROSS JOIN sys.all_objects b
    ), Tx AS (
        SELECT
            (SELECT bp.BookId FROM #BookPool bp WHERE bp.RowNum = (ABS(CHECKSUM(NEWID())) % @BookCount) + 1) AS BookId,
            CASE WHEN ABS(CHECKSUM(NEWID())) % 2 = 0 THEN 'increase' ELSE 'decrease' END AS TxType,
            (ABS(CHECKSUM(NEWID())) % 20) + 1 AS Qty,
            DATEADD(DAY, -1 * (ABS(CHECKSUM(NEWID())) % 365), SYSUTCDATETIME()) AS TxDate,
            ABS(CHECKSUM(NEWID())) % 300 AS StockBefore
        FROM N
    )
    INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
    SELECT
        t.BookId,
        t.TxType,
        t.Qty,
        CASE t.TxType
            WHEN 'increase' THEN 'Bulk test restock'
            ELSE 'Bulk test sales adjustment'
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
