using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparovia.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWebsiteAndWebsiteContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Websites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Domain = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ConnectionStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Websites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Websites_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WebsiteContents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    WebsiteId = table.Column<Guid>(type: "uuid", nullable: false),
                    SectionKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DraftContentJson = table.Column<string>(type: "text", nullable: false),
                    PublishedContentJson = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebsiteContents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WebsiteContents_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WebsiteContents_Websites_WebsiteId",
                        column: x => x.WebsiteId,
                        principalTable: "Websites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Websites_TenantId",
                table: "Websites",
                column: "TenantId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteContents_TenantId_WebsiteId_SectionKey",
                table: "WebsiteContents",
                columns: new[] { "TenantId", "WebsiteId", "SectionKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteContents_WebsiteId",
                table: "WebsiteContents",
                column: "WebsiteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WebsiteContents");

            migrationBuilder.DropTable(
                name: "Websites");
        }
    }
}
