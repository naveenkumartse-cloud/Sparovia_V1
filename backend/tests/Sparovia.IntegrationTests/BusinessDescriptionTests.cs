using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Application.Onboarding;
using Sparovia.Infrastructure.Data;

namespace Sparovia.IntegrationTests;

public class BusinessDescriptionTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public BusinessDescriptionTests(WebApplicationFactory<Program> factory)
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
    public async Task BusinessDescription_FullLifecycle_SucceedsAndEnforcesIsolation()
    {
        var clientA = await GetAuthenticatedClientAsync($"descA-{Guid.NewGuid()}@test.com");
        var clientB = await GetAuthenticatedClientAsync($"descB-{Guid.NewGuid()}@test.com");

        // 1. Initial GET should be null or empty fields
        var getInitialA = await clientA.GetAsync("/api/v1/onboarding/business-description");
        Assert.Equal(HttpStatusCode.OK, getInitialA.StatusCode);
        var initialDataA = await getInitialA.Content.ReadFromJsonAsync<BusinessDescriptionDto>();
        Assert.Null(initialDataA!.BusinessDescription);
        Assert.Null(initialDataA.Differentiators);

        // 2. Client A saves data
        var requestA = new BusinessDescriptionDto
        {
            BusinessDescription = "We are an awesome company.",
            Differentiators = "We have 10 years of experience."
        };
        var updateA = await clientA.PutAsJsonAsync("/api/v1/onboarding/business-description", requestA);
        Assert.Equal(HttpStatusCode.OK, updateA.StatusCode);

        // 3. Client A fetches data
        var getSecondA = await clientA.GetAsync("/api/v1/onboarding/business-description");
        var dataA = await getSecondA.Content.ReadFromJsonAsync<BusinessDescriptionDto>();
        Assert.Equal("We are an awesome company.", dataA!.BusinessDescription);
        Assert.Equal("We have 10 years of experience.", dataA.Differentiators);

        // 4. Verify Client B's data is still empty (Isolation)
        var getSecondB = await clientB.GetAsync("/api/v1/onboarding/business-description");
        var dataB = await getSecondB.Content.ReadFromJsonAsync<BusinessDescriptionDto>();
        Assert.Null(dataB!.BusinessDescription);

        // 5. Update B with different data
        var requestB = new BusinessDescriptionDto
        {
            BusinessDescription = "We are B.",
            Differentiators = "We are fast."
        };
        await clientB.PutAsJsonAsync("/api/v1/onboarding/business-description", requestB);

        // 6. Final verification
        var finalA = await clientA.GetFromJsonAsync<BusinessDescriptionDto>("/api/v1/onboarding/business-description");
        var finalB = await clientB.GetFromJsonAsync<BusinessDescriptionDto>("/api/v1/onboarding/business-description");

        Assert.Equal("We are an awesome company.", finalA!.BusinessDescription);
        Assert.Equal("We are B.", finalB!.BusinessDescription);
    }

    [Fact]
    public async Task BusinessDescription_Validation_RejectsInvalidInput()
    {
        var client = await GetAuthenticatedClientAsync($"desc-val-{Guid.NewGuid()}@test.com");

        var badRequest = new BusinessDescriptionDto
        {
            BusinessDescription = new string('A', 4001) // Exceeds 4000 char limit
        };

        var resp = await client.PutAsJsonAsync("/api/v1/onboarding/business-description", badRequest);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }
}
