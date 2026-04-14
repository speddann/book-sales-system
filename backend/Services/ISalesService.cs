using Booksales.API.Common;
using Booksales.API.DTOs;
using Booksales.API.Models;

namespace Booksales.API.Services;

public interface ISalesService
{
    CommonResponse<Sale> CreateSale(Sale sale);
    List<SaleResponseDto> GetSales(DateTime? startDate, DateTime? endDate, string? range);
    List<SalesReportItemDto> GetSalesReport();
    List<SalesReportItemDto> GetTopSellingBooks(int count = 5);
}