namespace Booksales.API.Models;

public class Sale
{
    public int ID { get; set; }
    public DateTime Date { get; set; } = DateTime.Now;

    // Navigation property
    public List<SaleItem> Items { get; set; } = new List<SaleItem>();
}