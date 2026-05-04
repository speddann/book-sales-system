using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booksales.API.Migrations
{
    /// <inheritdoc />
    public partial class AddReturnedQuantityToSaleItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ReturnedQuantity",
                table: "SaleItems",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReturnedQuantity",
                table: "SaleItems");
        }
    }
}
