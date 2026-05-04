namespace Booksales.API.Models;

public class InventoryTransaction
{
    public int Id { get; set; }

    public int BookId { get; set; }

    public Book? Book { get; set; }

    public string Type { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public string Reason { get; set; } = string.Empty;

    public int StockBefore { get; set; }

    public int StockAfter { get; set; }

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
}