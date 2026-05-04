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

    // GET: api/sales/dashboard
    [HttpGet("dashboard")]
    public IActionResult GetDashboard()
    {
        var result = _salesService.GetDashboard();
        return Ok(result);
    }

    // POST: api/sales/{id}/return
    [HttpPost("{id}/return")]
    public IActionResult ReturnSale(int id)
    {
        var result = _salesService.ReturnSale(id);
        return Ok(result);
    }

    [HttpPost("{saleId:int}/return-items")]
    public IActionResult ReturnSaleItems(int saleId, ReturnSaleItemsDto request)
    {
        if (saleId <= 0)
            throw new BusinessException("Sale id must be greater than zero");

        var result = _salesService.ReturnSaleItems(saleId, request);
        return Ok(result);
    }
}

