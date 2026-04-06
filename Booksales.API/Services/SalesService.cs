using Booksales.API.Data;
using Booksales.API.Models;
using Microsoft.EntityFrameworkCore;
using Booksales.API.Common;

public class SalesService : ISalesService
{
    private readonly AppDbContext _context;

    public SalesService(AppDbContext context)
    {
        _context = context;
    }

    public CommonResponse<Sale> CreateSale(Sale sale)
    {
        var validator = new SaleValidator();
        var validationResult = validator.Validate(sale);

        if (validationResult != "Valid")
        {
            return new CommonResponse<Sale>
            
            {
                IsSuccess = false,
                Message = validationResult,
                Data = null
            };

        }

        foreach (var item in sale.Items)
        {
            var book =_context.Books.FirstOrDefault(b => b.ID == item.BookID);
            if (book ==null)
            {
                return new CommonResponse<Sale>
                {
                    IsSuccess = false,
                    Message = $"Book with ID {item.BookID} not found",
                    Data = null
                };
            } 
            if (book.Stock < item.Quantity)
            {
                return new CommonResponse<Sale>
                {
                    IsSuccess = false,
                    Message = $"Not enough stock for book {book.Title}",
                    Data = null
                };
            }
            
            book.Stock -= item.Quantity;
        }

        _context.Sales.Add(sale);
        _context.SaveChanges();
        return new CommonResponse<Sale>
        {
            IsSuccess = true,
            Message = "Sale created successfully",
            Data = sale
        };
    }

    public List<Sale> GetSales(DateTime? startDate, DateTime? endDate)
    {
        var query = _context.Sales
            .Include(s => s.Items)
            .ThenInclude(i => i.Book)
            .AsQueryable();

        if (startDate.HasValue)
            query = query.Where(s => s.Date >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(s => s.Date <= endDate.Value);

        return query.ToList();
    }
}