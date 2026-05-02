namespace Booksales.API.DTOs;

public class SaleResponseDto
{
    public int SaleId { get; set; }
    public DateTime Date { get; set; }
    public decimal TotalAmount { get; set; }
   
    public decimal Subtotal { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal PaymentFee { get; set; }
    public decimal FinalTotal { get; set; }

    public List<SaleItemDto> Items { get; set; } = new();
}
