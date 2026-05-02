namespace Booksales.API.DTOs;

public class StockAdjustmentDto
{
    public string Type { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
}