using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Sparovia.Infrastructure.Security;
using Xunit;

namespace Sparovia.UnitTests;

public class SigningSecretProviderTests
{
    private class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "Sparovia.API";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    [Fact]
    public void Production_WhenSecretIsMissing_ThrowsInvalidOperationException()
    {
        // Arrange
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
        var env = new TestHostEnvironment { EnvironmentName = Environments.Production };

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => new SigningSecretProvider(config, env));
        Assert.Contains("missing", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Production", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Production_WhenSecretIsInsecureFallback_ThrowsInvalidOperationException()
    {
        // Arrange
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = SigningSecretProvider.InsecureDevelopmentSecret
        }).Build();
        var env = new TestHostEnvironment { EnvironmentName = Environments.Production };

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => new SigningSecretProvider(config, env));
        Assert.Contains("Insecure fallback", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Production", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Production_WhenSecretIsShorterThan32Characters_ThrowsInvalidOperationException()
    {
        // Arrange: 31 characters
        var shortSecret = "ShortKeyUnder32Characters123456";
        Assert.Equal(31, shortSecret.Length);

        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = shortSecret
        }).Build();
        var env = new TestHostEnvironment { EnvironmentName = Environments.Production };

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => new SigningSecretProvider(config, env));
        Assert.Contains("insufficient length", ex.Message, StringComparison.OrdinalIgnoreCase);
        // CRITICAL: Ensure secret value is NEVER leaked into the exception message
        Assert.DoesNotContain(shortSecret, ex.Message);
    }

    [Fact]
    public void Production_WithStrongSecret_ResolvesSuccessfully()
    {
        // Arrange: 64 characters high-entropy key
        var strongSecret = "A_Very_Strong_Production_Secret_Key_For_Sparovia_Platform_2026_Secure!";
        Assert.True(strongSecret.Length >= 32);

        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = strongSecret,
            ["Jwt:Issuer"] = "Sparovia.Production",
            ["Jwt:Audience"] = "Sparovia.App"
        }).Build();
        var env = new TestHostEnvironment { EnvironmentName = Environments.Production };

        // Act
        var provider = new SigningSecretProvider(config, env);

        // Assert
        Assert.Equal(strongSecret, provider.GetSigningSecret());
        Assert.Equal("Sparovia.Production", provider.GetIssuer());
        Assert.Equal("Sparovia.App", provider.GetAudience());
    }

    [Fact]
    public void Development_WhenSecretMissing_ReturnsFallback()
    {
        // Arrange
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
        var env = new TestHostEnvironment { EnvironmentName = Environments.Development };

        // Act
        var provider = new SigningSecretProvider(config, env);

        // Assert
        Assert.Equal(SigningSecretProvider.InsecureDevelopmentSecret, provider.GetSigningSecret());
    }

    [Fact]
    public void Development_WhenSecretConfigured_UsesConfiguredSecret()
    {
        // Arrange
        var customDevSecret = "CustomDevSecretKey_AtLeast32CharactersLong_2026!";
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = customDevSecret
        }).Build();
        var env = new TestHostEnvironment { EnvironmentName = Environments.Development };

        // Act
        var provider = new SigningSecretProvider(config, env);

        // Assert
        Assert.Equal(customDevSecret, provider.GetSigningSecret());
    }

    [Fact]
    public void Development_WhenConfiguredSecretTooShort_ThrowsInvalidOperationException()
    {
        // Arrange
        var shortSecret = "too-short";
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = shortSecret
        }).Build();
        var env = new TestHostEnvironment { EnvironmentName = Environments.Development };

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => new SigningSecretProvider(config, env));
        Assert.Contains("insufficient length", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(shortSecret, ex.Message);
    }

    [Fact]
    public void SecretResolution_Resolves_JWT_SECRET_When_JwtSecret_Is_Not_Set()
    {
        // Arrange
        var renderSecret = "RenderConfiguredSecret_AtLeast32Chars_SecureKey2026!";
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["JWT_SECRET"] = renderSecret
        }).Build();
        var env = new TestHostEnvironment { EnvironmentName = Environments.Production };

        // Act
        var provider = new SigningSecretProvider(config, env);

        // Assert
        Assert.Equal(renderSecret, provider.GetSigningSecret());
    }

    [Fact]
    public void SecretResolution_Prioritizes_JwtSecret_Over_JWT_SECRET()
    {
        // Arrange
        var primarySecret = "PrimaryConfigSecret_32Chars_MinimumEntropy2026!!";
        var secondarySecret = "SecondaryConfigSecret_32Chars_MinimumEntropy2026!";
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = primarySecret,
            ["JWT_SECRET"] = secondarySecret
        }).Build();
        var env = new TestHostEnvironment { EnvironmentName = Environments.Production };

        // Act
        var provider = new SigningSecretProvider(config, env);

        // Assert
        Assert.Equal(primarySecret, provider.GetSigningSecret());
    }

    [Fact]
    public void SignatureVerification_Succeeds_WithIdenticalSecret()
    {
        // Arrange
        var imageId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var exp = DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds();
        var secret = "SharedCryptographicSecretKey_32CharsLong_2026!!";

        // Act
        var payload = $"{imageId:D}:{tenantId:D}:{exp}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var signature = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();

        // Verify
        using var verifyHmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var expected = Convert.ToHexString(verifyHmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();
        var match = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected),
            Encoding.UTF8.GetBytes(signature));

        // Assert
        Assert.True(match);
    }

    [Fact]
    public void SignatureVerification_Fails_WithMismatchedSecret()
    {
        // Arrange
        var imageId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var exp = DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds();
        var secretA = "SecretKey_Alpha_AtLeast32CharsLong_2026_Secure!";
        var secretB = "SecretKey_Beta__AtLeast32CharsLong_2026_Secure!";

        // Act: Sign with Secret A
        var payload = $"{imageId:D}:{tenantId:D}:{exp}";
        using var hmacA = new HMACSHA256(Encoding.UTF8.GetBytes(secretA));
        var signatureFromA = Convert.ToHexString(hmacA.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();

        // Verify with Secret B
        using var hmacB = new HMACSHA256(Encoding.UTF8.GetBytes(secretB));
        var expectedFromB = Convert.ToHexString(hmacB.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();
        var match = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expectedFromB),
            Encoding.UTF8.GetBytes(signatureFromA));

        // Assert: Must not match
        Assert.False(match);
    }

    [Fact]
    public void SignatureVerification_Fails_WhenTimestampIsExpired()
    {
        // Arrange: Expired 5 seconds ago
        var exp = DateTimeOffset.UtcNow.AddSeconds(-5).ToUnixTimeSeconds();
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        // Assert: exp must be strictly greater than now
        Assert.True(now > exp, "Timestamp must be expired for this test");
    }

    [Fact]
    public void SignatureVerification_Fails_WhenTenantIdIsTampered()
    {
        // Arrange
        var imageId = Guid.NewGuid();
        var tenantVictim = Guid.NewGuid();
        var tenantAttacker = Guid.NewGuid();
        var exp = DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds();
        var secret = "SharedCryptographicSecretKey_32CharsLong_2026!!";

        // Act: Sign for victim tenant
        var victimPayload = $"{imageId:D}:{tenantVictim:D}:{exp}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var victimSig = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(victimPayload))).ToLowerInvariant();

        // Verify with attacker tenant
        var attackerPayload = $"{imageId:D}:{tenantAttacker:D}:{exp}";
        using var hmacVerify = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var attackerExpected = Convert.ToHexString(hmacVerify.ComputeHash(Encoding.UTF8.GetBytes(attackerPayload))).ToLowerInvariant();

        var match = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(attackerExpected),
            Encoding.UTF8.GetBytes(victimSig));

        // Assert: Cross-tenant signature reuse must fail
        Assert.False(match);
    }

    [Fact]
    public void VariantSignature_ValidSignature_VerifiesSuccessfully()
    {
        // Arrange
        var imageId = Guid.NewGuid();
        var variantId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var exp = DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeSeconds();
        var secret = "SharedCryptographicSecretKey_32CharsLong_2026!!";

        // Act
        var payload = $"{imageId:D}:{variantId:D}:{tenantId:D}:{exp}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var signature = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();

        // Verify
        using var verifyHmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var expected = Convert.ToHexString(verifyHmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();
        var match = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected),
            Encoding.UTF8.GetBytes(signature));

        // Assert
        Assert.True(match);
    }

    [Fact]
    public void VariantSignature_ImageSignatureCannotBeUsedForVariant()
    {
        // Arrange
        var imageId = Guid.NewGuid();
        var variantId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var exp = DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeSeconds();
        var secret = "SharedCryptographicSecretKey_32CharsLong_2026!!";

        // Act: Generate image signature
        var imagePayload = $"{imageId:D}:{tenantId:D}:{exp}";
        using var hmacImage = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var imageSignature = Convert.ToHexString(hmacImage.ComputeHash(Encoding.UTF8.GetBytes(imagePayload))).ToLowerInvariant();

        // Expected variant payload requires variantId
        var variantPayload = $"{imageId:D}:{variantId:D}:{tenantId:D}:{exp}";
        using var hmacVariant = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var variantExpected = Convert.ToHexString(hmacVariant.ComputeHash(Encoding.UTF8.GetBytes(variantPayload))).ToLowerInvariant();

        var match = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(variantExpected),
            Encoding.UTF8.GetBytes(imageSignature));

        // Assert: Image signature must NEVER authorize a variant
        Assert.False(match);
    }

    [Fact]
    public void VariantSignature_CannotBeUsedForDifferentVariantOfSameImage()
    {
        // Arrange
        var imageId = Guid.NewGuid();
        var variant1 = Guid.NewGuid();
        var variant2 = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var exp = DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeSeconds();
        var secret = "SharedCryptographicSecretKey_32CharsLong_2026!!";

        // Act: Sign for Variant 1
        var payload1 = $"{imageId:D}:{variant1:D}:{tenantId:D}:{exp}";
        using var hmac1 = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var sig1 = Convert.ToHexString(hmac1.ComputeHash(Encoding.UTF8.GetBytes(payload1))).ToLowerInvariant();

        // Expected for Variant 2
        var payload2 = $"{imageId:D}:{variant2:D}:{tenantId:D}:{exp}";
        using var hmac2 = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var expected2 = Convert.ToHexString(hmac2.ComputeHash(Encoding.UTF8.GetBytes(payload2))).ToLowerInvariant();

        var match = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected2),
            Encoding.UTF8.GetBytes(sig1));

        // Assert: Cross-variant substitution must fail
        Assert.False(match);
    }

    [Fact]
    public void VariantSignature_CannotBeUsedUnderDifferentImageId()
    {
        // Arrange
        var image1 = Guid.NewGuid();
        var image2 = Guid.NewGuid();
        var variantId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var exp = DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeSeconds();
        var secret = "SharedCryptographicSecretKey_32CharsLong_2026!!";

        // Act: Sign for (Image 1, Variant)
        var payload1 = $"{image1:D}:{variantId:D}:{tenantId:D}:{exp}";
        using var hmac1 = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var sig1 = Convert.ToHexString(hmac1.ComputeHash(Encoding.UTF8.GetBytes(payload1))).ToLowerInvariant();

        // Expected under Image 2
        var payload2 = $"{image2:D}:{variantId:D}:{tenantId:D}:{exp}";
        using var hmac2 = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var expected2 = Convert.ToHexString(hmac2.ComputeHash(Encoding.UTF8.GetBytes(payload2))).ToLowerInvariant();

        var match = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected2),
            Encoding.UTF8.GetBytes(sig1));

        // Assert: Tampered parent image ID must fail
        Assert.False(match);
    }
}
