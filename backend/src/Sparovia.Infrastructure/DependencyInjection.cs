namespace Sparovia.Infrastructure;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Sparovia.Application.Common.Interfaces;
using Sparovia.Application.Identity;
using Sparovia.Infrastructure.Data;
using Sparovia.Infrastructure.Email;
using Sparovia.Infrastructure.Identity;
using Sparovia.Infrastructure.Security;
using Sparovia.Infrastructure.Sms;
using Sparovia.Infrastructure.Storage;

public static class DependencyInjection
{
    public const string DefaultProductionConnectionString = 
        "Host=aws-0-ap-southeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.ejvpbjbehujqcnwllxby;Password=Sparovia@16;SSL Mode=Require;Trust Server Certificate=true";

    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        // 1. Database Context - Always registered to guarantee CallSiteFactory controller activation
        var connectionString = ResolveConnectionString(configuration, environment);

        services.AddDbContext<SparoviaDbContext>(options =>
        {
            if (!string.IsNullOrWhiteSpace(connectionString))
            {
                options.UseNpgsql(connectionString);
            }
            options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        });

        // 2. Storage, Email & SMS
        var storageOptions = SupabaseStorageOptions.FromConfiguration(configuration);
        services.AddHttpClient<IStorageProvider, SupabaseStorageProvider>();

        // Phone OTP & SMS Services
        services.Configure<PhoneOtpOptions>(configuration.GetSection(PhoneOtpOptions.SectionName));
        services.AddSingleton<IOtpService, OtpService>();

        var smsOptions = SmsOptions.FromConfiguration(configuration);
        services.AddSingleton(Options.Create(smsOptions));
        services.AddHttpClient<ISmsService, SmsService>();

        var smtpOptions = SmtpOptions.FromConfiguration(configuration);
        services.AddSingleton(Options.Create(smtpOptions));

        if (!string.IsNullOrWhiteSpace(smtpOptions.Host) && smtpOptions.EnableDelivery)
        {
            services.AddScoped<IEmailService, SmtpEmailService>();
        }
        else
        {
            services.AddSingleton<IEmailService, StubEmailService>();
        }

        // 3. Identity & Core Domain Services
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<Sparovia.Application.Onboarding.IOnboardingService, Sparovia.Infrastructure.Onboarding.OnboardingService>();
        services.AddScoped<Sparovia.Application.BusinessPresence.IBusinessPresenceService, Sparovia.Infrastructure.BusinessPresence.BusinessPresenceService>();
        services.AddScoped<Sparovia.Application.WebsiteContent.IWebsiteContentService, Sparovia.Infrastructure.WebsiteContent.WebsiteContentService>();

        services.Configure<Sparovia.Application.Images.ImageUploadOptions>(
            configuration.GetSection(Sparovia.Application.Images.ImageUploadOptions.SectionName));
        services.AddSingleton<Sparovia.Application.Images.IImageValidator>(sp =>
        {
            var opts = sp.GetService<IOptions<Sparovia.Application.Images.ImageUploadOptions>>()?.Value;
            return new Sparovia.Application.Images.ImageValidator(opts);
        });
        services.AddScoped<Sparovia.Application.Images.IWebsiteImageService, Sparovia.Infrastructure.Images.WebsiteImageService>();
        services.AddSingleton<Sparovia.Infrastructure.Images.ILocalAiRestorationService, Sparovia.Infrastructure.Images.LocalOnnxRestorationService>();
        services.AddSingleton<Sparovia.Application.Images.IImageProcessingService, Sparovia.Infrastructure.Images.DeterministicImageProcessingService>();
        services.AddScoped<Sparovia.Application.Leads.ILeadService, Sparovia.Infrastructure.Leads.LeadService>();

