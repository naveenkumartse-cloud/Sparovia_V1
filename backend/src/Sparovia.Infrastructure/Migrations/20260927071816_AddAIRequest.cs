using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparovia.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAIRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AIRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    OperationType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ResourceType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ResourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProviderReference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ModelReference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ContextVersion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ErrorCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AIRequests_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AIRequests_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AIRequests_CreatedAt",
                table: "AIRequests",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AIRequests_TenantId",
                table: "AIRequests",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_AIRequests_TenantId_ResourceType_ResourceId",
                table: "AIRequests",
                columns: new[] { "TenantId", "ResourceType", "ResourceId" });

            migrationBuilder.CreateIndex(
                name: "IX_AIRequests_TenantId_Status",
                table: "AIRequests",
                columns: new[] { "TenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_AIRequests_UserId",
                table: "AIRequests",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AIRequests");
        }
    }
}
