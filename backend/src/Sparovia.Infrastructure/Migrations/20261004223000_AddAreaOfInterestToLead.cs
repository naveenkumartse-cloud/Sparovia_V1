using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparovia.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAreaOfInterestToLead : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AreaOfInterest",
                table: "Leads",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AreaOfInterestCategoryId",
                table: "Leads",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Message",
                table: "Leads",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(4000)",
                oldMaxLength: 4000);

            migrationBuilder.CreateIndex(
                name: "IX_Leads_AreaOfInterestCategoryId",
                table: "Leads",
                column: "AreaOfInterestCategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Leads_WebsiteWorkCategories_AreaOfInterestCategoryId",
                table: "Leads",
                column: "AreaOfInterestCategoryId",
                principalTable: "WebsiteWorkCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Leads_WebsiteWorkCategories_AreaOfInterestCategoryId",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Leads_AreaOfInterestCategoryId",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "AreaOfInterestCategoryId",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "AreaOfInterest",
                table: "Leads");

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
        }
    }
}
