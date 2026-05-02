using Booksales.API.Common;
using Booksales.API.Data;
using Booksales.API.DTOs;
using Booksales.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace Booksales.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _context;

    public CustomersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult GetCustomers()
    {
        var customers = _context.Set<Customer>()
            .OrderByDescending(c => c.CreatedDate)
            .ToList();

        return Ok(customers);
    }

    [HttpGet("search")]
    public IActionResult SearchCustomers([FromQuery] string? term)
    {
        if (string.IsNullOrWhiteSpace(term))
        {
            return Ok(new List<Customer>());
        }

        var normalized = term.Trim().ToLower();

        var customers = _context.Set<Customer>()
            .Where(c => c.Name.ToLower().Contains(normalized)
                     || (c.Phone != null && c.Phone.ToLower().Contains(normalized))
                     || (c.Email != null && c.Email.ToLower().Contains(normalized)))
            .OrderByDescending(c => c.CreatedDate)
            .ToList();

        return Ok(customers);
    }

    [HttpPost]
    public IActionResult CreateCustomer([FromBody] Customer customer)
    {
        if (customer == null)
        {
            return BadRequest("Customer data is required.");
        }

        if (string.IsNullOrWhiteSpace(customer.Name))
        {
            return BadRequest("Customer name is required.");
        }

        customer.Id = 0;
        customer.Name = customer.Name.Trim();
        customer.CreatedDate = DateTime.UtcNow;

        _context.Set<Customer>().Add(customer);
        _context.SaveChanges();

        return CreatedAtAction(nameof(GetCustomers), new { id = customer.Id }, customer);
    }

    [HttpGet("{id}/summary")]
    public IActionResult GetCustomerSummary(int id)
    {
        var customer = _context.Customers.FirstOrDefault(c => c.Id == id);

        if (customer == null)
            throw new NotFoundException($"Customer with ID {id} not found");

        var sales = _context.Sales
            .Where(s => s.CustomerId == id)
            .ToList();

        var summary = new CustomerSummaryDto
        {
            CustomerId = customer.Id,
            CustomerName = customer.Name,
            TotalOrders = sales.Count,
            TotalSpent = sales.Sum(s => s.FinalTotal),
            LastPurchaseDate = sales
                .OrderByDescending(s => s.Date)
                .Select(s => (DateTime?)s.Date)
                .FirstOrDefault()
        };

        return Ok(summary);
    }
}
