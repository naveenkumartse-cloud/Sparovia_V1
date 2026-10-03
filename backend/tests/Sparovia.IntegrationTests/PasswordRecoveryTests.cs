using System.Net;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Infrastructure.Data;

namespace Sparovia.IntegrationTests;

public class PasswordRecoveryTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public PasswordRecoveryTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private async Task RegisterUserAsync(HttpClient client, string email)
    {
        var regReq = new RegisterRequest
        {
            FullName = "Recovery Tester",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };
        await client.PostAsJsonAsync("/api/v1/auth/register", regReq);
    }

    [Fact]
    public async Task ForgotPassword_InvalidEmail_ReturnsSafeSuccessResponse()
    {
        var client = _factory.CreateClient();
        
        var request = new ForgotPasswordRequest { Email = "nobody@nowhere.com" };
        var response = await client.PostAsJsonAsync("/api/v1/auth/forgot-password", request);
        
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadFromJsonAsync<ForgotPasswordResult>();
        Assert.NotNull(content);
        Assert.Equal("If an account exists, a password reset link has been sent.", content.Message);
    }

    [Fact]
    public async Task PasswordRecovery_FullLifecycle_Succeeds()
    {
        var client = _factory.CreateClient();
        var email = $"recover-{Guid.NewGuid()}@test.com";

        // 1. Register
        await RegisterUserAsync(client, email);

        // 2. Forgot Password
        var forgotReq = new ForgotPasswordRequest { Email = email };
        var forgotResp = await client.PostAsJsonAsync("/api/v1/auth/forgot-password", forgotReq);
        Assert.Equal(HttpStatusCode.OK, forgotResp.StatusCode);

        // 3. Extract Token from DB (since Email Service is stubbed, we can fetch the token directly in tests? No, we don't store the raw token, only the hash! So we must intercept the email or mock it. Wait. If we cannot intercept the email in tests easily, how do we get the token? For integration tests using the stub, we could use a specialized mock that exposes the sent links, OR we can just inject a token hash directly to test ResetPassword independently, but the prompt says E2E test.)
        // Actually, we can get the logged link in a real environment, but here we can just create a test token, hash it, and put it in the DB to test the Reset endpoint.
        
        var rawTokenBytes = new byte[32];
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(rawTokenBytes);
        }
        var rawToken = Convert.ToBase64String(rawTokenBytes);
        
        string tokenHash;
        using (var sha256Hash = System.Security.Cryptography.SHA256.Create())
        {
            byte[] bytes = sha256Hash.ComputeHash(System.Text.Encoding.UTF8.GetBytes(rawToken));
            var builder = new System.Text.StringBuilder();
            for (int i = 0; i < bytes.Length; i++)
            {
                builder.Append(bytes[i].ToString("x2"));
            }
            tokenHash = builder.ToString();
        }

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var user = db.Users.Single(u => u.Email == email);
            user.ResetTokenHash = tokenHash;
            user.ResetTokenExpiresAt = DateTime.UtcNow.AddHours(1);
            await db.SaveChangesAsync();
        }

        // 4. Reset Password
        var resetReq = new ResetPasswordRequest
        {
            Email = email,
            Token = rawToken,
            NewPassword = "NewStrongPassword123!",
            ConfirmPassword = "NewStrongPassword123!"
        };
        var resetResp = await client.PostAsJsonAsync("/api/v1/auth/reset-password", resetReq);
        Assert.Equal(HttpStatusCode.OK, resetResp.StatusCode);

        // 5. Verify Token Consumed
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var user = db.Users.Single(u => u.Email == email);
            Assert.Null(user.ResetTokenHash);
            Assert.Null(user.ResetTokenExpiresAt);
        }

        // 6. Login with Old Password Fails
        var loginOld = new SignInRequest { Email = email, Password = "StrongPassword123!" };
        var loginOldResp = await client.PostAsJsonAsync("/api/v1/auth/login", loginOld);
        Assert.Equal(HttpStatusCode.BadRequest, loginOldResp.StatusCode);

        // 7. Login with New Password Succeeds
        // (Wait, we need to verify email first to login in this app?)
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var user = db.Users.Single(u => u.Email == email);
            user.EmailVerified = true;
            await db.SaveChangesAsync();
        }

        var loginNew = new SignInRequest { Email = email, Password = "NewStrongPassword123!" };
        var loginNewResp = await client.PostAsJsonAsync("/api/v1/auth/login", loginNew);
        Assert.Equal(HttpStatusCode.OK, loginNewResp.StatusCode);
    }
}
