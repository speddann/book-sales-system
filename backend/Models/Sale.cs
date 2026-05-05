namespace Booksales.API.Models;

public class Sale
{
    public int Id { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string PaymentMethod { get; set; } = "ETransfer";
    public string PaymentStatus { get; set; } = "Paid";
    public string? PaymentReference { get; set; }

    public decimal Subtotal { get; set; }

    public decimal PaymentFee { get; set; }

    public decimal FinalTotal { get; set; }

    public int? CustomerId { get; set; }

    public Customer? Customer { get; set; }

    public string Status { get; set; } = "Completed";

    // Navigation property
    public List<SaleItem> Items { get; set; } = new List<SaleItem>();
}