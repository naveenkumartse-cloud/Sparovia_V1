using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparovia.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLeadFieldsV1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ExternalReference",
                table: "Leads",
                newName: "SourceReference");

            migrationBuilder.RenameIndex(
                name: "IX_Leads_TenantId_ExternalReference",
                table: "Leads",
                newName: "IX_Leads_TenantId_SourceReference");

            migrationBuilder.AlterColumn<string>(
                name: "Message",
                table: "Leads",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(4000)",
                oldMaxLength: 4000,
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Leads",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Leads");

            migrationBuilder.RenameColumn(
                name: "SourceReference",
                table: "Leads",
                newName: "ExternalReference");

            migrationBuilder.RenameIndex(
                name: "IX_Leads_TenantId_SourceReference",
                table: "Leads",
                newName: "IX_Leads_TenantId_ExternalReference");

            migrationBuilder.AlterColumn<string>(
                name: "Message",
                table: "Leads",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(4000)",
                oldMaxLength: 4000);
        }
    }
}
