using Microsoft.EntityFrameworkCore;
using Booksales.API.Models;

namespace Booksales.API.Data;

public class AppDbContext : DbContext
{
    // Constructor
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
    

    // This becomes a table in DB
    public DbSet<Book> Books { get; set; }
    public DbSet<Sale> Sales { get; set; }
    public DbSet<SaleItem> SaleItems { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<InventoryTransaction> InventoryTransactions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Book>()
            .Property(b => b.Price)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Sale>()
            .Property(s => s.PaymentStatus)
            .HasDefaultValue("Paid");
    }
}