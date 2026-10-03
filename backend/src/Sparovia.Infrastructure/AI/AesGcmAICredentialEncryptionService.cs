using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Sparovia.Application.AI;

namespace Sparovia.Infrastructure.AI;

/// <summary>
/// Production AES-256-GCM authenticated encryption service for tenant AI provider API keys.
/// Generates a unique 96-bit nonce and 128-bit authentication tag per encryption operation.
/// </summary>
public class AesGcmAICredentialEncryptionService : IAICredentialEncryptionService
{
    private const int NonceSize = 12; // 96 bits
    private const int TagSize = 16;   // 128 bits
    private readonly byte[] _key;

    public AesGcmAICredentialEncryptionService(IConfiguration configuration)
    {
        // Obtain encryption secret or derive a 256-bit key
        var secret = configuration["AI:EncryptionKey"] 
                     ?? configuration["Jwt:Secret"] 
                     ?? "SparoviaDefaultProductionGradeKeyForTenantAICredentialEncryption_2026_Secure!";
        
        using var sha256 = SHA256.Create();
        _key = sha256.ComputeHash(Encoding.UTF8.GetBytes(secret));
    }

    public string Encrypt(string plainTextApiKey)
    {
        if (string.IsNullOrEmpty(plainTextApiKey))
            throw new ArgumentException("API key cannot be empty.", nameof(plainTextApiKey));

        var plainBytes = Encoding.UTF8.GetBytes(plainTextApiKey);
        var nonce = new byte[NonceSize];
        RandomNumberGenerator.Fill(nonce);

        var cipherBytes = new byte[plainBytes.Length];
        var tag = new byte[TagSize];

        using var aesGcm = new AesGcm(_key, TagSize);
        aesGcm.Encrypt(nonce, plainBytes, cipherBytes, tag);

        // Result format: [Nonce (12)] + [Tag (16)] + [Ciphertext (N)]
        var payload = new byte[NonceSize + TagSize + cipherBytes.Length];
        Buffer.BlockCopy(nonce, 0, payload, 0, NonceSize);
        Buffer.BlockCopy(tag, 0, payload, NonceSize, TagSize);
        Buffer.BlockCopy(cipherBytes, 0, payload, NonceSize + TagSize, cipherBytes.Length);

        return Convert.ToBase64String(payload);
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrWhiteSpace(cipherText))
            throw new ArgumentException("Ciphertext cannot be empty.", nameof(cipherText));

        byte[] payload;
        try
        {
            payload = Convert.FromBase64String(cipherText);
        }
        catch (FormatException ex)
        {
            throw new CryptographicException("Invalid ciphertext format.", ex);
        }

        if (payload.Length < NonceSize + TagSize)
            throw new CryptographicException("Ciphertext is too short to be valid.");

        var nonce = new byte[NonceSize];
        var tag = new byte[TagSize];
        var cipherLength = payload.Length - NonceSize - TagSize;
        var cipherBytes = new byte[cipherLength];

        Buffer.BlockCopy(payload, 0, nonce, 0, NonceSize);
        Buffer.BlockCopy(payload, NonceSize, tag, 0, TagSize);
        Buffer.BlockCopy(payload, NonceSize + TagSize, cipherBytes, 0, cipherLength);

        var plainBytes = new byte[cipherLength];
        using var aesGcm = new AesGcm(_key, TagSize);
        aesGcm.Decrypt(nonce, cipherBytes, tag, plainBytes);

        return Encoding.UTF8.GetString(plainBytes);
    }

    public string MaskApiKey(string plainTextApiKey)
    {
        if (string.IsNullOrWhiteSpace(plainTextApiKey))
            return "••••••••••••••••";

        var trimmed = plainTextApiKey.Trim();
        if (trimmed.Length <= 8)
            return "••••••••••••••••";

        var prefix = trimmed.Length >= 4 ? trimmed[..3] : "";
        var suffix = trimmed[^4..];

        return $"{prefix}...••••{suffix}";
    }
}
