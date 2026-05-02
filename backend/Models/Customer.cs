namespace Booksales.API.Models;

public class Customer
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public string? Email { get; set; }

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
}