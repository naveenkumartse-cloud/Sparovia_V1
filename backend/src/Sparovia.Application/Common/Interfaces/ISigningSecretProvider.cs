namespace Sparovia.Application.Common.Interfaces;

/// <summary>
/// Centralized provider for cryptographic signing and token verification secrets.
/// Guarantees that JWT auth tokens and HMAC-signed resource URLs use identical, validated secrets.
/// </summary>
public interface ISigningSecretProvider
{
    /// <summary>
    /// Gets the cryptographically validated signing secret (minimum 256 bits).
    /// </summary>
    string GetSigningSecret();

    /// <summary>
    /// Gets the configured JWT issuer.
    /// </summary>
    string GetIssuer();

    /// <summary>
    /// Gets the configured JWT audience.
    /// </summary>
    string GetAudience();
}
