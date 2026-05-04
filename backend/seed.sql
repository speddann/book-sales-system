-- ============================================================
-- SEED DATA for BookSalesDB
-- Run this against your BookSalesDB database
-- ============================================================

-- Clear existing data (order matters due to FK constraints)
DELETE FROM InventoryTransactions;
DELETE FROM SaleItems;
DELETE FROM Sales;
DELETE FROM Customers;
DELETE FROM Books;

-- Reset identity columns
DBCC CHECKIDENT ('Books', RESEED, 0);
DBCC CHECKIDENT ('Customers', RESEED, 0);
DBCC CHECKIDENT ('Sales', RESEED, 0);
DBCC CHECKIDENT ('SaleItems', RESEED, 0);
DBCC CHECKIDENT ('InventoryTransactions', RESEED, 0);


-- ============================================================
-- BOOKS  (mix of healthy stock and low stock for alert testing)
-- ============================================================
INSERT INTO Books (Title, Author, Price, Stock) VALUES
('The Alchemist',          'Paulo Coelho',      12.99, 45),
('Atomic Habits',          'James Clear',       14.99, 3),   -- LOW STOCK
('Deep Work',              'Cal Newport',       13.50, 28),
('Yoga for Beginners',     'Adriene Mishler',    9.99, 2),   -- LOW STOCK
('Spiritual Life',         'Thomas Merton',     11.00, 5),   -- LOW STOCK (exactly at threshold)
('Sapiens',                'Yuval Noah Harari', 15.99, 60),
('The Power of Now',       'Eckhart Tolle',     10.99, 4),   -- LOW STOCK
('Rich Dad Poor Dad',      'Robert Kiyosaki',   12.00, 35),
('Mindset',                'Carol Dweck',       11.50, 22),
('The 7 Habits',           'Stephen Covey',     13.99, 18);


-- ============================================================
-- CUSTOMERS
-- ============================================================
INSERT INTO Customers (Name, Phone, Email, CreatedDate) VALUES
('Alice Johnson',  '555-1001', 'alice@example.com',  '2026-04-10 09:00:00'),
('Bob Smith',      '555-1002', 'bob@example.com',    '2026-04-12 10:30:00'),
('Clara Davies',   '555-1003', 'clara@example.com',  '2026-04-15 14:00:00'),
('David Lee',      '555-1004', 'david@example.com',  '2026-04-20 16:45:00'),
('Emma Wilson',    '555-1005', 'emma@example.com',   '2026-05-01 08:20:00');


-- ============================================================
-- SALES  (spread across April and May for date-range testing)
-- ============================================================

-- Sale 1: Alice buys The Alchemist + Atomic Habits (April)
INSERT INTO Sales (Date, PaymentMethod, Subtotal, PaymentFee, FinalTotal, CustomerId)
VALUES ('2026-04-15 10:00:00', 'ETransfer', 27.98, 0.00, 27.98, 1);

INSERT INTO SaleItems (SaleId, BookId, Quantity) VALUES (1, 1, 1); -- The Alchemist
INSERT INTO SaleItems (SaleId, BookId, Quantity) VALUES (1, 2, 1); -- Atomic Habits

-- Sale 2: Bob buys Deep Work x2 (April)
INSERT INTO Sales (Date, PaymentMethod, Subtotal, PaymentFee, FinalTotal, CustomerId)
VALUES ('2026-04-20 14:30:00', 'Cash', 27.00, 0.00, 27.00, 2);

INSERT INTO SaleItems (SaleId, BookId, Quantity) VALUES (2, 3, 2); -- Deep Work x2

-- Sale 3: Clara buys Yoga for Beginners + Spiritual Life (April)
INSERT INTO Sales (Date, PaymentMethod, Subtotal, PaymentFee, FinalTotal, CustomerId)
VALUES ('2026-04-25 11:15:00', 'Card', 20.99, 0.50, 21.49, 3);

INSERT INTO SaleItems (SaleId, BookId, Quantity) VALUES (3, 4, 1); -- Yoga
INSERT INTO SaleItems (SaleId, BookId, Quantity) VALUES (3, 5, 1); -- Spiritual Life

-- Sale 4: David buys Sapiens + Rich Dad (May)
INSERT INTO Sales (Date, PaymentMethod, Subtotal, PaymentFee, FinalTotal, CustomerId)
VALUES ('2026-05-01 09:45:00', 'ETransfer', 27.99, 0.00, 27.99, 4);

