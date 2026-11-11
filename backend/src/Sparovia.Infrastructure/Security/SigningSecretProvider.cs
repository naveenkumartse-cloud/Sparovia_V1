using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Sparovia.Application.Common.Interfaces;

namespace Sparovia.Infrastructure.Security;

/// <summary>
/// Centralized implementation for resolving, validating, and supplying cryptographic signing secrets.
/// Enforces strong 256-bit entropy in production, bans insecure default fallbacks in production,
/// and prevents application startup if cryptographic prerequisites are not met.
/// </summary>
public class SigningSecretProvider : ISigningSecretProvider
{
    public const int MinimumSecretLength = 32; // 256 bits for HMAC-SHA256
    public const string InsecureDevelopmentSecret = "SparoviaDefaultProductionGradeJwtSigningKey2026_EnterpriseGradeSecretKey!";

    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;

    public SigningSecretProvider(IConfiguration configuration, IHostEnvironment environment)
    {
        _secret = ResolveAndValidateSecret(configuration, environment);
        _issuer = configuration["Jwt:Issuer"] ?? "Sparovia.API";
        _audience = configuration["Jwt:Audience"] ?? "Sparovia.Client";
    }

    public string GetSigningSecret() => _secret;
    public string GetIssuer() => _issuer;
    public string GetAudience() => _audience;

    /// <summary>
    /// Resolves the configured secret from all supported environment and appsettings keys.
    /// Hierarchy: Jwt:Secret -> JWT_SECRET -> Jwt__Secret.
    /// </summary>
    public static string ResolveConfiguredSecret(IConfiguration configuration)
    {
        return configuration["Jwt:Secret"]
            ?? configuration["JWT_SECRET"]
            ?? Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? Environment.GetEnvironmentVariable("Jwt__Secret")
            ?? string.Empty;
    }

    /// <summary>
    /// Validates secret strength against the hosting environment.
    /// Throws InvalidOperationException on missing, default, or weak secrets in Production.
    /// Never exposes the secret value in exception messages or logs.
    /// </summary>
    public static string ResolveAndValidateSecret(IConfiguration configuration, IHostEnvironment environment)
    {
        var rawSecret = ResolveConfiguredSecret(configuration);
        var secret = rawSecret?.Trim() ?? string.Empty;

        if (environment.IsProduction())
        {
            if (string.IsNullOrWhiteSpace(secret))
            {
                throw new InvalidOperationException(
                    "CRITICAL SECURITY CONFIGURATION ERROR: JWT signing secret is missing. " +
                    $"In Production, a secure signing key of at least {MinimumSecretLength} characters must be configured " +
                    "via 'Jwt:Secret' or 'JWT_SECRET'. Application startup aborted to prevent insecure operation.");
            }

            if (string.Equals(secret, InsecureDevelopmentSecret, StringComparison.Ordinal))
            {
                throw new InvalidOperationException(
                    "CRITICAL SECURITY CONFIGURATION ERROR: Insecure fallback development secret detected in Production. " +
                    "Hardcoded development keys are strictly forbidden in production. " +
                    "Configure a dedicated, high-entropy secret via 'Jwt:Secret' or 'JWT_SECRET'.");
            }

            if (secret.Length < MinimumSecretLength)
            {
                throw new InvalidOperationException(
                    $"CRITICAL SECURITY CONFIGURATION ERROR: Configured signing secret has insufficient length ({secret.Length} chars). " +
                    $"A minimum of {MinimumSecretLength} characters (256 bits) is required for HMAC-SHA256 security.");
            }

            return secret;
        }

        // Development / Testing environment
        if (string.IsNullOrWhiteSpace(secret))
        {
            return InsecureDevelopmentSecret;
        }

        if (secret.Length < MinimumSecretLength)
        {
            throw new InvalidOperationException(
                $"CONFIGURATION ERROR: Configured signing secret has insufficient length ({secret.Length} chars). " +
                $"A minimum of {MinimumSecretLength} characters is required.");
        }

        return secret;
    }
}
