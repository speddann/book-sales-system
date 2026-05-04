using Booksales.API.Common;
using Booksales.API.Models;
using Booksales.API.DTOs;

namespace Booksales.API.Services;

public interface IBookService
{
    CommonResponse<Book> GetBookById(int id);
    CommonResponse<List<Book>> GetAllBooks();
    CommonResponse<Book> AddBook(Book book);
    CommonResponse<Book> UpdateBook(int id, Book book);
    CommonResponse<string> DeleteBook(int id);

    CommonResponse<Book> AdjustStock(int id, StockAdjustmentDto request);
    List<InventoryTransactionDto> GetInventoryHistory(
        int? bookId,
        string? type,
        DateTime? startDate,
        DateTime? endDate
    );

}


