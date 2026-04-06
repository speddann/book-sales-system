using Book.API.Models;

public class SaleValidator
{
    public static string Validate(Sale sale)
    {
        if (sale.Items == null || !sale.Items.Any())
            return "Sale must have at least one item";

        foreach (var item in sale.Items)
        {
            if (item.Quantity <= 0)
                return "Quantity must be greater than zero";

        }
        return "Valid";
    }
}