namespace Booksales.API.DTOs;

public class SaleItemDto
{
    public string BookTitle { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}