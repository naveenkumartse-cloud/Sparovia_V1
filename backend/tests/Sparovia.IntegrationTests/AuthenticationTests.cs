using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Application.Onboarding;

namespace Sparovia.IntegrationTests;

public class AuthenticationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AuthenticationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ProtectedAdminEndpoint_RejectsUnauthenticated()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/admin/dashboard");
        
        // 401 Unauthorized expected because no cookie is sent
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task VerifyEmailFlow_IssuesCookie_And_RequiresOnboarding()
    {
        var client = _factory.CreateClient();
        var email = $"verifyflow-{Guid.NewGuid()}@sparovia.com";

        // 1. Register
        var regReq = new RegisterRequest
        {
            FullName = "Verify Tester",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };
        var regRes = await client.PostAsJsonAsync("/api/v1/auth/register", regReq);
        Assert.Equal(HttpStatusCode.OK, regRes.StatusCode);

        // 2. Set known verification token in DB
        const string rawToken = "known-secure-test-token-value";
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<Sparovia.Infrastructure.Data.SparoviaDbContext>();
            var user = await db.Users.SingleAsync(u => u.Email == email);
            user.VerificationTokenHash = tokenHash;
            user.VerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24);
            await db.SaveChangesAsync();
        }

        // 3. Verify Email -> Must succeed, issue Cookie, and return RequiresOnboarding
        var verifyRes = await client.PostAsJsonAsync("/api/v1/auth/verify-email", new VerifyEmailRequest
        {
            Email = email,
            Token = rawToken
        });
        Assert.Equal(HttpStatusCode.OK, verifyRes.StatusCode);
        Assert.True(verifyRes.Headers.Contains("Set-Cookie"));

        // 4. Check that user is authenticated in onboarding immediately (returns 204 or 200, not 401)
        var onboardingRes = await client.GetAsync("/api/v1/onboarding/business-basics");
        Assert.True(onboardingRes.StatusCode == HttpStatusCode.NoContent || onboardingRes.StatusCode == HttpStatusCode.OK);

        // 5. Admin Dashboard is protected by server gate -> Should return 403 Forbidden before confirmation
        var adminBeforeConfirm = await client.GetAsync("/api/v1/admin/dashboard");
        Assert.Equal(HttpStatusCode.Forbidden, adminBeforeConfirm.StatusCode);
    }

    [Fact]
    public async Task LoginFlow_SetsCookie_GatesAdminUntilOnboardingConfirmed()
    {
        var client = _factory.CreateClient();
        var email = $"authflow-{Guid.NewGuid()}@sparovia.com";

        // 1. Register
        var regReq = new RegisterRequest
        {
            FullName = "Auth Tester",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };
        await client.PostAsJsonAsync("/api/v1/auth/register", regReq);

        // 2. Attempt Login (Unverified) -> Should Fail
        var loginReq = new SignInRequest
        {
            Email = email,
            Password = "StrongPassword123!"
        };
        var loginUnverified = await client.PostAsJsonAsync("/api/v1/auth/login", loginReq);
        Assert.Equal(HttpStatusCode.BadRequest, loginUnverified.StatusCode);
        var unverifiedContent = await loginUnverified.Content.ReadAsStringAsync();
        Assert.Contains("verify your email", unverifiedContent);

        // 3. Verification (Directly in DB to simulate email verification)
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<Sparovia.Infrastructure.Data.SparoviaDbContext>();
            var user = db.Users.Single(u => u.Email == email);
            user.EmailVerified = true;
            await db.SaveChangesAsync();
        }

        // 4. Attempt Login (Verified) -> Should Succeed & Return Cookie
        var loginVerified = await client.PostAsJsonAsync("/api/v1/auth/login", loginReq);
        Assert.Equal(HttpStatusCode.OK, loginVerified.StatusCode);
        Assert.True(loginVerified.Headers.Contains("Set-Cookie"));

        // 5. Access /me endpoint -> Should return IsOnboardingConfirmed == false
        var meResponse = await client.GetFromJsonAsync<MeResponse>("/api/v1/auth/me");
        Assert.NotNull(meResponse);
        Assert.False(meResponse.IsOnboardingConfirmed);

        // 6. Access Protected Admin Dashboard before onboarding confirmation -> 403 Forbidden
        var forbiddenDashboard = await client.GetAsync("/api/v1/admin/dashboard");
        Assert.Equal(HttpStatusCode.Forbidden, forbiddenDashboard.StatusCode);

        // 7. Save Business Basics
        var basicsReq = new BusinessBasicsDto
        {
            BusinessName = "Apex Windows",
            BusinessType = "Storefront",
            PrimaryCategory = "Interior & Exterior",
            BusinessPhone = "+1 555-234-5678",
            BusinessEmail = "info@apexwindows.com",
            Website = "https://apexwindows.com"
        };
        var saveBasicsRes = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", basicsReq);
        Assert.Equal(HttpStatusCode.OK, saveBasicsRes.StatusCode);

        // 8. Confirm Business Context
        var confirmRes = await client.PostAsync("/api/v1/onboarding/confirm", null);
        Assert.Equal(HttpStatusCode.OK, confirmRes.StatusCode);

        // 9. Access Protected Admin Dashboard after onboarding confirmation -> 200 OK
        var protectedResponse = await client.GetAsync("/api/v1/admin/dashboard");
        Assert.Equal(HttpStatusCode.OK, protectedResponse.StatusCode);

        // 10. Check /me endpoint -> Should now return IsOnboardingConfirmed == true
        var meConfirmedResponse = await client.GetFromJsonAsync<MeResponse>("/api/v1/auth/me");
        Assert.NotNull(meConfirmedResponse);
        Assert.True(meConfirmedResponse.IsOnboardingConfirmed);

        // 11. Logout -> Should clear cookie
        var logoutResponse = await client.PostAsync("/api/v1/auth/logout", null);
        Assert.Equal(HttpStatusCode.OK, logoutResponse.StatusCode);
        
        // The cookie header should be set to expire
        var setCookie = logoutResponse.Headers.GetValues("Set-Cookie").First();
        Assert.Contains("expires=Thu, 01 Jan 1970 00:00:00 GMT", setCookie);

        // 12. Access Protected Endpoint after logout -> Should return 401 Unauthorized
        var afterLogoutResponse = await client.GetAsync("/api/v1/admin/dashboard");
        Assert.Equal(HttpStatusCode.Unauthorized, afterLogoutResponse.StatusCode);
    }

    [Fact]
    public async Task Login_ReturnsAccessToken_AndBearerHeaderAuthenticatesMeEndpoint()
    {
        var client = _factory.CreateClient();
        var email = $"jwttester-{Guid.NewGuid()}@sparovia.com";

        // 1. Register & verify user
        var regReq = new RegisterRequest
        {
            FullName = "JWT Bearer Tester",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };
        var regRes = await client.PostAsJsonAsync("/api/v1/auth/register", regReq);
        Assert.Equal(HttpStatusCode.OK, regRes.StatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<Sparovia.Infrastructure.Data.SparoviaDbContext>();
            var user = await db.Users.SingleAsync(u => u.Email == email);
            user.EmailVerified = true;
            user.PhoneVerified = true;
            await db.SaveChangesAsync();
        }

        // 2. Perform Login
        var loginReq = new SignInRequest
        {
            Email = email,
            Password = "StrongPassword123!"
        };
        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", loginReq);
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);

        var loginBody = await loginRes.Content.ReadFromJsonAsync<LoginSuccessResponse>();
        Assert.NotNull(loginBody);
        Assert.False(string.IsNullOrWhiteSpace(loginBody.AccessToken));
        Assert.Equal("Bearer", loginBody.TokenType);

        // 3. New separate HttpClient WITHOUT any cookies
        var bearerClient = _factory.CreateDefaultClient();
        bearerClient.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginBody.AccessToken);

        // 4. Access /api/v1/auth/me using Bearer token only -> Must return 200 OK
        var meRes = await bearerClient.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.OK, meRes.StatusCode);

        var meData = await meRes.Content.ReadFromJsonAsync<MeResponse>();
        Assert.NotNull(meData);
        Assert.Equal(email, meData.Email);

        // 5. Unauthenticated client (no cookie, no Bearer) -> Must return 401 Unauthorized
        var anonClient = _factory.CreateDefaultClient();
        var anonRes = await anonClient.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, anonRes.StatusCode);
    }

    private class LoginSuccessResponse
    {
        public string? Message { get; set; }
        public string? AccessToken { get; set; }
        public string? TokenType { get; set; }
        public int? ExpiresIn { get; set; }
    }

    private class MeResponse
    {
        public string? Email { get; set; }
        public bool IsOnboardingConfirmed { get; set; }
    }
}
