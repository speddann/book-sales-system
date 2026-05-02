using Booksales.API.Common;
using Booksales.API.Models;
using Booksales.API.Services;
using Microsoft.AspNetCore.Mvc;
using Booksales.API.DTOs;

namespace Booksales.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly IBookService _bookService;

    public BooksController(IBookService bookService)
    {
        _bookService = bookService;
    }

    // GET: api/books
    [HttpGet]
    public IActionResult Get()
    {
        var result = _bookService.GetAllBooks();
        return Ok(result);
    }

    // GET: api/books/5
    [HttpGet("{id:int}")]
    public IActionResult GetById(int id)
    {
        if (id <= 0)
            throw new BusinessException("Id must be greater than zero");

        var result = _bookService.GetBookById(id);
        return Ok(result);
    }

    // POST: api/books
    [HttpPost]
    public IActionResult Add(Book book)
    {
        var result = _bookService.AddBook(book);
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    // PUT: api/books/5
    [HttpPut("{id:int}")]
    public IActionResult UpdateBook(int id, Book book)
    {
        if (id <= 0)
            throw new BusinessException("Id must be greater than zero");

        var result = _bookService.UpdateBook(id, book);
        return Ok(result);
    }

    // DELETE: api/books/5
    [HttpDelete("{id:int}")]
    public IActionResult DeleteBook(int id)
    {
        if (id <= 0)
            throw new BusinessException("Id must be greater than zero");

        var result = _bookService.DeleteBook(id);
        return Ok(result);
    }

   [HttpPost("{id:int}/stock-adjustment")]
    public IActionResult AdjustStock(int id, StockAdjustmentDto request)
    {
        if (id <= 0)
            throw new BusinessException("Id must be greater than zero");

        var result = _bookService.AdjustStock(id, request);
        return Ok(result);
    }
}
