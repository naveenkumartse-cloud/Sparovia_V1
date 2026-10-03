using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Sparovia.IntegrationTests;

public class RegistrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public RegistrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Register_WithValidData_CreatesAccountAndTenant()
    {
        // Arrange
        var client = _factory.CreateClient();
        var uniqueEmail = $"test-{Guid.NewGuid()}@sparovia.com";
        var request = new RegisterRequest
        {
            FullName = "Test User",
            Email = uniqueEmail,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verify Database
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == uniqueEmail);
        Assert.NotNull(user);
        Assert.False(user.EmailVerified);
        
        var membership = await db.Memberships.Include(m => m.Tenant).FirstOrDefaultAsync(m => m.UserId == user.Id);
        Assert.NotNull(membership);
        Assert.Equal("Owner", membership.Role);
        Assert.NotNull(membership.Tenant);
        Assert.Equal("Test User's Workspace", membership.Tenant.Name);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateClient();
        var uniqueEmail = $"dup-{Guid.NewGuid()}@sparovia.com";
        var request = new RegisterRequest
        {
            FullName = "Dup User",
            Email = uniqueEmail,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };

        // Create first user
        await client.PostAsJsonAsync("/api/v1/auth/register", request);

        // Act: Try to create again
        var duplicateResponse = await client.PostAsJsonAsync("/api/v1/auth/register", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, duplicateResponse.StatusCode);
    }
}
