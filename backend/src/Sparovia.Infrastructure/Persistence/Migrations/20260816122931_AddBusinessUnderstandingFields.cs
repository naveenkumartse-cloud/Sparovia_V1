using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparovia.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessUnderstandingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "address",
                table: "businesses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "contact_email",
                table: "businesses",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "contact_phone",
                table: "businesses",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "google_business_profile_status",
                table: "businesses",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "has_google_business_profile",
                table: "businesses",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_onboarding_complete",
                table: "businesses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "target_audience",
                table: "businesses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "value_proposition",
                table: "businesses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "address",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "contact_email",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "contact_phone",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "google_business_profile_status",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "has_google_business_profile",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "is_onboarding_complete",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "target_audience",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "value_proposition",
                table: "businesses");
        }
    }
}
