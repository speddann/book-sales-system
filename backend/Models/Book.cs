namespace Booksales.API.Models;

public class Book
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public string? Category { get; set; }

    public string? ISBN { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public decimal Price { get; set; }

    public decimal CostPrice { get; set; }

    public int Stock { get; set; }

    public bool IsActive { get; set; } = true;
}