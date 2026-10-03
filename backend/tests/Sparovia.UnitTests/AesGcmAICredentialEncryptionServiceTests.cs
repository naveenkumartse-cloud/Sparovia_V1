using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using Sparovia.Infrastructure.AI;

namespace Sparovia.UnitTests;

public class AesGcmAICredentialEncryptionServiceTests
{
    private readonly AesGcmAICredentialEncryptionService _encryptionService;

    public AesGcmAICredentialEncryptionServiceTests()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AI:EncryptionKey"] = "UnitTestingKeyForAesGcmEncryptionMustBeStrong2026!"
            })
            .Build();

        _encryptionService = new AesGcmAICredentialEncryptionService(configuration);
    }

    [Fact]
    public void Encrypt_And_Decrypt_ReturnsOriginalApiKey()
    {
        var rawKey = "sk-proj-abc123xyz789SECRETKEY000";
        var encrypted = _encryptionService.Encrypt(rawKey);

        Assert.NotNull(encrypted);
        Assert.NotEqual(rawKey, encrypted);

        var decrypted = _encryptionService.Decrypt(encrypted);
        Assert.Equal(rawKey, decrypted);
    }

    [Fact]
    public void Encrypt_ProducesDifferentCiphertext_DueToUniqueNonces()
    {
        var rawKey = "sk-proj-same-key";
        var enc1 = _encryptionService.Encrypt(rawKey);
        var enc2 = _encryptionService.Encrypt(rawKey);

        Assert.NotEqual(enc1, enc2);
        Assert.Equal(_encryptionService.Decrypt(enc1), _encryptionService.Decrypt(enc2));
    }

    [Fact]
    public void Decrypt_TamperedCiphertext_ThrowsCryptographicException()
    {
        var rawKey = "sk-proj-secret-key-123";
        var encrypted = _encryptionService.Encrypt(rawKey);

        var bytes = Convert.FromBase64String(encrypted);
        bytes[^1] ^= 0xFF; // Tamper with last byte
        var tampered = Convert.ToBase64String(bytes);

        Assert.ThrowsAny<CryptographicException>(() => _encryptionService.Decrypt(tampered));
    }

    [Fact]
    public void MaskApiKey_MasksCorrectly()
    {
        var key = "sk-proj-1234567890abcdef1234";
        var masked = _encryptionService.MaskApiKey(key);

        Assert.StartsWith("sk-", masked);
        Assert.EndsWith("1234", masked);
        Assert.Contains("••••", masked);
        Assert.DoesNotContain("abcdef", masked);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("short")]
    public void MaskApiKey_ShortOrEmpty_ReturnsSafeDefaultMask(string? input)
    {
        var masked = _encryptionService.MaskApiKey(input!);
        Assert.Equal("••••••••••••••••", masked);
    }
}
