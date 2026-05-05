using Booksales.API.Data;
using Booksales.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    public IActionResult GetCustomers(string? search)
    {
        var query = _context.Customers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();

            query = query.Where(c =>
                c.Name.ToLower().Contains(term) ||
                (c.Phone != null && c.Phone.ToLower().Contains(term)) ||
                (c.Email != null && c.Email.ToLower().Contains(term))
            );
        }

        var customers = query
            .OrderBy(c => c.Name)
            .ToList();

        return Ok(customers);
    }

    [HttpPost]
    public IActionResult AddCustomer(Customer customer)
    {
        if (string.IsNullOrWhiteSpace(customer.Name))
        {
            return BadRequest(new { message = "Customer name is required." });
        }

        customer.CreatedDate = DateTime.UtcNow;

        _context.Customers.Add(customer);
        _context.SaveChanges();

        return Ok(customer);
    }

    [HttpPut("{id}")]
    public IActionResult UpdateCustomer(int id, Customer customer)
    {
        var existingCustomer = _context.Customers.Find(id);

        if (existingCustomer == null)
        {
            return NotFound(new { message = "Customer not found." });
        }

        existingCustomer.Name = customer.Name;
        existingCustomer.Phone = customer.Phone;
        existingCustomer.Email = customer.Email;

        _context.SaveChanges();

        return Ok(existingCustomer);
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteCustomer(int id)
    {
        var customer = _context.Customers.Find(id);

        if (customer == null)
        {
            return NotFound(new { message = "Customer not found." });
        }

        _context.Customers.Remove(customer);
        _context.SaveChanges();

        return Ok(new { message = "Customer deleted successfully." });
    }

    [HttpGet("{id}/summary")]
    public IActionResult GetCustomerSummary(int id)
    {
        var customer = _context.Customers.Find(id);

        if (customer == null)
        {
            return NotFound(new { message = "Customer not found." });
        }

        var sales = _context.Sales
            .Include(s => s.Items)
            .ThenInclude(i => i.Book)
            .Where(s => s.CustomerId == id)
            .OrderByDescending(s => s.Date)
            .ToList();

        var summary = new
        {
            Customer = customer,
            TotalOrders = sales.Count,
            TotalSpent = sales.Sum(s => s.FinalTotal),
            LastPurchaseDate = sales.FirstOrDefault()?.Date,
            Orders = sales.Select(s => new
            {
                s.Id,
                s.Date,
                s.PaymentMethod,
                s.FinalTotal,
                Items = s.Items.Select(i => new
                {
                    BookTitle = i.Book != null ? i.Book.Title : "",
                    i.Quantity
                })
            })
        };

        return Ok(summary);
    }
}
