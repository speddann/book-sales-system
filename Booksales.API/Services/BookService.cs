using Booksales.API.Common;
using Booksales.API.Data;
using Booksales.API.Models;

namespace Booksales.API.Services;

public class BookService : IBookService
{
    private readonly AppDbContext _context;

    public BookService(AppDbContext context)
    {
        _context = context;
    }

    public CommonResponse<List<Book>> GetAllBooks()
    {
        var books = _context.Books.ToList();

        return new CommonResponse<List<Book>>
        {
            IsSuccess = true,
            Message = "Books retrieved successfully",
            Data = books
        };
    }

    public CommonResponse<Book> GetBookById(int id)
    {
        var book = _context.Books.FirstOrDefault(b => b.Id == id);

        if (book == null)
        {
            throw new NotFoundException("Book not found");
        }

        return new CommonResponse<Book>
        {
            IsSuccess = true,
            Message = "Book retrieved successfully",
            Data = book
        };
    }

    public CommonResponse<Book> AddBook(Book book)
    {
        if (book == null)
            throw new BusinessException("Book data is required");

        if (book.Id != 0)
            throw new BusinessException("Do not set Id when creating a book");

        if (string.IsNullOrWhiteSpace(book.Title))
            throw new BusinessException("Title is required");

        if (book.Price < 0)
            throw new BusinessException("Price cannot be negative");

        if (book.Stock < 0)
            throw new BusinessException("Stock cannot be negative");

        _context.Books.Add(book);
        _context.SaveChanges();

        return new CommonResponse<Book>
        {
            IsSuccess = true,
            Message = "Book added successfully",
            Data = book
        };
    }

    public CommonResponse<Book> UpdateBook(int id, Book updatedBook)
    {
        if (updatedBook == null)
            throw new BusinessException("Book data is required");

        if (string.IsNullOrWhiteSpace(updatedBook.Title))
            throw new BusinessException("Title is required");

        if (updatedBook.Price < 0)
            throw new BusinessException("Price cannot be negative");

        if (updatedBook.Stock < 0)
            throw new BusinessException("Stock cannot be negative");

        var book = _context.Books.FirstOrDefault(b => b.Id == id);

        if (book == null)
        {
            throw new NotFoundException("Book not found");
        }

        book.Title = updatedBook.Title;
        book.Author = updatedBook.Author;
        book.Price = updatedBook.Price;
        book.Stock = updatedBook.Stock;

        _context.SaveChanges();

        return new CommonResponse<Book>
        {
            IsSuccess = true,
            Message = "Book updated successfully",
            Data = book
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
}