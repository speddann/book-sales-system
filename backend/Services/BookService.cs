using Booksales.API.Common;
using Booksales.API.Data;
using Booksales.API.DTOs;
using Booksales.API.Models;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace Booksales.API.Services;

public class BookService : IBookService
{
    private readonly AppDbContext _context;

    public BookService(AppDbContext context)
    {
        _context = context;
    }

    public CommonResponse<List<BookAdminDto>> GetAllBooks()
    {
        var books = _context.Books
            .ToList()
            .Select(book => ToAdminDto(book))
            .ToList();

        return new CommonResponse<List<BookAdminDto>>
        {
            IsSuccess = true,
            Message = "Books retrieved successfully",
            Data = books
        };
    }

    public CommonResponse<BookAdminDto> GetBookById(int id)
    {
        var book = _context.Books.FirstOrDefault(b => b.Id == id);

        if (book == null)
        {
            throw new NotFoundException("Book not found");
        }

        return new CommonResponse<BookAdminDto>
        {
            IsSuccess = true,
            Message = "Book retrieved successfully",
            Data = ToAdminDto(book)
        };
    }

    public CommonResponse<List<BookPublicDto>> GetPublicBooks()
    {
        var books = _context.Books
            .Where(book => book.Status == "Active" || (string.IsNullOrWhiteSpace(book.Status) && book.IsActive))
            .ToList()
            .Select(book => ToPublicDto(book))
            .ToList();

        return new CommonResponse<List<BookPublicDto>>
        {
            IsSuccess = true,
            Message = "Books retrieved successfully",
            Data = books
        };
    }

    public CommonResponse<BookPublicDto> GetPublicBookById(int id)
    {
        var book = _context.Books.FirstOrDefault(b => b.Id == id);

        if (book == null)
        {
            throw new NotFoundException("Book not found");
        }

        if (book.Status != "Active" && !(string.IsNullOrWhiteSpace(book.Status) && book.IsActive))
        {
            throw new NotFoundException("Book not found");
        }

        return new CommonResponse<BookPublicDto>
        {
            IsSuccess = true,
            Message = "Book retrieved successfully",
            Data = ToPublicDto(book)
        };
    }

    public CommonResponse<BookAdminDto> AddBook(BookUpsertDto request)
    {
        if (request == null)
            throw new BusinessException("Book data is required");

        var book = ToEntity(request);

        NormalizeCatalogFields(book);
        ValidateBook(book);

        _context.Books.Add(book);
        _context.SaveChanges();

        return new CommonResponse<BookAdminDto>
        {
            IsSuccess = true,
            Message = "Book added successfully",
            Data = ToAdminDto(book)
        };
    }

    public CommonResponse<BookAdminDto> UpdateBook(int id, BookUpsertDto request)
    {
        if (request == null)
            throw new BusinessException("Book data is required");

        var updatedBook = ToEntity(request);

        NormalizeCatalogFields(updatedBook);
        ValidateBook(updatedBook);

        var book = _context.Books.FirstOrDefault(b => b.Id == id);

        if (book == null)
        {
            throw new NotFoundException("Book not found");
        }

        book.Title = updatedBook.Title;
        book.Author = updatedBook.Author;
        book.Category = updatedBook.Category;
        book.ISBN = updatedBook.ISBN;
        book.Language = updatedBook.Language;
        book.ShortDescription = updatedBook.ShortDescription;
        book.LongDescription = updatedBook.LongDescription;
        book.CoverImageUrl = updatedBook.CoverImageUrl;
        book.Description = updatedBook.Description;
        book.ImageUrl = updatedBook.ImageUrl;
        book.Price = updatedBook.Price;
        book.CostPrice = updatedBook.CostPrice;
        book.SellingPrice = updatedBook.SellingPrice;
        book.Stock = updatedBook.Stock;
        book.Status = updatedBook.Status;
        book.IsActive = updatedBook.IsActive;
        book.IsFeatured = updatedBook.IsFeatured;
        book.IsBookOfMonth = updatedBook.IsBookOfMonth;
        book.IsNewArrival = updatedBook.IsNewArrival;
        book.IsStaffPick = updatedBook.IsStaffPick;

        _context.SaveChanges();

        return new CommonResponse<BookAdminDto>
        {
            IsSuccess = true,
            Message = "Book updated successfully",
            Data = ToAdminDto(book)
        };
    }

