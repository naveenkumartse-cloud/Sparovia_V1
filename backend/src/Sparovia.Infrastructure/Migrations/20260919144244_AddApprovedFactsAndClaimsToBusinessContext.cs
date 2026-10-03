using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparovia.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddApprovedFactsAndClaimsToBusinessContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "Accreditations",
                table: "BusinessContexts",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "AuthorizedStatuses",
                table: "BusinessContexts",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "Awards",
                table: "BusinessContexts",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "Certifications",
                table: "BusinessContexts",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "OtherClaims",
                table: "BusinessContexts",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "Warranties",
                table: "BusinessContexts",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "YearsInBusiness",
                table: "BusinessContexts",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Accreditations",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "AuthorizedStatuses",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "Awards",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "Certifications",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "OtherClaims",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "Warranties",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "YearsInBusiness",
                table: "BusinessContexts");
        }
    }
}
