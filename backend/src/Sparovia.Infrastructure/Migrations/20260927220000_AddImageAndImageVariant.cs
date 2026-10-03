using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparovia.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddImageAndImageVariant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Images",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    WebsiteId = table.Column<Guid>(type: "uuid", nullable: false),
                    StorageKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OriginalFileName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    MimeType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    Width = table.Column<int>(type: "integer", nullable: false),
                    Height = table.Column<int>(type: "integer", nullable: false),
                    UsageType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Slot = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ProjectWorkName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Caption = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Uploaded"),
                    IsActiveWebsiteUsage = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Images", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Images_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Images_Websites_WebsiteId",
                        column: x => x.WebsiteId,
                        principalTable: "Websites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ImageVariants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ImageId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentVariantId = table.Column<Guid>(type: "uuid", nullable: true),
                    VariantType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Operation = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    StorageKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    MimeType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    Width = table.Column<int>(type: "integer", nullable: false),
                    Height = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Processing"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImageVariants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImageVariants_ImageVariants_ParentVariantId",
                        column: x => x.ParentVariantId,
                        principalTable: "ImageVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ImageVariants_Images_ImageId",
                        column: x => x.ImageId,
                        principalTable: "Images",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ImageVariants_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Images_CreatedAt",
                table: "Images",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Images_TenantId",
                table: "Images",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Images_TenantId_IsActiveWebsiteUsage",
                table: "Images",
                columns: new[] { "TenantId", "IsActiveWebsiteUsage" });

            migrationBuilder.CreateIndex(
                name: "IX_Images_TenantId_Slot",
                table: "Images",
                columns: new[] { "TenantId", "Slot" });

            migrationBuilder.CreateIndex(
                name: "IX_Images_TenantId_Status",
                table: "Images",
                columns: new[] { "TenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Images_TenantId_UsageType",
                table: "Images",
                columns: new[] { "TenantId", "UsageType" });

            migrationBuilder.CreateIndex(
                name: "IX_Images_TenantId_WebsiteId",
                table: "Images",
                columns: new[] { "TenantId", "WebsiteId" });

            migrationBuilder.CreateIndex(
                name: "IX_Images_WebsiteId",
                table: "Images",
                column: "WebsiteId");

            migrationBuilder.CreateIndex(
                name: "IX_ImageVariants_CreatedAt",
                table: "ImageVariants",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ImageVariants_ImageId",
                table: "ImageVariants",
                column: "ImageId");

            migrationBuilder.CreateIndex(
                name: "IX_ImageVariants_ImageId_Status",
                table: "ImageVariants",
                columns: new[] { "ImageId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ImageVariants_ImageId_VariantType",
                table: "ImageVariants",
                columns: new[] { "ImageId", "VariantType" });

            migrationBuilder.CreateIndex(
                name: "IX_ImageVariants_ParentVariantId",
                table: "ImageVariants",
                column: "ParentVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_ImageVariants_TenantId",
                table: "ImageVariants",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ImageVariants");

            migrationBuilder.DropTable(
                name: "Images");
        }
    }
}
