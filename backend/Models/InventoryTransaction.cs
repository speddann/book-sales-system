namespace Booksales.API.Models;

public class InventoryTransaction
{
    public static readonly string[] ValidTransactionTypes = ["Increase", "Decrease"];

    public static readonly string[] ValidReasonCategories =
    [
        "New Shipment",
        "Damaged",
        "Lost",
        "Correction",
        "Return To Stock",
        "Physical Count Adjustment"
    ];

    public int Id { get; set; }

    public int BookId { get; set; }

    public Book? Book { get; set; }

    public string Type { get; set; } = string.Empty;

    public string TransactionType { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public string Reason { get; set; } = string.Empty;

    public string ReasonCategory { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public int StockBefore { get; set; }

    public int StockAfter { get; set; }

    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
}
