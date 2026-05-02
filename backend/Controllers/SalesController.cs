using Booksales.API.Common;
using Booksales.API.DTOs;
using Booksales.API.Models;
using Booksales.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Booksales.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly ISalesService _salesService;

    public SalesController(ISalesService salesService)
    {
        _salesService = salesService;
    }

    // POST: api/sales
    [HttpPost]
    public IActionResult CreateSale(Sale sale)
    {
        var response = _salesService.CreateSale(sale);
        return Ok(response);
    }

    // GET: api/sales?startDate=...&endDate=...
    [HttpGet]
    public IActionResult GetSales([FromQuery] DateTime? startDate,
                                 [FromQuery] DateTime? endDate, 
                                 [FromQuery] string? range)
    {
        if (startDate.HasValue && endDate.HasValue && startDate > endDate)
            throw new BusinessException("startDate must be before or equal to endDate");

        var result = _salesService.GetSales(startDate, endDate, range);
        return Ok(result);
    }

    // GET: api/sales/report
    [HttpGet("report")]
    public IActionResult GetSalesReport()
    {
        var report = _salesService.GetSalesReport();
        return Ok(report);
    }

    // GET: api/sales/top-books
    [HttpGet("top-books")]
    public IActionResult GetTopSellingBooks()
    {
        var topBooks = _salesService.GetTopSellingBooks();
        return Ok(topBooks);
    }
}

