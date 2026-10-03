using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Application.Onboarding;
using Sparovia.Infrastructure.Data;

namespace Sparovia.IntegrationTests;

public class BusinessBasicsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public BusinessBasicsTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient();

        // Register
        var regReq = new RegisterRequest
        {
            FullName = "Tester",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };
        await client.PostAsJsonAsync("/api/v1/auth/register", regReq);

        // Verify
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var user = db.Users.Single(u => u.Email == email);
            user.EmailVerified = true;
            await db.SaveChangesAsync();
        }

        // Login
        var loginReq = new SignInRequest { Email = email, Password = "StrongPassword123!" };
        await client.PostAsJsonAsync("/api/v1/auth/login", loginReq);

        return client;
    }

    [Fact]
    public async Task BusinessBasics_FullLifecycle_SucceedsAndEnforcesIsolation()
    {
        // 1. Setup two separate users/tenants
        var clientA = await GetAuthenticatedClientAsync($"userA-{Guid.NewGuid()}@test.com");
        var clientB = await GetAuthenticatedClientAsync($"userB-{Guid.NewGuid()}@test.com");

        // 2. Client A saves their business basics
        var basicsA = new BusinessBasicsDto
        {
            BusinessName = "Company A",
            BusinessType = "Technology",
            PrimaryCategory = "Software",
            BusinessEmail = "hello@companya.com",
            Website = "https://companya.com"
        };
        
        var saveResponseA = await clientA.PutAsJsonAsync("/api/v1/onboarding/business-basics", basicsA);
        Assert.Equal(HttpStatusCode.OK, saveResponseA.StatusCode);

        // 3. Client A fetches their business basics
        var getResponseA = await clientA.GetAsync("/api/v1/onboarding/business-basics");
        Assert.Equal(HttpStatusCode.OK, getResponseA.StatusCode);
        var fetchedA = await getResponseA.Content.ReadFromJsonAsync<BusinessBasicsDto>();
        Assert.NotNull(fetchedA);
        
        Assert.Equal("Company A", fetchedA.BusinessName);
        Assert.Equal("Technology", fetchedA.BusinessType);

        // 4. Client B fetches their business basics -> Should be empty (204 No Content)
        var getResponseB = await clientB.GetAsync("/api/v1/onboarding/business-basics");
        Assert.Equal(HttpStatusCode.NoContent, getResponseB.StatusCode);
        
        // Let's get TenantId of A from a fresh GET /api/v1/auth/me to properly scope the DB check
        var meResponse = await clientA.GetAsync("/api/v1/auth/me");
        var meData = await meResponse.Content.ReadFromJsonAsync<System.Text.Json.Nodes.JsonObject>();
        var tenantIdA = Guid.Parse(meData!["tenantId"]!.ToString());

        // 5. Client A updates their basics
        basicsA.BusinessName = "Company A Updated";
        var updateResponseA = await clientA.PutAsJsonAsync("/api/v1/onboarding/business-basics", basicsA);
        Assert.Equal(HttpStatusCode.OK, updateResponseA.StatusCode);

        // Verify in DB that only 1 record exists for A (No duplicates created)
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var count = db.BusinessContexts.Count(b => b.TenantId == tenantIdA);
            Assert.Equal(1, count);
        }
    }

    [Fact]
    public async Task BusinessBasics_InvalidData_IsRejected()
    {
        var client = await GetAuthenticatedClientAsync($"baduser-{Guid.NewGuid()}@test.com");

        var badBasics = new BusinessBasicsDto
        {
            BusinessName = "", // Invalid: Required
            BusinessType = "FakeType", // Invalid: Not in allowed list
            PrimaryCategory = "Software",
            BusinessEmail = "not-an-email", // Invalid: Bad format
            Website = "ftp://bad-url.com" // Invalid: Not HTTP/HTTPS
        };

        var response = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", badBasics);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
