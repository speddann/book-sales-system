using Booksales.API.Common;
using Booksales.API.Data;
using Booksales.API.DTOs;
using Booksales.API.Models;
using Booksales.API.Validators;
using Microsoft.EntityFrameworkCore;

namespace Booksales.API.Services;

public class SalesService : ISalesService
{
    private readonly AppDbContext _context;

    public SalesService(AppDbContext context)
    {
        _context = context;
    }

    public CommonResponse<SaleResponseDto> CreateSale(Sale sale)
    {
        if (sale == null)
            throw new BusinessException("Sale data is required");

        // Always set the date server-side so clients can't fake timestamps
        sale.Id = 0;
        sale.Date = DateTime.UtcNow;

        var validationResult = SaleValidator.Validate(sale);
        if (validationResult != "Valid")
            throw new BusinessException(validationResult);

        decimal subtotal = 0;

        foreach (var item in sale.Items)
        {
            var book = _context.Books.FirstOrDefault(b => b.Id == item.BookId);
            if (book == null)
                throw new NotFoundException($"Book with ID {item.BookId} not found");

            if (book.Stock < item.Quantity)
                throw new BusinessException($"Not enough stock for '{book.Title}'. Available: {book.Stock}");

            subtotal += book.Price * item.Quantity;
            book.Stock -= item.Quantity;
        }

        decimal paymentFee = 0;
        if (sale.PaymentMethod?.ToLower() == "etransfer")
        {
            paymentFee = subtotal * 0.05m;
        }

        sale.Subtotal = subtotal;
        sale.PaymentFee = paymentFee;
        sale.FinalTotal = subtotal + paymentFee;

        _context.Sales.Add(sale);
        _context.SaveChanges();

        // Re-load items with book details so we can return a full receipt DTO
        var savedSale = _context.Sales
            .Include(s => s.Items)
            .ThenInclude(i => i.Book)
            .First(s => s.Id == sale.Id);

        var dto = new SaleResponseDto
        {
            SaleId = savedSale.Id,
            Date = savedSale.Date,
            Subtotal = savedSale.Subtotal,
            PaymentMethod = savedSale.PaymentMethod,
            PaymentFee = savedSale.PaymentFee,
            FinalTotal = savedSale.FinalTotal,
            TotalAmount = savedSale.FinalTotal,
            Items = savedSale.Items.Select(i => new SaleItemDto
            {
                BookTitle = i.Book!.Title,
                Price = i.Book!.Price,
                Quantity = i.Quantity
            }).ToList()
        };

        return new CommonResponse<SaleResponseDto>
        {
            IsSuccess = true,
            Message = "Sale created successfully",
            Data = dto
        };
    }

    public List<SaleResponseDto> GetSales(DateTime? startDate, DateTime? endDate, string? range)
    {
        var query = _context.Sales
            .Include(s => s.Items)
            .ThenInclude(i => i.Book)
            .AsQueryable();

        var now = DateTime.UtcNow;

        if (!startDate.HasValue && !endDate.HasValue && string.IsNullOrWhiteSpace(range))
        {
            // Default to last 7 days if no filters provided
            query = query.Where(s => s.Date >= now.AddDays(-7));
        }


        // Predefined range filter
        if (!string.IsNullOrWhiteSpace(range))
        {
            switch (range.ToLower())
            {
                case "7days":
                    query = query.Where(s => s.Date >= now.AddDays(-7));
                    break;

                case "1month":
                    query = query.Where(s => s.Date >= now.AddMonths(-1));
                    break;

                case "3months":
                    query = query.Where(s => s.Date >= now.AddMonths(-3));
                    break;

                case "12months":
                    query = query.Where(s => s.Date >= now.AddMonths(-12));
                    break;

                case "all":
                default:
                    break;
            }
        }

        if (startDate.HasValue)
            query = query.Where(s => s.Date >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(s => s.Date <= endDate.Value);

        return query
            .OrderByDescending(s => s.Date)
            .Select(s => new SaleResponseDto
            {
                SaleId = s.Id,
                Date = s.Date,
                CustomerName = s.Customer != null ? s.Customer.Name : "Guest",
                

                Subtotal = s.Subtotal,
                PaymentMethod = s.PaymentMethod,
                PaymentFee = s.PaymentFee,
                FinalTotal = s.FinalTotal,
                TotalAmount = s.FinalTotal,

                Items = s.Items.Select(i => new SaleItemDto
                {
                    BookTitle = i.Book!.Title,
                    Price = i.Book!.Price,
                    Quantity = i.Quantity
                }).ToList()
            })
            .ToList();
    }

    public List<SalesReportItemDto> GetSalesReport()
    {
        return _context.SaleItems
            .Include(si => si.Book)
            .GroupBy(si => si.Book!.Title)
            .Select(g => new SalesReportItemDto
            {
                Book = g.Key,
                TotalSold = g.Sum(i => i.Quantity)
            })
            .ToList();
    }

    public List<SalesReportItemDto> GetTopSellingBooks(int count = 5)
    {
        return _context.SaleItems
            .Include(si => si.Book)
            .GroupBy(si => si.Book!.Title)
            .Select(g => new SalesReportItemDto
            {
                Book = g.Key,
                TotalSold = g.Sum(i => i.Quantity)
            })
            .OrderByDescending(x => x.TotalSold)
            .Take(count)
            .ToList();
    }
}