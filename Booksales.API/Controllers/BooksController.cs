using Microsoft.AspNetCore.Mvc;
using Booksales.API.Models;
using Booksales.API.Data;

namespace Booksales.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly AppDbContext _context;

    // Constructor (Dependency Injection)
    public BooksController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/books
    [HttpGet]
    public IActionResult Get()
    {
        var books = _context.Books.ToList();
        return Ok(books);
    }

    // POST: api/books
    [HttpPost]
    public IActionResult Add(Book book)
    {
        _context.Books.Add(book);
        _context.SaveChanges();

        return Ok(book);
    }
}