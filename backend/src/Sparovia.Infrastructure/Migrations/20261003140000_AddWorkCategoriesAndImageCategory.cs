using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparovia.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkCategoriesAndImageCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Images",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Images_TenantId_Category",
                table: "Images",
                columns: new[] { "TenantId", "Category" });

            migrationBuilder.CreateTable(
                name: "WebsiteWorkCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    WebsiteId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebsiteWorkCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WebsiteWorkCategories_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WebsiteWorkCategories_Websites_WebsiteId",
                        column: x => x.WebsiteId,
                        principalTable: "Websites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteWorkCategories_TenantId_Name",
                table: "WebsiteWorkCategories",
                columns: new[] { "TenantId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteWorkCategories_TenantId_WebsiteId",
                table: "WebsiteWorkCategories",
                columns: new[] { "TenantId", "WebsiteId" });

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteWorkCategories_TenantId_Slug",
                table: "WebsiteWorkCategories",
                columns: new[] { "TenantId", "Slug" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WebsiteWorkCategories");

            migrationBuilder.DropIndex(
                name: "IX_Images_TenantId_Category",
                table: "Images");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Images");
        }
    }
}
