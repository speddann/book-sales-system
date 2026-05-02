namespace Booksales.API.Models;

public class Sale
{
    public int Id { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string PaymentMethod { get; set; } = "ETransfer";

    public decimal Subtotal { get; set; }

    public decimal PaymentFee { get; set; }

    public decimal FinalTotal { get; set; }

    // Navigation property
    public List<SaleItem> Items { get; set; } = new List<SaleItem>();
}