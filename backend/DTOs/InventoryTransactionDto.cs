namespace Booksales.API.DTOs;

public class InventoryTransactionDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string BookTitle { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int StockBefore { get; set; }
    public int StockAfter { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
}