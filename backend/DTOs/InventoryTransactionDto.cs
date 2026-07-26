namespace Booksales.API.DTOs;

public class InventoryTransactionDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string BookTitle { get; set; } = string.Empty;
    public string? BookISBN { get; set; }
    public string? BookCategory { get; set; }
    public string? BookLanguage { get; set; }
    public string Type { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int StockBefore { get; set; }
    public int StockAfter { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string ReasonCategory { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime TransactionDate { get; set; }
    public DateTime CreatedDate { get; set; }
}
