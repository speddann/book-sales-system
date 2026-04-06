namespace Booksales.API.Models;

public class Sale
{
    public int Id { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;

    // Navigation property
    public List<SaleItem> Items { get; set; } = new List<SaleItem>();
}