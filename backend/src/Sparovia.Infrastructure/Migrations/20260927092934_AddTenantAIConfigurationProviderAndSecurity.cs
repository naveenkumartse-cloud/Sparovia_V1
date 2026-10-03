using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparovia.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantAIConfigurationProviderAndSecurity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EncryptedApiKey",
                table: "TenantAIConfigurations",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastValidatedAt",
                table: "TenantAIConfigurations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MaskedApiKey",
                table: "TenantAIConfigurations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderKey",
                table: "TenantAIConfigurations",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "openai");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "TenantAIConfigurations",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "NotConnected");

            migrationBuilder.AddColumn<string>(
                name: "SupportedCapability",
                table: "TenantAIConfigurations",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Content");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EncryptedApiKey",
                table: "TenantAIConfigurations");

            migrationBuilder.DropColumn(
                name: "LastValidatedAt",
                table: "TenantAIConfigurations");

            migrationBuilder.DropColumn(
                name: "MaskedApiKey",
                table: "TenantAIConfigurations");

            migrationBuilder.DropColumn(
                name: "ProviderKey",
                table: "TenantAIConfigurations");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "TenantAIConfigurations");

            migrationBuilder.DropColumn(
                name: "SupportedCapability",
                table: "TenantAIConfigurations");
        }
    }
}
