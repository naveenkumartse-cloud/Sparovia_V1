using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using Sparovia.Application.Common;
using Sparovia.Application.Identity;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Identity;
using Xunit;

namespace Sparovia.UnitTests;

public class PhoneNumberHelperTests
{
    [Theory]
    [InlineData("+1 (555) 123-4567", "+15551234567")]
    [InlineData("+91 98765 43210", "+919876543210")]
    [InlineData("9876543210", "+919876543210")] // 10 digits default +91
    [InlineData("+44 20 7946 0958", "+442079460958")]
    public void Normalize_ValidPhoneNumbers_ReturnsStandardE164(string raw, string expected)
    {
        var normalized = PhoneNumberHelper.Normalize(raw);
        Assert.Equal(expected, normalized);
    }

    [Theory]
    [InlineData("+15551234567", true)]
    [InlineData("+919876543210", true)]
    [InlineData("+442079460958", true)]
    [InlineData("123", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    [InlineData("abc", false)]
    public void IsValidE164_ValidatesAccurately(string? phone, bool expected)
    {
        var isValid = PhoneNumberHelper.IsValidE164(phone);
        Assert.Equal(expected, isValid);
    }

    [Fact]
    public void Mask_MasksSensitiveDigitsExceptLastFour()
    {
        var phone = "+919876543210";
        var masked = PhoneNumberHelper.Mask(phone);

        Assert.EndsWith("3210", masked);
        Assert.Contains("******", masked);
        Assert.DoesNotContain("987654", masked);
    }

    [Fact]
    public void Mask_NullOrEmpty_ReturnsMaskedFallback()
    {
        Assert.Equal("******", PhoneNumberHelper.Mask(null));
        Assert.Equal("******", PhoneNumberHelper.Mask(""));
    }

    [Theory]
    [InlineData("9876543210", true)]
    [InlineData("+919876543210", true)]
    [InlineData("6123456789", true)]
    [InlineData("7012345678", true)]
    [InlineData("8901234567", true)]
    [InlineData("98765", false)] // too short
    [InlineData("98765432101", false)] // 11 digits
    [InlineData("98765abcde", false)] // letters
    [InlineData("98-76543210", false)] // special chars
    [InlineData("98765 43210", false)] // spaces
    [InlineData("1234567890", false)] // doesn't start with 6-9
    [InlineData("", false)]
    [InlineData(null, false)]
    public void IsValidIndianPhoneNumber_ValidatesCorrectly(string? phone, bool expected)
    {
        var isValid = PhoneNumberHelper.IsValidIndianPhoneNumber(phone);
        Assert.Equal(expected, isValid);
    }

    [Theory]
    [InlineData("9876543210", "+919876543210")]
    [InlineData("+919876543210", "+919876543210")]
    [InlineData("98765abcde", null)]
    [InlineData("98765", null)]
    [InlineData("", null)]
    public void NormalizeIndianPhoneNumber_NormalizesOrReturnsNull(string? phone, string? expected)
    {
        var normalized = PhoneNumberHelper.NormalizeIndianPhoneNumber(phone);
        Assert.Equal(expected, normalized);
    }
}

public class OtpServiceTests
{
    private readonly OtpService _otpService;

    public OtpServiceTests()
    {
        _otpService = new OtpService();
    }

    [Fact]
    public void GenerateOtp_ProducesValid6DigitNumericString()
    {
        for (int i = 0; i < 20; i++)
        {
            var otp = _otpService.GenerateOtp();
            Assert.NotNull(otp);
            Assert.Equal(6, otp.Length);
            Assert.True(int.TryParse(otp, out var numericVal));
            Assert.InRange(numericVal, 100000, 999999);
        }
    }

    [Fact]
    public void GenerateOtp_GeneratesRandomValues()
    {
        var set = new HashSet<string>();
        for (int i = 0; i < 50; i++)
        {
            set.Add(_otpService.GenerateOtp());
        }
        // Cryptographically random 6 digits across 50 generations should have high entropy (at least 45 unique values)
        Assert.True(set.Count >= 45, $"Expected high entropy but got {set.Count} unique OTPs out of 50");
    }

    [Fact]
    public void HashOtp_And_VerifyOtp_WorksAccurately()
    {
        var otp = "654321";
        var hash = _otpService.HashOtp(otp);

        Assert.NotNull(hash);
        Assert.NotEmpty(hash);

        // Correct OTP returns true
        Assert.True(_otpService.VerifyOtp(otp, hash));

        // Incorrect OTP returns false
        Assert.False(_otpService.VerifyOtp("123456", hash));
        Assert.False(_otpService.VerifyOtp("", hash));
        Assert.False(_otpService.VerifyOtp(null!, hash));
    }

    [Fact]
    public void VerifyOtp_WithNullOrEmptyHash_ReturnsFalse()
    {
        Assert.False(_otpService.VerifyOtp("123456", null!));
        Assert.False(_otpService.VerifyOtp("123456", ""));
    }
}

public class PhoneVerificationEntityTests
{
    [Fact]
    public void PhoneVerification_Initialization_SetsDefaults()
    {
        var verification = new PhoneVerification
        {
            PhoneNumber = "+91 98765 43210",
            PhoneNumberNormalized = "+919876543210",
            OtpHash = "sample-sha256-hash",
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            Status = "Pending"
        };

        Assert.Equal("+91 98765 43210", verification.PhoneNumber);
        Assert.Equal("+919876543210", verification.PhoneNumberNormalized);
        Assert.Equal(0, verification.AttemptCount);
        Assert.Null(verification.VerifiedAt);
        Assert.Null(verification.ConsumedAt);
        Assert.Equal("Pending", verification.Status);
    }
}
