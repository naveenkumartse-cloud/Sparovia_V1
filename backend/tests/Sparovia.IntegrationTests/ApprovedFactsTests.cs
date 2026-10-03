using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Application.Onboarding;
using Sparovia.Infrastructure.Data;

namespace Sparovia.IntegrationTests;

public class ApprovedFactsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ApprovedFactsTests(WebApplicationFactory<Program> factory)
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
    public async Task ApprovedFacts_FullLifecycle_SucceedsAndEnforcesIsolation()
    {
        var clientA = await GetAuthenticatedClientAsync($"factsA-{Guid.NewGuid()}@test.com");
        var clientB = await GetAuthenticatedClientAsync($"factsB-{Guid.NewGuid()}@test.com");

        // 1. Initial GET should be null or empty fields
        var getInitialA = await clientA.GetAsync("/api/v1/onboarding/approved-facts");
        Assert.Equal(HttpStatusCode.OK, getInitialA.StatusCode);
        var initialDataA = await getInitialA.Content.ReadFromJsonAsync<ApprovedFactsDto>();
        Assert.Null(initialDataA!.YearsInBusiness);
        Assert.Empty(initialDataA.Certifications ?? new());

        // 2. Client A saves data
        var requestA = new ApprovedFactsDto
        {
            YearsInBusiness = 5,
            Certifications = new List<string> { "ISO 9001", "  " }, // Testing empty string filter
            Awards = new List<string> { "Best Startup 2024" }
        };
        var updateA = await clientA.PutAsJsonAsync("/api/v1/onboarding/approved-facts", requestA);
        Assert.Equal(HttpStatusCode.OK, updateA.StatusCode);

        // 3. Client A fetches data
        var getSecondA = await clientA.GetAsync("/api/v1/onboarding/approved-facts");
        var dataA = await getSecondA.Content.ReadFromJsonAsync<ApprovedFactsDto>();
        Assert.Equal(5, dataA!.YearsInBusiness);
        Assert.Single(dataA.Certifications!);
        Assert.Equal("ISO 9001", dataA.Certifications![0]); // Validated trimming
        Assert.Single(dataA.Awards!);

        // 4. Verify Client B's data is still empty (Isolation)
        var getSecondB = await clientB.GetAsync("/api/v1/onboarding/approved-facts");
        var dataB = await getSecondB.Content.ReadFromJsonAsync<ApprovedFactsDto>();
        Assert.Null(dataB!.YearsInBusiness);
        Assert.Empty(dataB.Certifications ?? new());

        // 5. Update B with different data
        var requestB = new ApprovedFactsDto
        {
            YearsInBusiness = 10,
            Accreditations = new List<string> { "BBB A+" }
        };
        await clientB.PutAsJsonAsync("/api/v1/onboarding/approved-facts", requestB);

        // 6. Final verification
        var finalA = await clientA.GetFromJsonAsync<ApprovedFactsDto>("/api/v1/onboarding/approved-facts");
        var finalB = await clientB.GetFromJsonAsync<ApprovedFactsDto>("/api/v1/onboarding/approved-facts");

        Assert.Equal(5, finalA!.YearsInBusiness);
        Assert.Equal(10, finalB!.YearsInBusiness);
        Assert.Single(finalB.Accreditations!);
        Assert.Null(finalA.Accreditations);
    }

    [Fact]
    public async Task ApprovedFacts_Validation_RejectsInvalidInput()
    {
        var client = await GetAuthenticatedClientAsync($"facts-val-{Guid.NewGuid()}@test.com");

        var badRequest = new ApprovedFactsDto
        {
            YearsInBusiness = -5 // Negative not allowed by [Range(0, 500)]
        };

        var resp = await client.PutAsJsonAsync("/api/v1/onboarding/approved-facts", badRequest);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }
}