INSERT INTO SaleItems (SaleId, BookId, Quantity) VALUES (4, 6, 1); -- Sapiens
INSERT INTO SaleItems (SaleId, BookId, Quantity) VALUES (4, 8, 1); -- Rich Dad

-- Sale 5: Emma buys The Power of Now x2 + Mindset (May)
INSERT INTO Sales (Date, PaymentMethod, Subtotal, PaymentFee, FinalTotal, CustomerId)
VALUES ('2026-05-02 13:00:00', 'Cash', 33.98, 0.00, 33.98, 5);

INSERT INTO SaleItems (SaleId, BookId, Quantity) VALUES (5, 7, 2); -- Power of Now x2
INSERT INTO SaleItems (SaleId, BookId, Quantity) VALUES (5, 9, 1); -- Mindset

-- Sale 6: Alice buys The 7 Habits (May, same customer as sale 1 — good for customer history test)
INSERT INTO Sales (Date, PaymentMethod, Subtotal, PaymentFee, FinalTotal, CustomerId)
VALUES ('2026-05-03 15:30:00', 'Card', 13.99, 0.30, 14.29, 1);

INSERT INTO SaleItems (SaleId, BookId, Quantity) VALUES (6, 10, 1); -- The 7 Habits

-- Sale 7: Walk-in (no customer) buys Sapiens (May)
INSERT INTO Sales (Date, PaymentMethod, Subtotal, PaymentFee, FinalTotal, CustomerId)
VALUES ('2026-05-04 10:00:00', 'Cash', 15.99, 0.00, 15.99, NULL);

INSERT INTO SaleItems (SaleId, BookId, Quantity) VALUES (7, 6, 1); -- Sapiens


-- ============================================================
-- INVENTORY TRANSACTIONS (for history filter testing)
-- ============================================================

-- Atomic Habits restocked, then sold down
INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
VALUES (2, 'increase', 20, 'Weekly restock from supplier', 0, 20, '2026-04-01 08:00:00');

INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
VALUES (2, 'decrease', 17, 'Sold in bulk order', 20, 3, '2026-04-14 12:00:00');

-- Yoga for Beginners: initial stock + damage write-off
INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
VALUES (4, 'increase', 10, 'Initial inventory setup', 0, 10, '2026-04-01 08:00:00');

INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
VALUES (4, 'decrease', 5, 'Water damage — unsellable copies', 10, 5, '2026-04-18 09:30:00');

INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
VALUES (4, 'decrease', 3, 'Sold in store', 5, 2, '2026-04-25 11:15:00');

-- Spiritual Life: restocked once
INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
VALUES (5, 'increase', 15, 'Supplier delivery', 0, 15, '2026-04-01 08:00:00');

INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
VALUES (5, 'decrease', 10, 'Sold over the month', 15, 5, '2026-04-25 11:15:00');

-- The Power of Now: low because of returns + sales
INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
VALUES (7, 'increase', 10, 'Initial stock', 0, 10, '2026-04-01 08:00:00');

INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
VALUES (7, 'decrease', 6, 'Sold in store', 10, 4, '2026-05-02 13:00:00');

-- Sapiens: healthy stock, some transactions for history
INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
VALUES (6, 'increase', 60, 'Bulk supplier order', 0, 60, '2026-04-01 08:00:00');

INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
VALUES (6, 'decrease', 2, 'Sold in store', 60, 58, '2026-05-04 10:00:00');

-- Atomic Habits: May restock attempt
INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
VALUES (2, 'increase', 5, 'Emergency reorder — low stock', 3, 8, '2026-05-03 09:00:00');

INSERT INTO InventoryTransactions (BookId, Type, Quantity, Reason, StockBefore, StockAfter, CreatedDate)
VALUES (2, 'decrease', 5, 'Sold on May 4', 8, 3, '2026-05-04 11:00:00');


-- ============================================================
-- Done. Verify with:
-- SELECT * FROM Books;
-- SELECT * FROM Customers;
-- SELECT * FROM Sales;
-- SELECT * FROM SaleItems;
-- SELECT * FROM InventoryTransactions;
-- ============================================================
