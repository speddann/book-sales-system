using Booksales.API.Models;

namespace Booksales.API.Validators;

public class SaleValidator
{
    public static string Validate(Sale sale)
    {
        if (sale == null)
            return "Sale data is required";

        if (sale.Items == null || !sale.Items.Any())
            return "Sale must have at least one item";

        foreach (var item in sale.Items)
        {
            if (item.BookId <= 0)
                return "Each item must have a valid BookId";

            if (item.Quantity <= 0)
                return "Quantity must be greater than zero";
        }

        var hasDuplicates = sale.Items
            .GroupBy(i => i.BookId)
            .Any(g => g.Count() > 1);

        if (hasDuplicates)
            return "Duplicate BookId found. Merge quantities into one item";

        return "Valid";
    }
}