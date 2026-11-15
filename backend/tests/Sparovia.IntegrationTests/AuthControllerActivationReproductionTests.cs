using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Sparovia.API.Controllers;
using Sparovia.Application.Common.Interfaces;
using Sparovia.Application.Identity;
using Sparovia.Infrastructure.Data;
using Xunit;

namespace Sparovia.IntegrationTests;

public class AuthControllerActivationReproductionTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AuthControllerActivationReproductionTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public void CanResolve_AuthController_InDefaultEnvironment()
    {
        using var scope = _factory.Services.CreateScope();
        var controller = ActivatorUtilities.CreateInstance<AuthController>(scope.ServiceProvider);
        Assert.NotNull(controller);
    }

    [Fact]
    public void CanResolve_AuthController_InProductionEnvironment_DirectlyFromAppsettings()
    {
        // Tests Production mode without manual configuration overrides
        var prodFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
        });

        using var scope = prodFactory.Services.CreateScope();
        var controller = ActivatorUtilities.CreateInstance<AuthController>(scope.ServiceProvider);
        Assert.NotNull(controller);
    }

    [Fact]
    public async Task PostLogin_InProductionEnvironment_ReturnsBadRequestForInvalidCredentials()
    {
        var prodFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
        });

        var client = prodFactory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new SignInRequest
        {
            Email = $"nonexistent-{Guid.NewGuid():N}@sparovia.com",
            Password = "WrongPassword123!"
        });

        // Controller activated, request processed, returned 400 Bad Request (Invalid credentials), NOT 500
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("We couldn't sign you in with those details", content);
    }

    [Fact]
    public void JwtToken_GenerationAndValidation_SucceedsWithSigningSecretProvider()
    {
        var prodFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
        });

        using var scope = prodFactory.Services.CreateScope();
        var signingProvider = scope.ServiceProvider.GetRequiredService<ISigningSecretProvider>();
        var secret = signingProvider.GetSigningSecret();
        var issuer = signingProvider.GetIssuer();
        var audience = signingProvider.GetAudience();

        Assert.NotNull(secret);
        Assert.True(secret.Length >= 32, "Signing secret must be at least 32 characters in Production");

        // Validate token generation and validation roundtrip
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds
        );
        var tokenStr = new JwtSecurityTokenHandler().WriteToken(token);

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(tokenStr, new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateLifetime = true
        }, out var validatedToken);

        Assert.NotNull(principal);
        Assert.NotNull(validatedToken);
    }

    [Fact]
    public async Task FullRegistrationAndLoginFlow_InProductionEnvironment()
    {
        var prodFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
        });

        var client = prodFactory.CreateClient();
        var email = $"prod-auth-flow-{Guid.NewGuid():N}@sparovia.com";
        var password = "StrongPassword2026!";

        // 1. Register
        var regRes = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            FullName = "Prod Auth User",
            Email = email,
            Password = password,
            ConfirmPassword = password,
            AcceptedTerms = true
        });
        Assert.Equal(HttpStatusCode.OK, regRes.StatusCode);

        // 2. Mark verified in DB for login test
        using (var scope = prodFactory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var user = await db.Users.SingleAsync(u => u.Email == email);
            user.EmailVerified = true;
            await db.SaveChangesAsync();
        }

        // 3. Login with valid credentials -> Returns HTTP 200, JWT token, and auth cookie
        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new SignInRequest
        {
            Email = email,
            Password = password
        });
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);

        var loginData = await loginRes.Content.ReadFromJsonAsync<LoginSuccessResponse>();
        Assert.NotNull(loginData);
        Assert.False(string.IsNullOrWhiteSpace(loginData.AccessToken));
        Assert.Equal("Bearer", loginData.TokenType);
        Assert.True(loginRes.Headers.Contains("Set-Cookie"));

        // 4. Verify the issued JWT token
        using (var scope = prodFactory.Services.CreateScope())
        {
            var signingProvider = scope.ServiceProvider.GetRequiredService<ISigningSecretProvider>();
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingProvider.GetSigningSecret()));
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(loginData.AccessToken, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = signingProvider.GetIssuer(),
                ValidateAudience = true,
                ValidAudience = signingProvider.GetAudience(),
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateLifetime = true
            }, out _);

            Assert.Equal(email, principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value);
        }
    }

    private class LoginSuccessResponse
    {
        public string? AccessToken { get; set; }
        public string? TokenType { get; set; }
        public int ExpiresIn { get; set; }
    }
}
