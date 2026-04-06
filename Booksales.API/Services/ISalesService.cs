using Booksales.API.Models;
using Booksales.API.Common;

public interface ISalesService
{
    string CreateSale(Sale sale);
    List<Sale> GetSales(DateTime? startDate, DateTime? endDate);
}