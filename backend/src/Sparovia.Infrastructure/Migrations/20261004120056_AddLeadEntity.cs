using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparovia.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLeadEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Leads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    WebsiteId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Message = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Website"),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "New"),
                    ExternalReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Leads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Leads_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Leads_Users_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Leads_Websites_WebsiteId",
                        column: x => x.WebsiteId,
                        principalTable: "Websites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_TenantId",
                table: "Leads",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_TenantId_ExternalReference",
                table: "Leads",
                columns: new[] { "TenantId", "ExternalReference" });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_TenantId_Source",
                table: "Leads",
                columns: new[] { "TenantId", "Source" });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_TenantId_Status",
                table: "Leads",
                columns: new[] { "TenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_TenantId_SubmittedAt",
                table: "Leads",
                columns: new[] { "TenantId", "SubmittedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_UpdatedByUserId",
                table: "Leads",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_WebsiteId",
                table: "Leads",
                column: "WebsiteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Leads");
        }
    }
}
