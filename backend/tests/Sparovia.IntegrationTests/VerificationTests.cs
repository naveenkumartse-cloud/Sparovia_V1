using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Sparovia.IntegrationTests;

public class VerificationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public VerificationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ResendVerification_WorksAndIsRateLimited()
    {
        // Arrange
        var client = _factory.CreateClient();
        var uniqueEmail = $"resend-{Guid.NewGuid()}@sparovia.com";
        var request = new RegisterRequest
        {
            FullName = "Resend User",
            Email = uniqueEmail,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };

        // Create user
        await client.PostAsJsonAsync("/api/v1/auth/register", request);

        // Act: Resend 1 (should succeed)
        var resendReq = new ResendVerificationRequest { Email = uniqueEmail };
        var resend1 = await client.PostAsJsonAsync("/api/v1/auth/resend-verification", resendReq);
        Assert.Equal(HttpStatusCode.OK, resend1.StatusCode);

        // Resend 2 (should succeed)
        var resend2 = await client.PostAsJsonAsync("/api/v1/auth/resend-verification", resendReq);
        Assert.Equal(HttpStatusCode.OK, resend2.StatusCode);

        // Resend 3 (should succeed)
        var resend3 = await client.PostAsJsonAsync("/api/v1/auth/resend-verification", resendReq);
        Assert.Equal(HttpStatusCode.OK, resend3.StatusCode);

        // Resend 4 (should hit rate limit: 429 Too Many Requests or 503 depending on default)
        var resend4 = await client.PostAsJsonAsync("/api/v1/auth/resend-verification", resendReq);
        Assert.Equal(HttpStatusCode.TooManyRequests, resend4.StatusCode);
    }

    [Fact]
    public async Task VerifyEmail_WithInvalidToken_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();
        var uniqueEmail = $"invalid-token-{Guid.NewGuid()}@sparovia.com";
        await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            FullName = "Invalid Token User",
            Email = uniqueEmail,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        });

        var response = await client.PostAsJsonAsync("/api/v1/auth/verify-email", new VerifyEmailRequest
        {
            Email = uniqueEmail,
            Token = "totally-invalid-or-corrupt-token"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("This verification link is invalid or has expired", body);
    }

    [Fact]
    public async Task VerifyEmail_WithExpiredToken_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();
        var uniqueEmail = $"expired-token-{Guid.NewGuid()}@sparovia.com";
        await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            FullName = "Expired Token User",
            Email = uniqueEmail,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        });

        // Artificially expire the token in the database
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var user = await db.Users.FirstAsync(u => u.Email == uniqueEmail);
            user.VerificationTokenExpiresAt = DateTime.UtcNow.AddMinutes(-5);
            await db.SaveChangesAsync();
        }

        var response = await client.PostAsJsonAsync("/api/v1/auth/verify-email", new VerifyEmailRequest
        {
            Email = uniqueEmail,
            Token = "any-token-since-expiry-checked-first"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("This verification link is invalid or has expired", body);
    }

    [Fact]
    public async Task VerifyEmail_WithAlreadyVerifiedAccount_ReturnsOkWithAlreadyVerifiedMessage()
    {
        var client = _factory.CreateClient();
        var uniqueEmail = $"already-verified-{Guid.NewGuid()}@sparovia.com";
        await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            FullName = "Already Verified User",
            Email = uniqueEmail,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        });

        // Set user to verified in the database
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var user = await db.Users.FirstAsync(u => u.Email == uniqueEmail);
            user.EmailVerified = true;
            await db.SaveChangesAsync();
        }

        var response = await client.PostAsJsonAsync("/api/v1/auth/verify-email", new VerifyEmailRequest
        {
            Email = uniqueEmail,
            Token = "dummy-token"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Your email is already verified", body);
    }
}
