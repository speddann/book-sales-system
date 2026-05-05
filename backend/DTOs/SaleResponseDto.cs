namespace Booksales.API.DTOs;

public class SaleResponseDto
{
    public int SaleId { get; set; }
    public DateTime Date { get; set; }
    public string CustomerName { get; set; } = "Guest";
    public decimal TotalAmount { get; set; }
   
    public decimal Subtotal { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = "Paid";
    public string? PaymentReference { get; set; }
    public decimal PaymentFee { get; set; }
    public decimal FinalTotal { get; set; }

    public string Status { get; set; } = "Completed";

    public List<SaleItemDto> Items { get; set; } = new();
}
