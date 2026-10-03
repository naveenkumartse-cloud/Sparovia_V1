using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparovia.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddConfirmationStateToBusinessContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ConfirmedAt",
                table: "BusinessContexts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ConfirmedByUserId",
                table: "BusinessContexts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsConfirmed",
                table: "BusinessContexts",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConfirmedAt",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "ConfirmedByUserId",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "IsConfirmed",
                table: "BusinessContexts");
        }
    }
}
