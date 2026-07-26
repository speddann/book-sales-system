using Booksales.API.Data;
using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booksales.API.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260702000000_AddStructuredInventoryTransactions")]
    public partial class AddStructuredInventoryTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TransactionType",
                table: "InventoryTransactions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReasonCategory",
                table: "InventoryTransactions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "InventoryTransactions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TransactionDate",
                table: "InventoryTransactions",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.Sql("""
                UPDATE InventoryTransactions
                SET
                    TransactionType = CASE
                        WHEN LOWER(Type) = 'increase' THEN 'Increase'
                        WHEN LOWER(Type) = 'decrease' THEN 'Decrease'
                        ELSE Type
                    END,
                    ReasonCategory = CASE
                        WHEN Reason IS NULL OR LTRIM(RTRIM(Reason)) = '' THEN 'Correction'
                        ELSE Reason
                    END,
                    TransactionDate = CreatedDate
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Notes",
                table: "InventoryTransactions");

            migrationBuilder.DropColumn(
                name: "ReasonCategory",
                table: "InventoryTransactions");

            migrationBuilder.DropColumn(
                name: "TransactionDate",
                table: "InventoryTransactions");

            migrationBuilder.DropColumn(
                name: "TransactionType",
                table: "InventoryTransactions");
        }
    }
}
