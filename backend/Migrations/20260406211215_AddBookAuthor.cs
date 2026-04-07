using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booksales.API.Migrations
{
    /// <inheritdoc />
    public partial class AddBookAuthor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SaleItems_Sales_SaleID",
                table: "SaleItems");

            migrationBuilder.RenameColumn(
                name: "SaleID",
                table: "SaleItems",
                newName: "SaleId");

            migrationBuilder.RenameIndex(
                name: "IX_SaleItems_SaleID",
                table: "SaleItems",
                newName: "IX_SaleItems_SaleId");

            migrationBuilder.AlterColumn<int>(
                name: "SaleId",
                table: "SaleItems",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Author",
                table: "Books",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_SaleItems_Sales_SaleId",
                table: "SaleItems",
                column: "SaleId",
                principalTable: "Sales",
                principalColumn: "ID",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SaleItems_Sales_SaleId",
                table: "SaleItems");

            migrationBuilder.DropColumn(
                name: "Author",
                table: "Books");

            migrationBuilder.RenameColumn(
                name: "SaleId",
                table: "SaleItems",
                newName: "SaleID");

            migrationBuilder.RenameIndex(
                name: "IX_SaleItems_SaleId",
                table: "SaleItems",
                newName: "IX_SaleItems_SaleID");

            migrationBuilder.AlterColumn<int>(
                name: "SaleID",
                table: "SaleItems",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_SaleItems_Sales_SaleID",
                table: "SaleItems",
                column: "SaleID",
                principalTable: "Sales",
                principalColumn: "ID");
        }
    }
}
