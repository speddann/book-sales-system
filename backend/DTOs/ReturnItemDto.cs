namespace Booksales.API.DTOs;

public class ReturnItemDto
{
    public int SaleItemId { get; set; }
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
}
