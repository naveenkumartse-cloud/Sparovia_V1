using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparovia.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocationAndCustomersToBusinessContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AddressLine1",
                table: "BusinessContexts",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AddressLine2",
                table: "BusinessContexts",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "BusinessContexts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "BusinessContexts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostalCode",
                table: "BusinessContexts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "ServiceAreas",
                table: "BusinessContexts",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "State",
                table: "BusinessContexts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "TargetCustomers",
                table: "BusinessContexts",
                type: "text[]",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddressLine1",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "AddressLine2",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "City",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "PostalCode",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "ServiceAreas",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "State",
                table: "BusinessContexts");

            migrationBuilder.DropColumn(
                name: "TargetCustomers",
                table: "BusinessContexts");
        }
    }
}
