using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booksales.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentStatusAndReferenceToSale : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentReference",
                table: "Sales",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                table: "Sales",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "Paid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentReference",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "Sales");
        }
    }
}