    public CommonResponse<string> DeleteBook(int id)
    {
        var book = _context.Books.FirstOrDefault(b => b.Id == id);

        if (book == null)
        {
            throw new NotFoundException("Book not found");
        }

        var isUsed = _context.SaleItems.Any(si => si.BookId == id);

        if (isUsed)
            throw new BusinessException("Cannot delete book. It is used in sales.");

        _context.Books.Remove(book);
        _context.SaveChanges();

        return new CommonResponse<string>
        {
            IsSuccess = true,
            Message = "Book deleted successfully",
            Data = $"Deleted Book Id: {id}"
        };
    }


    public CommonResponse<BookAdminDto> AdjustStock(int id, StockAdjustmentDto request)
    {
        if (request == null)
            throw new BusinessException("Stock adjustment data is required");

        var transactionType = NormalizeTransactionType(request.TransactionType, request.Type);
        var reasonCategory = NormalizeReasonCategory(request.ReasonCategory, request.Reason);

        if (request.Quantity <= 0)
            throw new BusinessException("Quantity must be greater than zero");

        if (string.IsNullOrWhiteSpace(transactionType))
            throw new BusinessException("Transaction type must be Increase or Decrease");

        if (!InventoryTransaction.ValidTransactionTypes.Contains(transactionType))
            throw new BusinessException("Transaction type must be Increase or Decrease");

        if (string.IsNullOrWhiteSpace(reasonCategory))
            throw new BusinessException("Reason category is required");

        if (!InventoryTransaction.ValidReasonCategories.Contains(reasonCategory))
            throw new BusinessException("Invalid reason category");

        var book = _context.Books.FirstOrDefault(b => b.Id == id);

        if (book == null)
            throw new NotFoundException($"Book with ID {id} not found");

        if (book.Status == "Archived")
            throw new BusinessException("Archived books cannot be adjusted");

        var stockBefore = book.Stock;

        if (transactionType == "Increase")
        {
            book.Stock += request.Quantity;
        }
        else if (transactionType == "Decrease")
        {
            if (book.Stock < request.Quantity)
                throw new BusinessException("Stock cannot go below zero");

            book.Stock -= request.Quantity;
        }

        var stockAfter = book.Stock;
        var transactionDate = request.TransactionDate ?? DateTime.UtcNow;

        var transaction = new InventoryTransaction
        {
            BookId = book.Id,
            Type = transactionType.ToLower(),
            TransactionType = transactionType,
            Quantity = request.Quantity,
            Reason = string.IsNullOrWhiteSpace(request.Reason) ? reasonCategory : request.Reason,
            ReasonCategory = reasonCategory,
            Notes = request.Notes,
            StockBefore = stockBefore,
            StockAfter = stockAfter,
            TransactionDate = transactionDate,
            CreatedDate = DateTime.UtcNow
        };

        _context.InventoryTransactions.Add(transaction);

        _context.SaveChanges();

        return new CommonResponse<BookAdminDto>
        {
            IsSuccess = true,
            Message = "Stock updated successfully",
            Data = ToAdminDto(book)
        };
    }

    public InventoryImportPreviewResponse PreviewInventoryImport(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new BusinessException("Import file is required");

        var rows = ParseInventoryImportFile(file);
        return ValidateInventoryImportRows(rows);
    }

