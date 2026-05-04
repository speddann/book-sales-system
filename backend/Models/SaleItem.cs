using System.Text.Json.Serialization;

namespace Booksales.API.Models;

public class SaleItem
{
    public int Id { get; set; }

    public int BookId { get; set; }
    public Book? Book { get; set; }

    public int Quantity { get; set; }
    public int ReturnedQuantity { get; set; } = 0;

    public int SaleId { get; set; }
    [JsonIgnore]
    public Sale? Sale { get; set; }
}