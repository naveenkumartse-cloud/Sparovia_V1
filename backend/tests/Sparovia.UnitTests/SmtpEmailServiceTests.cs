using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Sparovia.Infrastructure.Email;

namespace Sparovia.UnitTests;

public class SmtpEmailServiceTests
{
    [Fact]
    public void SmtpOptions_FromConfiguration_BindsFromEmailSection()
    {
        var configData = new Dictionary<string, string?>
        {
            ["Email:Smtp:Host"] = "smtp.example.com",
            ["Email:Smtp:Port"] = "465",
            ["Email:Smtp:Username"] = "user@example.com",
            ["Email:Smtp:Password"] = "secret123",
            ["Email:Smtp:FromEmail"] = "noreply@sparovia.com",
            ["Email:Smtp:FromName"] = "Sparovia Team",
            ["Email:Smtp:EnableSsl"] = "true",
            ["Email:Smtp:EnableDelivery"] = "true"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        var options = SmtpOptions.FromConfiguration(configuration);

        Assert.Equal("smtp.example.com", options.Host);
        Assert.Equal(465, options.Port);
        Assert.Equal("user@example.com", options.Username);
        Assert.Equal("secret123", options.Password);
        Assert.Equal("noreply@sparovia.com", options.FromEmail);
        Assert.Equal("Sparovia Team", options.FromName);
        Assert.True(options.EnableSsl);
        Assert.True(options.EnableDelivery);
    }

    [Fact]
    public void SmtpOptions_FromConfiguration_BindsFromRenderFlatEnvVars()
    {
        var configData = new Dictionary<string, string?>
        {
            ["SMTP_HOST"] = "smtp.render.com",
            ["SMTP_PORT"] = "587",
            ["SMTP_USERNAME"] = "renderuser",
            ["SMTP_PASSWORD"] = "renderpass",
            ["SMTP_FROM_EMAIL"] = "admin@sparovia.com",
            ["SMTP_FROM_NAME"] = "Sparovia Cloud",
            ["SMTP_ENABLE_SSL"] = "true"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        var options = SmtpOptions.FromConfiguration(configuration);

        Assert.Equal("smtp.render.com", options.Host);
        Assert.Equal(587, options.Port);
        Assert.Equal("renderuser", options.Username);
        Assert.Equal("renderpass", options.Password);
        Assert.Equal("admin@sparovia.com", options.FromEmail);
        Assert.Equal("Sparovia Cloud", options.FromName);
        Assert.True(options.EnableSsl);
    }

    [Fact]
    public async Task SmtpEmailService_ThrowsWhenHostMissing()
    {
        var options = Options.Create(new SmtpOptions
        {
            Host = "",
            FromEmail = "test@sparovia.com"
        });
        var logger = NullLogger<SmtpEmailService>.Instance;
        var service = new SmtpEmailService(options, logger);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SendVerificationEmailAsync("recipient@example.com", "https://sparovia.com/verify?token=123"));

        Assert.Contains("SMTP host is not configured", ex.Message);
    }

    [Fact]
    public async Task SmtpEmailService_ThrowsWhenFromEmailMissing()
    {
        var options = Options.Create(new SmtpOptions
        {
            Host = "smtp.example.com",
            FromEmail = ""
        });
        var logger = NullLogger<SmtpEmailService>.Instance;
        var service = new SmtpEmailService(options, logger);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SendVerificationEmailAsync("recipient@example.com", "https://sparovia.com/verify?token=123"));

        Assert.Contains("SMTP FromEmail is not configured", ex.Message);
    }

    [Fact]
    public void EmailTemplates_VerificationEmail_GeneratesBrandedHtmlAndPlainText()
    {
        var link = "https://sparovia-v1.vercel.app/verify-email?email=user%40test.com&token=sample-token-123";
        var (html, plainText) = EmailTemplates.GetVerificationEmail(link);

        // Verification HTML checks
        Assert.Contains("SPAROVIA", html);
        Assert.Contains("Verify your email address", html);
        Assert.Contains("href=\"https://sparovia-v1.vercel.app/verify-email?email=user%40test.com&amp;token=sample-token-123\"", html);
        Assert.Contains("24 hours", html);
        Assert.Contains("Security Notice", html);
        Assert.DoesNotContain("secret", html.ToLowerInvariant());

        // Plain text checks
        Assert.Contains("SPAROVIA", plainText);
        Assert.Contains(link, plainText);
        Assert.Contains("24 hours", plainText);
    }

    [Fact]
    public void EmailTemplates_PasswordResetEmail_GeneratesBrandedHtmlAndPlainText()
    {
        var link = "https://sparovia-v1.vercel.app/reset-password?email=user%40test.com&token=reset-token-456";
        var (html, plainText) = EmailTemplates.GetPasswordResetEmail(link);

        // Reset HTML checks
        Assert.Contains("SPAROVIA", html);
        Assert.Contains("Reset your password", html);
        Assert.Contains("href=\"https://sparovia-v1.vercel.app/reset-password?email=user%40test.com&amp;token=reset-token-456\"", html);
        Assert.Contains("1 hour", html);
        Assert.Contains("Security Notice", html);

        // Plain text checks
        Assert.Contains("SPAROVIA", plainText);
        Assert.Contains(link, plainText);
        Assert.Contains("1 hour", plainText);
    }

    [Theory]
    [InlineData("alice@example.com", "a***e@example.com")]
    [InlineData("bob@test.org", "b*b@test.org")]
    [InlineData("me@domain.com", "m*@domain.com")]
    public void SmtpEmailService_MaskEmail_SafelyMasksAddresses(string input, string expected)
    {
        var result = SmtpEmailService.MaskEmail(input);
        Assert.Equal(expected, result);
    }
}