    public CommonResponse<InventoryImportResultDto> ConfirmInventoryImport(InventoryImportConfirmRequest request)
    {
        if (request == null || request.Rows == null || request.Rows.Count == 0)
            throw new BusinessException("Import rows are required");

        var preview = ValidateInventoryImportRows(request.Rows);

        if (preview.ErrorRowCount > 0)
        {
            return new CommonResponse<InventoryImportResultDto>
            {
                IsSuccess = false,
                Message = "Import contains validation errors. No stock was updated.",
                Data = new InventoryImportResultDto
                {
                    TotalRows = preview.TotalRows,
                    ValidRows = preview.ValidRowCount,
                    ErrorRows = preview.ErrorRowCount,
                    ImportedRows = 0,
                    Errors = preview.Errors
                }
            };
        }

        var booksByIsbn = _context.Books
            .Where(book => book.ISBN != null)
            .ToList()
            .ToDictionary(book => book.ISBN!.Trim().ToLowerInvariant());

        foreach (var row in preview.ValidRows)
        {
            var book = booksByIsbn[row.ISBN.Trim().ToLowerInvariant()];
            var stockBefore = book.Stock;

            if (row.TransactionType == "Increase")
                book.Stock += row.Quantity;
            else
                book.Stock -= row.Quantity;

            _context.InventoryTransactions.Add(new InventoryTransaction
            {
                BookId = book.Id,
                Type = row.TransactionType.ToLowerInvariant(),
                TransactionType = row.TransactionType,
                Quantity = row.Quantity,
                Reason = row.ReasonCategory,
                ReasonCategory = row.ReasonCategory,
                Notes = row.Notes,
                StockBefore = stockBefore,
                StockAfter = book.Stock,
                TransactionDate = row.TransactionDate!.Value,
                CreatedDate = DateTime.UtcNow
            });
        }

        _context.SaveChanges();

        return new CommonResponse<InventoryImportResultDto>
        {
            IsSuccess = true,
            Message = "Inventory import completed successfully",
            Data = new InventoryImportResultDto
            {
                TotalRows = preview.TotalRows,
                ValidRows = preview.ValidRowCount,
                ErrorRows = 0,
                ImportedRows = preview.ValidRowCount,
                Errors = new List<InventoryImportErrorDto>()
            }
        };
    }

    public byte[] GenerateInventoryImportTemplate(bool includeCurrentInventory)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Inventory Import");
        var headers = new[]
        {
            "ISBN",
            "BookTitle",
            "Author",
            "Category",
            "Language",
            "CurrentStock",
            "Quantity",
            "TransactionType",
            "ReasonCategory",
            "TransactionDate",
            "Notes"
        };

        for (var i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
        }

