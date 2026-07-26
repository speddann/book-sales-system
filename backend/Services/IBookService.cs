using Booksales.API.Common;
using Booksales.API.DTOs;
using Microsoft.AspNetCore.Http;

namespace Booksales.API.Services;

public interface IBookService
{
    CommonResponse<BookAdminDto> GetBookById(int id);
    CommonResponse<List<BookAdminDto>> GetAllBooks();
    CommonResponse<BookPublicDto> GetPublicBookById(int id);
    CommonResponse<List<BookPublicDto>> GetPublicBooks();
    CommonResponse<BookAdminDto> AddBook(BookUpsertDto book);
    CommonResponse<BookAdminDto> UpdateBook(int id, BookUpsertDto book);
    CommonResponse<string> DeleteBook(int id);

    CommonResponse<BookAdminDto> AdjustStock(int id, StockAdjustmentDto request);
    InventoryImportPreviewResponse PreviewInventoryImport(IFormFile file);
    CommonResponse<InventoryImportResultDto> ConfirmInventoryImport(InventoryImportConfirmRequest request);
    byte[] GenerateInventoryImportTemplate(bool includeCurrentInventory);
    List<InventoryTransactionDto> GetInventoryHistory(
        int? bookId,
        string? type,
        DateTime? startDate,
        DateTime? endDate
    );

}


