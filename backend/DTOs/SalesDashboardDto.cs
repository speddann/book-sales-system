namespace Booksales.API.DTOs;

public class SalesDashboardDto
{
    public decimal RevenueToday { get; set; }
    public decimal RevenueThisWeek { get; set; }
    public decimal RevenueThisMonth { get; set; }

    public int SalesToday { get; set; }
    public int SalesThisWeek { get; set; }
    public int SalesThisMonth { get; set; }

    public List<TopBookDto> TopBooks { get; set; } = new();
}

public class TopBookDto
{
    public string Title { get; set; } = string.Empty;
    public int UnitsSold { get; set; }
    public decimal Revenue { get; set; }
}
