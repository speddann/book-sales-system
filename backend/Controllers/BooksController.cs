using Booksales.API.Common;
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

    // GET: api/books/public
    [HttpGet("public")]
    public IActionResult GetPublic()
    {
        var result = _bookService.GetPublicBooks();
        return Ok(result);
    }

    // GET: api/books/public/5
    [HttpGet("public/{id:int}")]
    public IActionResult GetPublicById(int id)
    {
        if (id <= 0)
            throw new BusinessException("Id must be greater than zero");

        var result = _bookService.GetPublicBookById(id);
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
    public IActionResult Add(BookUpsertDto book)
    {
        var result = _bookService.AddBook(book);
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    // PUT: api/books/5
    [HttpPut("{id:int}")]
    public IActionResult UpdateBook(int id, BookUpsertDto book)
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

    [HttpGet("inventory-history")]
    public IActionResult GetInventoryHistory(
        int? bookId,
        string? type,
        DateTime? startDate,
        DateTime? endDate
    )
    {
        var result = _bookService.GetInventoryHistory(bookId, type, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("inventory-import/template")]
    public IActionResult DownloadInventoryImportTemplate([FromQuery] string type = "current")
    {
        var includeCurrentInventory = !type.Equals("blank", StringComparison.OrdinalIgnoreCase);
        var file = _bookService.GenerateInventoryImportTemplate(includeCurrentInventory);
        var fileName = includeCurrentInventory
            ? "current-inventory-import-template.xlsx"
            : "blank-inventory-import-template.xlsx";

        return File(
            file,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }

    [HttpPost("inventory-import/preview")]
    public IActionResult PreviewInventoryImport([FromForm] IFormFile file)
    {
        var result = _bookService.PreviewInventoryImport(file);
        return Ok(result);
    }

    [HttpPost("inventory-import/confirm")]
    public IActionResult ConfirmInventoryImport(InventoryImportConfirmRequest request)
    {
        var result = _bookService.ConfirmInventoryImport(request);
        return Ok(result);
    }
}
