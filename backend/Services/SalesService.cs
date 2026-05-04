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
                SaleItemId = i.Id,
                BookTitle = i.Book!.Title,
                Price = i.Book!.Price,
                Quantity = i.Quantity,
                ReturnedQuantity = i.ReturnedQuantity
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
                Status = s.Status,
                

                Subtotal = s.Subtotal,
                PaymentMethod = s.PaymentMethod,
                PaymentFee = s.PaymentFee,
                FinalTotal = s.FinalTotal,
                TotalAmount = s.FinalTotal,

                Items = s.Items.Select(i => new SaleItemDto
                {
                    SaleItemId = i.Id,
                    BookTitle = i.Book!.Title,
                    Price = i.Book!.Price,
                    Quantity = i.Quantity,
                    ReturnedQuantity = i.ReturnedQuantity
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

    public CommonResponse<SaleResponseDto> ReturnSale(int saleId)
    {
        var sale = _context.Sales
            .Include(s => s.Items)
            .ThenInclude(i => i.Book)
            .FirstOrDefault(s => s.Id == saleId);

        if (sale == null)
            throw new NotFoundException($"Sale with ID {saleId} not found");

        if (sale.Status == "Returned")
            throw new BusinessException("This order has already been returned.");

        // Reverse stock for each item
        foreach (var item in sale.Items)
        {
            if (item.Book != null)
                item.Book.Stock += item.Quantity;
        }

        sale.Status = "Returned";
        _context.SaveChanges();

        return new CommonResponse<SaleResponseDto>
        {
            IsSuccess = true,
            Message = $"Order #{saleId} has been returned. Stock restored.",
            Data = new SaleResponseDto
            {
                SaleId = sale.Id,
                Date = sale.Date,
                Status = sale.Status,
                Subtotal = sale.Subtotal,
                PaymentMethod = sale.PaymentMethod,
                PaymentFee = sale.PaymentFee,
                FinalTotal = sale.FinalTotal,
                TotalAmount = sale.FinalTotal,
                Items = sale.Items.Select(i => new SaleItemDto
                {
                    SaleItemId = i.Id,
                    BookTitle = i.Book!.Title,
                    Price = i.Book!.Price,
                    Quantity = i.Quantity,
                    ReturnedQuantity = i.ReturnedQuantity
                }).ToList()
            }
        };
    }

    public CommonResponse<Sale> ReturnSaleItems(int saleId, ReturnSaleItemsDto request)
    {
        if (request == null || request.Items == null || request.Items.Count == 0)
            throw new BusinessException("Return items are required");

        var sale = _context.Sales
            .Include(s => s.Items)
            .ThenInclude(i => i.Book)
            .FirstOrDefault(s => s.Id == saleId);

        if (sale == null)
            throw new NotFoundException($"Sale with ID {saleId} not found");

        if (sale.Status == "Returned")
            throw new BusinessException("This sale is already fully returned");

        foreach (var returnItem in request.Items)
        {
            if (returnItem.Quantity <= 0)
                throw new BusinessException("Return quantity must be greater than zero");

            if (string.IsNullOrWhiteSpace(returnItem.Reason))
                throw new BusinessException("Return reason is required");

            var saleItem = sale.Items.FirstOrDefault(i => i.Id == returnItem.SaleItemId);

            if (saleItem == null)
                throw new NotFoundException($"Sale item with ID {returnItem.SaleItemId} not found");

            var remainingReturnableQuantity = saleItem.Quantity - saleItem.ReturnedQuantity;

            if (returnItem.Quantity > remainingReturnableQuantity)
                throw new BusinessException(
                    $"Cannot return {returnItem.Quantity} for '{saleItem.Book?.Title}'. Only {remainingReturnableQuantity} can be returned.");

            saleItem.ReturnedQuantity += returnItem.Quantity;

            if (saleItem.Book != null)
            {
                saleItem.Book.Stock += returnItem.Quantity;
            }
        }

        var allItemsReturned = sale.Items.All(i => i.ReturnedQuantity == i.Quantity);
        var anyItemsReturned = sale.Items.Any(i => i.ReturnedQuantity > 0);

        if (allItemsReturned)
            sale.Status = "Returned";
        else if (anyItemsReturned)
            sale.Status = "PartiallyReturned";
        else
            sale.Status = "Completed";

        _context.SaveChanges();

        return new CommonResponse<Sale>
        {
            IsSuccess = true,
            Message = "Return processed successfully",
            Data = sale
        };
    }

    public SalesDashboardDto GetDashboard()
    {
        var now = DateTime.UtcNow;
        var todayStart    = now.Date;
        var weekStart     = todayStart.AddDays(-(int)now.DayOfWeek);
        var monthStart    = new DateTime(now.Year, now.Month, 1);

        var sales = _context.Sales
            .Include(s => s.Items)
            .ThenInclude(i => i.Book)
            .Where(s => s.Status != "Returned")
            .ToList();

        var topBooks = _context.SaleItems
            .Include(si => si.Book)
            .Where(si => si.Sale!.Status != "Returned")
            .GroupBy(si => new { si.BookId, si.Book!.Title, si.Book!.Price })
            .Select(g => new TopBookDto
            {
                Title     = g.Key.Title,
                UnitsSold = g.Sum(i => i.Quantity),
                Revenue   = g.Sum(i => i.Quantity * g.Key.Price)
            })
            .OrderByDescending(x => x.UnitsSold)
            .Take(5)
            .ToList();

        return new SalesDashboardDto
        {
            RevenueToday     = sales.Where(s => s.Date >= todayStart).Sum(s => s.FinalTotal),
            RevenueThisWeek  = sales.Where(s => s.Date >= weekStart).Sum(s => s.FinalTotal),
            RevenueThisMonth = sales.Where(s => s.Date >= monthStart).Sum(s => s.FinalTotal),

            SalesToday     = sales.Count(s => s.Date >= todayStart),
            SalesThisWeek  = sales.Count(s => s.Date >= weekStart),
            SalesThisMonth = sales.Count(s => s.Date >= monthStart),

            TopBooks = topBooks
        };
    }
}