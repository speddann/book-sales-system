namespace Booksales.API.Models;

public class Book
{
    public static readonly string[] ValidStatuses = ["Active", "Inactive", "Archived"];

    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public string? Category { get; set; }

    public string? ISBN { get; set; }

    public string? Language { get; set; }

    public string? ShortDescription { get; set; }

    public string? LongDescription { get; set; }

    public string? CoverImageUrl { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    // Legacy sale-facing price kept during migration. Keep synced with SellingPrice.
    public decimal Price { get; set; }

    public decimal CostPrice { get; set; }

    public decimal SellingPrice { get; set; }

    public int Stock { get; set; }

    public string Status { get; set; } = "Active";

    public bool IsActive { get; set; } = true;

    public bool IsFeatured { get; set; }

    public bool IsBookOfMonth { get; set; }

    public bool IsNewArrival { get; set; }

    public bool IsStaffPick { get; set; }
}
