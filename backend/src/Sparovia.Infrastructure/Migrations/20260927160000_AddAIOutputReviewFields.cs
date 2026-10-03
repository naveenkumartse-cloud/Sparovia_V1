using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Sparovia.Infrastructure.Data;

#nullable disable

namespace Sparovia.Infrastructure.Migrations
{
    [DbContext(typeof(SparoviaDbContext))]
    [Migration("20260927160000_AddAIOutputReviewFields")]
    public partial class AddAIOutputReviewFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReviewStatus",
                table: "AIRequests",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "PendingReview");

            migrationBuilder.AddColumn<string>(
                name: "OutputText",
                table: "AIRequests",
                type: "character varying(8000)",
                maxLength: 8000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OriginalText",
                table: "AIRequests",
                type: "character varying(8000)",
                maxLength: 8000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "AIRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedByUserId",
                table: "AIRequests",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TargetResourceVersion",
                table: "AIRequests",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetSectionKey",
                table: "AIRequests",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetFieldKey",
                table: "AIRequests",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AIRequests_ReviewStatus",
                table: "AIRequests",
                column: "ReviewStatus");

            migrationBuilder.CreateIndex(
                name: "IX_AIRequests_TenantId_ReviewStatus",
                table: "AIRequests",
                columns: new[] { "TenantId", "ReviewStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_AIRequests_ReviewedByUserId",
                table: "AIRequests",
                column: "ReviewedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_AIRequests_Users_ReviewedByUserId",
                table: "AIRequests",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AIRequests_Users_ReviewedByUserId",
                table: "AIRequests");

            migrationBuilder.DropIndex(
                name: "IX_AIRequests_ReviewStatus",
                table: "AIRequests");

            migrationBuilder.DropIndex(
                name: "IX_AIRequests_TenantId_ReviewStatus",
                table: "AIRequests");

            migrationBuilder.DropIndex(
                name: "IX_AIRequests_ReviewedByUserId",
                table: "AIRequests");

            migrationBuilder.DropColumn(
                name: "ReviewStatus",
                table: "AIRequests");

            migrationBuilder.DropColumn(
                name: "OutputText",
                table: "AIRequests");

            migrationBuilder.DropColumn(
                name: "OriginalText",
                table: "AIRequests");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "AIRequests");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "AIRequests");

            migrationBuilder.DropColumn(
                name: "TargetResourceVersion",
                table: "AIRequests");

            migrationBuilder.DropColumn(
                name: "TargetSectionKey",
                table: "AIRequests");

            migrationBuilder.DropColumn(
                name: "TargetFieldKey",
                table: "AIRequests");
        }
    }
}