        // 4. AI Services
        services.Configure<Sparovia.Infrastructure.AI.AIOptions>(
            configuration.GetSection(Sparovia.Infrastructure.AI.AIOptions.SectionName));
        services.AddSingleton<Sparovia.Application.AI.IAICredentialEncryptionService, Sparovia.Infrastructure.AI.AesGcmAICredentialEncryptionService>();
        services.AddHttpClient<Sparovia.Infrastructure.AI.HttpAIProviderAdapter>();
        var aiConfig = configuration.GetSection(Sparovia.Infrastructure.AI.AIOptions.SectionName).Get<Sparovia.Infrastructure.AI.AIOptions>() ?? new Sparovia.Infrastructure.AI.AIOptions();
        if (string.Equals(aiConfig.Provider, "Stub", StringComparison.OrdinalIgnoreCase) && !environment.IsProduction())
        {
            services.AddScoped<Sparovia.Application.AI.IAIProvider, Sparovia.Infrastructure.AI.StubAIProviderAdapter>();
        }
        else
        {
            services.AddScoped<Sparovia.Application.AI.IAIProvider, Sparovia.Infrastructure.AI.HttpAIProviderAdapter>();
        }
        services.AddScoped<Sparovia.Application.AI.IAIService, Sparovia.Infrastructure.AI.AIService>();

        // 5. Cryptographic Signing & Verification Provider
        var signingSecretProvider = new SigningSecretProvider(configuration, environment);
        services.AddSingleton<ISigningSecretProvider>(signingSecretProvider);

        return services;
    }

    public static string ResolveConnectionString(IConfiguration configuration, IHostEnvironment? environment = null)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            var databaseUrl = configuration["DATABASE_URL"]
                ?? Environment.GetEnvironmentVariable("DATABASE_URL")
                ?? configuration["POSTGRES_URL"]
                ?? Environment.GetEnvironmentVariable("POSTGRES_URL")
                ?? configuration["POSTGRESQL_URL"]
                ?? Environment.GetEnvironmentVariable("POSTGRESQL_URL")
                ?? configuration["SUPABASE_DB_URL"]
                ?? Environment.GetEnvironmentVariable("SUPABASE_DB_URL")
                ?? configuration["SUPABASE_DATABASE_URL"]
                ?? Environment.GetEnvironmentVariable("SUPABASE_DATABASE_URL")
                ?? configuration["ConnectionStrings:DefaultConnection"]
                ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
                ?? configuration["DefaultConnection"]
                ?? Environment.GetEnvironmentVariable("DefaultConnection");

            if (!string.IsNullOrWhiteSpace(databaseUrl))
            {
                connectionString = ParseDatabaseUrl(databaseUrl);
            }
        }
        else if (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
                 connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            connectionString = ParseDatabaseUrl(connectionString);
        }

        // Production fallback: If connection string is still empty in Production, use the configured Supabase pooler
        if (string.IsNullOrWhiteSpace(connectionString) && (environment == null || environment.IsProduction() || environment.IsStaging()))
        {
            connectionString = DefaultProductionConnectionString;
        }

        return connectionString ?? string.Empty;
    }

    public static string ParseDatabaseUrl(string databaseUrl)
    {
        if (string.IsNullOrWhiteSpace(databaseUrl)) return string.Empty;
        var trimmed = databaseUrl.Trim();
        if (!trimmed.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
            !trimmed.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        try
        {
            var uri = new Uri(trimmed);
            var userInfo = uri.UserInfo.Split(':', 2);
            var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : string.Empty;
            var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
            var host = uri.Host;
            var port = uri.Port > 0 ? uri.Port : 5432;
            var database = uri.AbsolutePath.TrimStart('/');

            var npgsqlBuilder = new Npgsql.NpgsqlConnectionStringBuilder
            {
                Host = host,
                Port = port,
                Database = database,
                Username = username,
                Password = password,
                SslMode = Npgsql.SslMode.Require
            };
            npgsqlBuilder["Trust Server Certificate"] = true;

            return npgsqlBuilder.ConnectionString;
        }
        catch
        {
            return trimmed;
        }
    }
}
