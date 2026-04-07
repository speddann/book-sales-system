namespace Booksales.API.DTOs;

public class SaleResponseDto
{
    public int SaleId { get; set; }
    public DateTime Date { get; set; }
    public decimal TotalAmount { get; set; }
    public List<SaleItemDto> Items { get; set; } = new();
}