        if (includeCurrentInventory)
        {
            var rowNumber = 2;
            var books = _context.Books
                .Where(book => book.Status == "Active" || (string.IsNullOrWhiteSpace(book.Status) && book.IsActive))
                .OrderBy(book => book.Title)
                .ToList();

            foreach (var book in books)
            {
                worksheet.Cell(rowNumber, 1).Value = book.ISBN;
                worksheet.Cell(rowNumber, 2).Value = book.Title;
                worksheet.Cell(rowNumber, 3).Value = book.Author;
                worksheet.Cell(rowNumber, 4).Value = book.Category;
                worksheet.Cell(rowNumber, 5).Value = book.Language;
                worksheet.Cell(rowNumber, 6).Value = book.Stock;
                worksheet.Cell(rowNumber, 8).Value = "Increase";
                worksheet.Cell(rowNumber, 9).Value = "New Shipment";
                worksheet.Cell(rowNumber, 10).Value = DateTime.UtcNow.Date;
                worksheet.Cell(rowNumber, 10).Style.DateFormat.Format = "yyyy-mm-dd";
                rowNumber++;
            }
        }
        else
        {
            worksheet.Cell(2, 1).Value = "9780000000000";
            worksheet.Cell(2, 2).Value = "Sample Book Title";
            worksheet.Cell(2, 3).Value = "Sample Author";
            worksheet.Cell(2, 4).Value = "Sample Category";
            worksheet.Cell(2, 5).Value = "English";
            worksheet.Cell(2, 6).Value = 10;
            worksheet.Cell(2, 7).Value = 5;
            worksheet.Cell(2, 8).Value = "Increase";
            worksheet.Cell(2, 9).Value = "New Shipment";
            worksheet.Cell(2, 10).Value = DateTime.UtcNow.Date;
            worksheet.Cell(2, 10).Style.DateFormat.Format = "yyyy-mm-dd";
            worksheet.Cell(2, 11).Value = "Optional note";
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public List<InventoryTransactionDto> GetInventoryHistory(
        int? bookId,
        string? type,
        DateTime? startDate,
        DateTime? endDate)
    {
        var query = _context.InventoryTransactions
            .Include(t => t.Book)
            .AsQueryable();

        if (bookId.HasValue)
        {
            query = query.Where(t => t.BookId == bookId.Value);
        }

        if (!string.IsNullOrWhiteSpace(type) && type.ToLower() != "all")
        {
            var normalizedType = type.ToLower();
            query = query.Where(t =>
                t.Type.ToLower() == normalizedType ||
                t.TransactionType.ToLower() == normalizedType);
        }

        if (startDate.HasValue)
        {
            query = query.Where(t => t.TransactionDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(t => t.TransactionDate <= endDate.Value);
        }

        return query
            .OrderByDescending(t => t.CreatedDate)
            .Select(t => new InventoryTransactionDto
            {
                Id = t.Id,
                BookId = t.BookId,
                BookTitle = t.Book != null ? t.Book.Title : string.Empty,
                BookISBN = t.Book != null ? t.Book.ISBN : null,
                BookCategory = t.Book != null ? t.Book.Category : null,
                BookLanguage = t.Book != null ? t.Book.Language : null,
                Type = !string.IsNullOrWhiteSpace(t.Type) ? t.Type : t.TransactionType,
                TransactionType = !string.IsNullOrWhiteSpace(t.TransactionType) ? t.TransactionType : t.Type,
                Quantity = t.Quantity,
                StockBefore = t.StockBefore,
                StockAfter = t.StockAfter,
                Reason = t.Reason,
                ReasonCategory = !string.IsNullOrWhiteSpace(t.ReasonCategory) ? t.ReasonCategory : t.Reason,
                Notes = t.Notes,
                TransactionDate = t.TransactionDate,
                CreatedDate = t.CreatedDate
            })
            .ToList();
    }

    private static void ValidateBook(Book book)
    {
        if (string.IsNullOrWhiteSpace(book.Title))
            throw new BusinessException("Title is required");

        if (book.SellingPrice < 0)
            throw new BusinessException("Selling price cannot be negative");

        if (book.CostPrice < 0)
            throw new BusinessException("Cost price cannot be negative");

        if (book.Stock < 0)
            throw new BusinessException("Stock cannot be negative");

        if (!Book.ValidStatuses.Contains(book.Status))
            throw new BusinessException("Status must be Active, Inactive, or Archived");
    }

    private static void NormalizeCatalogFields(Book book)
    {
        book.Status = string.IsNullOrWhiteSpace(book.Status)
            ? (book.IsActive ? "Active" : "Inactive")
            : book.Status.Trim();

        if (book.SellingPrice == 0 && book.Price > 0)
            book.SellingPrice = book.Price;

        book.Price = book.SellingPrice;
        book.IsActive = book.Status == "Active";

        book.ShortDescription ??= book.Description;
        book.Description = book.ShortDescription;

        book.CoverImageUrl ??= book.ImageUrl;
        book.ImageUrl = book.CoverImageUrl;
    }

    private static string NormalizeTransactionType(string? transactionType, string? legacyType)
    {
        var value = string.IsNullOrWhiteSpace(transactionType) ? legacyType : transactionType;
        value = value?.Trim() ?? string.Empty;

        if (value.Equals("increase", StringComparison.OrdinalIgnoreCase))
            return "Increase";

        if (value.Equals("decrease", StringComparison.OrdinalIgnoreCase))
            return "Decrease";

        return value;
    }

    private static string NormalizeReasonCategory(string? reasonCategory, string? legacyReason)
    {
        var value = string.IsNullOrWhiteSpace(reasonCategory) ? legacyReason : reasonCategory;
        return value?.Trim() ?? string.Empty;
    }

    private List<InventoryImportRowDto> ParseInventoryImportFile(IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        using var stream = file.OpenReadStream();

        if (extension == ".xlsx")
            return ParseXlsxInventoryImport(stream);

        if (extension == ".csv")
            return ParseCsvInventoryImport(stream);

        throw new BusinessException("Only .xlsx and .csv files are supported");
    }

    private static List<InventoryImportRowDto> ParseXlsxInventoryImport(Stream stream)
    {
        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheet(1);
        var rows = new List<InventoryImportRowDto>();

        foreach (var row in worksheet.RowsUsed().Skip(1))
        {
            if (row.Cells(1, 11).All(cell => string.IsNullOrWhiteSpace(cell.GetFormattedString())))
                continue;

            var isNewTemplate = !string.Equals(
                worksheet.Cell(1, 2).GetFormattedString().Trim(),
                "Quantity",
                StringComparison.OrdinalIgnoreCase);
            var quantityCell = row.Cell(isNewTemplate ? 7 : 2);

            if (isNewTemplate && string.IsNullOrWhiteSpace(quantityCell.GetFormattedString()))
                continue;

            rows.Add(new InventoryImportRowDto
            {
                RowNumber = row.RowNumber(),
                ISBN = row.Cell(1).GetFormattedString().Trim(),
                BookTitle = isNewTemplate ? NullIfWhiteSpace(row.Cell(2).GetFormattedString()) : null,
                Author = isNewTemplate ? NullIfWhiteSpace(row.Cell(3).GetFormattedString()) : null,
                Category = isNewTemplate ? NullIfWhiteSpace(row.Cell(4).GetFormattedString()) : null,
                Language = isNewTemplate ? NullIfWhiteSpace(row.Cell(5).GetFormattedString()) : null,
                CurrentStock = isNewTemplate && TryReadInt(row.Cell(6), out var currentStock) ? currentStock : null,
                Quantity = TryReadInt(quantityCell, out var quantity) ? quantity : 0,
                TransactionType = row.Cell(isNewTemplate ? 8 : 3).GetFormattedString().Trim(),
                ReasonCategory = row.Cell(isNewTemplate ? 9 : 4).GetFormattedString().Trim(),
                TransactionDate = TryReadDate(row.Cell(isNewTemplate ? 10 : 5), out var transactionDate) ? transactionDate : null,
                Notes = NullIfWhiteSpace(row.Cell(isNewTemplate ? 11 : 6).GetFormattedString())
            });
        }

        return rows;
    }

    private static List<InventoryImportRowDto> ParseCsvInventoryImport(Stream stream)
    {
        using var reader = new StreamReader(stream);
        var rows = new List<InventoryImportRowDto>();
        var rowNumber = 0;

        while (!reader.EndOfStream)
        {
            rowNumber++;
            var line = reader.ReadLine();

            if (rowNumber == 1 || string.IsNullOrWhiteSpace(line))
                continue;

            var columns = SplitCsvLine(line);
            var isNewTemplate = columns.Count > 6;
            var quantityValue = GetColumn(columns, isNewTemplate ? 6 : 1);

            if (isNewTemplate && string.IsNullOrWhiteSpace(quantityValue))
                continue;

            rows.Add(new InventoryImportRowDto
            {
                RowNumber = rowNumber,
                ISBN = GetColumn(columns, 0),
                BookTitle = isNewTemplate ? NullIfWhiteSpace(GetColumn(columns, 1)) : null,
                Author = isNewTemplate ? NullIfWhiteSpace(GetColumn(columns, 2)) : null,
                Category = isNewTemplate ? NullIfWhiteSpace(GetColumn(columns, 3)) : null,
                Language = isNewTemplate ? NullIfWhiteSpace(GetColumn(columns, 4)) : null,
                CurrentStock = isNewTemplate && int.TryParse(GetColumn(columns, 5), out var currentStock) ? currentStock : null,
                Quantity = int.TryParse(quantityValue, out var quantity) ? quantity : 0,
                TransactionType = GetColumn(columns, isNewTemplate ? 7 : 2),
                ReasonCategory = GetColumn(columns, isNewTemplate ? 8 : 3),
                TransactionDate = DateTime.TryParse(GetColumn(columns, isNewTemplate ? 9 : 4), CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)
                    ? date
                    : null,
                Notes = NullIfWhiteSpace(GetColumn(columns, isNewTemplate ? 10 : 5))
            });
        }

        return rows;
    }

    private InventoryImportPreviewResponse ValidateInventoryImportRows(List<InventoryImportRowDto> rows)
    {
        var response = new InventoryImportPreviewResponse
        {
            TotalRows = rows.Count
        };

        var duplicateIsbns = rows
            .Where(row => !string.IsNullOrWhiteSpace(row.ISBN))
            .GroupBy(row => row.ISBN.Trim().ToLowerInvariant())
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToHashSet();

        var booksByIsbn = _context.Books
            .Where(book => book.ISBN != null)
            .ToList()
            .GroupBy(book => book.ISBN!.Trim().ToLowerInvariant())
            .ToDictionary(group => group.Key, group => group.First());

        foreach (var row in rows)
        {
            var errors = ValidateInventoryImportRow(row, booksByIsbn, duplicateIsbns);

            if (errors.Count == 0)
            {
                var book = booksByIsbn[row.ISBN.Trim().ToLowerInvariant()];
                row.BookTitle = book.Title;
                row.Author = book.Author;
                row.Category = book.Category;
                row.Language = book.Language;
                row.CurrentStock = book.Stock;
                row.StockAfter = row.TransactionType == "Increase"
                    ? book.Stock + row.Quantity
                    : book.Stock - row.Quantity;
                row.Status = "Valid";
                row.ErrorMessage = null;
                response.ValidRows.Add(row);
                continue;
            }

            row.Status = "Error";
            row.ErrorMessage = string.Join("; ", errors);
            response.ErrorRows.Add(row);

            response.Errors.AddRange(errors.Select(message => new InventoryImportErrorDto
            {
                RowNumber = row.RowNumber,
                ISBN = row.ISBN,
                Message = message
            }));
        }

        response.ValidRowCount = response.ValidRows.Count;
        response.ErrorRowCount = response.ErrorRows.Count;
        return response;
    }

    private static List<string> ValidateInventoryImportRow(
        InventoryImportRowDto row,
        Dictionary<string, Book> booksByIsbn,
        HashSet<string> duplicateIsbns)
    {
        var errors = new List<string>();
        var normalizedIsbn = row.ISBN?.Trim().ToLowerInvariant() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(row.ISBN))
        {
            errors.Add("ISBN is required");
        }
        else if (duplicateIsbns.Contains(normalizedIsbn))
        {
            errors.Add("Duplicate ISBN in import file");
        }
        else if (!booksByIsbn.TryGetValue(normalizedIsbn, out var book))
        {
            row.BookTitle = "-";
            row.CurrentStock = null;
            row.StockAfter = null;
            errors.Add("Book not found for ISBN");
        }
        else
        {
            row.BookTitle = book.Title;
            row.Author = book.Author;
            row.Category = book.Category;
            row.Language = book.Language;
            row.CurrentStock = book.Stock;

            if (book.Status == "Archived")
                errors.Add("Archived books cannot be adjusted");

            var normalizedType = NormalizeTransactionType(row.TransactionType, null);
            if (normalizedType == "Increase" && row.Quantity > 0)
                row.StockAfter = book.Stock + row.Quantity;
            else if (normalizedType == "Decrease" && row.Quantity > 0 && book.Stock >= row.Quantity)
                row.StockAfter = book.Stock - row.Quantity;
            else
                row.StockAfter = null;

            if (normalizedType == "Decrease" && book.Stock < row.Quantity)
                errors.Add("Decrease cannot make stock negative");
        }

        if (row.Quantity <= 0)
            errors.Add("Quantity must be greater than 0");

        row.TransactionType = NormalizeTransactionType(row.TransactionType, null);
        if (!InventoryTransaction.ValidTransactionTypes.Contains(row.TransactionType))
            errors.Add("TransactionType must be Increase or Decrease");

        row.ReasonCategory = NormalizeReasonCategoryToValid(row.ReasonCategory);
        if (string.IsNullOrWhiteSpace(row.ReasonCategory))
            errors.Add("ReasonCategory is required");
        else if (!InventoryTransaction.ValidReasonCategories.Contains(row.ReasonCategory))
            errors.Add("Invalid ReasonCategory");

        if (!row.TransactionDate.HasValue)
            errors.Add("TransactionDate is required");

        return errors;
    }

    private static string NormalizeReasonCategoryToValid(string? value)
    {
        value = value?.Trim() ?? string.Empty;
        var match = InventoryTransaction.ValidReasonCategories
            .FirstOrDefault(category => category.Equals(value, StringComparison.OrdinalIgnoreCase));

        return match ?? value;
    }

    private static bool TryReadInt(IXLCell cell, out int value)
    {
        if (cell.TryGetValue(out value))
            return true;

        return int.TryParse(cell.GetFormattedString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out value);
    }

    private static bool TryReadDate(IXLCell cell, out DateTime value)
    {
        if (cell.TryGetValue(out value))
            return true;

        return DateTime.TryParse(cell.GetFormattedString(), CultureInfo.InvariantCulture, DateTimeStyles.None, out value);
    }

    private static string? NullIfWhiteSpace(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string GetColumn(List<string> columns, int index)
    {
        return index < columns.Count ? columns[index].Trim() : string.Empty;
    }

    private static List<string> SplitCsvLine(string? line)
    {
        var columns = new List<string>();
        var current = new List<char>();
        var inQuotes = false;

        foreach (var character in line ?? string.Empty)
        {
            if (character == '"')
            {
                inQuotes = !inQuotes;
                continue;
            }

            if (character == ',' && !inQuotes)
            {
                columns.Add(new string(current.ToArray()));
                current.Clear();
                continue;
            }

            current.Add(character);
        }

        columns.Add(new string(current.ToArray()));
        return columns;
    }

    private static Book ToEntity(BookUpsertDto request)
    {
        return new Book
        {
            Title = request.Title,
            Author = request.Author,
            Category = request.Category,
            ISBN = request.ISBN,
            Language = request.Language,
            ShortDescription = request.ShortDescription,
            LongDescription = request.LongDescription,
            CoverImageUrl = request.CoverImageUrl,
            Description = request.Description,
            ImageUrl = request.ImageUrl,
            Price = request.Price,
            CostPrice = request.CostPrice,
            SellingPrice = request.SellingPrice,
            Stock = request.Stock,
            Status = request.Status,
            IsActive = request.IsActive,
            IsFeatured = request.IsFeatured,
            IsBookOfMonth = request.IsBookOfMonth,
            IsNewArrival = request.IsNewArrival,
            IsStaffPick = request.IsStaffPick
        };
    }

    private static BookPublicDto ToPublicDto(Book book)
    {
        var sellingPrice = book.SellingPrice > 0 ? book.SellingPrice : book.Price;

        return new BookPublicDto
        {
            Id = book.Id,
            Title = book.Title,
            Author = book.Author,
            Category = book.Category,
            ISBN = book.ISBN,
            Language = book.Language,
            ShortDescription = book.ShortDescription ?? book.Description,
            LongDescription = book.LongDescription,
            CoverImageUrl = book.CoverImageUrl ?? book.ImageUrl,
            Price = sellingPrice,
            SellingPrice = sellingPrice,
            Stock = book.Stock,
            Status = string.IsNullOrWhiteSpace(book.Status)
                ? (book.IsActive ? "Active" : "Inactive")
                : book.Status,
            IsFeatured = book.IsFeatured,
            IsBookOfMonth = book.IsBookOfMonth,
            IsNewArrival = book.IsNewArrival,
            IsStaffPick = book.IsStaffPick
        };
    }

    private static BookAdminDto ToAdminDto(Book book)
    {
        var publicDto = ToPublicDto(book);

        return new BookAdminDto
        {
            Id = publicDto.Id,
            Title = publicDto.Title,
            Author = publicDto.Author,
            Category = publicDto.Category,
            ISBN = publicDto.ISBN,
            Language = publicDto.Language,
            ShortDescription = publicDto.ShortDescription,
            LongDescription = publicDto.LongDescription,
            CoverImageUrl = publicDto.CoverImageUrl,
            Price = publicDto.Price,
            SellingPrice = publicDto.SellingPrice,
            Stock = publicDto.Stock,
            Status = publicDto.Status,
            IsFeatured = publicDto.IsFeatured,
            IsBookOfMonth = publicDto.IsBookOfMonth,
            IsNewArrival = publicDto.IsNewArrival,
            IsStaffPick = publicDto.IsStaffPick,
            CostPrice = book.CostPrice,
            Description = book.Description,
            ImageUrl = book.ImageUrl,
            IsActive = book.IsActive
        };
    }
}
