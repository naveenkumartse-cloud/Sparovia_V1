using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Application.Onboarding;
using Sparovia.Infrastructure.Data;

namespace Sparovia.IntegrationTests;

public class LocationCustomersTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public LocationCustomersTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient();
        
        var regReq = new RegisterRequest
        {
            FullName = "Test User",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };
        await client.PostAsJsonAsync("/api/v1/auth/register", regReq);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var user = db.Users.Single(u => u.Email == email);
            user.EmailVerified = true;
            await db.SaveChangesAsync();
        }

        var loginReq = new SignInRequest
        {
            Email = email,
            Password = "StrongPassword123!"
        };
        await client.PostAsJsonAsync("/api/v1/auth/login", loginReq);

        var basics = new BusinessBasicsDto
        {
            BusinessName = $"Company {email}",
            BusinessType = "Technology",
            PrimaryCategory = "Software",
            BusinessEmail = email
        };
        await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", basics);

        return client;
    }

    [Fact]
    public async Task LocationCustomers_FullLifecycle_SucceedsAndEnforcesIsolation()
    {
        var clientA = await GetAuthenticatedClientAsync($"locA-{Guid.NewGuid()}@test.com");
        var clientB = await GetAuthenticatedClientAsync($"locB-{Guid.NewGuid()}@test.com");

        // 1. Initial GET should be null or empty fields
        var getInitialA = await clientA.GetAsync("/api/v1/onboarding/location-customers");
        Assert.Equal(HttpStatusCode.OK, getInitialA.StatusCode);
        var initialDataA = await getInitialA.Content.ReadFromJsonAsync<LocationAndCustomersDto>();
        Assert.Null(initialDataA!.City);
        Assert.Empty(initialDataA.ServiceAreas ?? new List<string>());

        // 2. Client A saves data
        var requestA = new LocationAndCustomersDto
        {
            City = "Seattle",
            State = "WA",
            ServiceAreas = new List<string> { "Downtown", "Bellevue" },
            TargetCustomers = new List<string> { "Small Businesses", "Startups" }
        };
        var updateA = await clientA.PutAsJsonAsync("/api/v1/onboarding/location-customers", requestA);
        Assert.Equal(HttpStatusCode.OK, updateA.StatusCode);

        // 3. Client A fetches data and verifies arrays persisted
        var getSecondA = await clientA.GetAsync("/api/v1/onboarding/location-customers");
        var dataA = await getSecondA.Content.ReadFromJsonAsync<LocationAndCustomersDto>();
        Assert.Equal("Seattle", dataA!.City);
        Assert.Equal(2, dataA.ServiceAreas!.Count);
        Assert.Contains("Bellevue", dataA.ServiceAreas);
        Assert.Equal(2, dataA.TargetCustomers!.Count);

        // 4. Verify Client B's data is still empty (Isolation)
        var getSecondB = await clientB.GetAsync("/api/v1/onboarding/location-customers");
        var dataB = await getSecondB.Content.ReadFromJsonAsync<LocationAndCustomersDto>();
        Assert.Null(dataB!.City);
        Assert.Empty(dataB.ServiceAreas ?? new List<string>());

        // 5. Update B with different data
        var requestB = new LocationAndCustomersDto
        {
            City = "Portland",
            ServiceAreas = new List<string> { "Pearl District" }
        };
        await clientB.PutAsJsonAsync("/api/v1/onboarding/location-customers", requestB);

        // 6. Final verification to ensure A and B don't leak
        var finalA = await clientA.GetFromJsonAsync<LocationAndCustomersDto>("/api/v1/onboarding/location-customers");
        var finalB = await clientB.GetFromJsonAsync<LocationAndCustomersDto>("/api/v1/onboarding/location-customers");

        Assert.Equal("Seattle", finalA!.City);
        Assert.Equal("Portland", finalB!.City);
    }

    [Fact]
    public async Task LocationCustomers_Validation_RejectsInvalidInput()
    {
        var client = await GetAuthenticatedClientAsync($"loc-val-{Guid.NewGuid()}@test.com");

        var badRequest = new LocationAndCustomersDto
        {
            City = new string('A', 200) // Exceeds 100 char limit
        };

        var resp = await client.PutAsJsonAsync("/api/v1/onboarding/location-customers", badRequest);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }
}
