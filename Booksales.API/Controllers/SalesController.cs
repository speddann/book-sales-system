using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Booksales.API.Models;
using Booksales.API.Data;
using Booksales.API.DTOs;

namespace Booksales.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly ISalesService _salesService;
    private readonly AppDbContext _context;

    public SalesController(ISalesService salesService, AppDbContext context)
    {
        _salesService = salesService;
        _context = context;
    }

        [HttpPost]
        public IActionResult CreateSale(Sale sale)
        {

            var response = _salesService.CreateSale(sale);

            if (!response.IsSuccess)
            {
                return BadRequest(response);
            }

            return Ok(response);
        }

        [HttpGet]
        public IActionResult GetSales(DateTime? startDate, DateTime? endDate)
        {
        var query = _context.Sales
            .Include(s => s.Items)
            .ThenInclude(i => i.Book)
            .AsQueryable();

        if (startDate.HasValue)
        {
            query = query.Where(s => s.Date >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(s => s.Date <= endDate.Value);
        }

        var result = query.Select(s => new SaleResponseDto
        {
            SaleId = s.ID, 
            Date = s.Date,
            TotalAmount = s.Items.Sum(i => i.Book!.Price * i.Quantity),
            Items = s.Items.Select(i => new SaleItemDto
            {
                BookTitle = i.Book!.Title,
                Price = i.Book!.Price,
                Quantity = i.Quantity
            }).ToList()
        }).ToList();

        return Ok(result);
        }

        [HttpGet("report")]
        public IActionResult GetSalesReport()
        {
            var report = _context.SaleItems
                .Include(si => si.Book)
                .GroupBy(si => si.Book!.Title)
                .Select(g => new
                {
                    Book = g.Key,
                    TotalSold = g.Sum(i => i.Quantity)
                })
                .ToList();

            return Ok(report);
        
        }

        [HttpGet("top-books")]
        public IActionResult GetTopSellingBooks()
        {
            var topBooks = _context.SaleItems
                .Include(si => si.Book)
                .GroupBy(si => si.Book!.Title)
                .Select(g => new
                {
                    Book = g.Key,
                    TotalSold = g.Sum(x => x.Quantity)
                })
                .OrderByDescending(x => x.TotalSold)
                .Take(5)
                .ToList();

            return Ok(topBooks);
        }

        
    }
