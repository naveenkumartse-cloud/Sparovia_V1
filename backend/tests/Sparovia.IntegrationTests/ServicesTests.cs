using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Application.Onboarding;
using Sparovia.Infrastructure.Data;

namespace Sparovia.IntegrationTests;

public class ServicesTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ServicesTests(WebApplicationFactory<Program> factory)
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

        // Also setup business context so they can add services
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
    public async Task Services_FullLifecycle_SucceedsAndEnforcesIsolation()
    {
        var clientA = await GetAuthenticatedClientAsync($"serviceA-{Guid.NewGuid()}@test.com");
        var clientB = await GetAuthenticatedClientAsync($"serviceB-{Guid.NewGuid()}@test.com");

        // 1. Initial GET should be empty
        var getInitialA = await clientA.GetAsync("/api/v1/onboarding/services");
        Assert.Equal(HttpStatusCode.OK, getInitialA.StatusCode);
        var servicesA = await getInitialA.Content.ReadFromJsonAsync<List<ServiceDto>>();
        Assert.Empty(servicesA!);

        // 2. Client A Adds a Service
        var addRequestA = new AddServiceRequest
        {
            ServiceName = "Electrical Wiring",
            ServiceDescription = "Full house wiring."
        };
        var addResponseA = await clientA.PostAsJsonAsync("/api/v1/onboarding/services", addRequestA);
        Assert.Equal(HttpStatusCode.OK, addResponseA.StatusCode);
        var addedServiceA = await addResponseA.Content.ReadFromJsonAsync<ServiceDto>();
        Assert.NotNull(addedServiceA);
        Assert.Equal("Electrical Wiring", addedServiceA.ServiceName);

        // 3. Client A Adds a second Service
        var addRequestA2 = new AddServiceRequest
        {
            ServiceName = "Plumbing",
            ServiceDescription = "Pipe installation."
        };
        await clientA.PostAsJsonAsync("/api/v1/onboarding/services", addRequestA2);

        // 4. Verify A sees exactly 2 services
        var getSecondA = await clientA.GetAsync("/api/v1/onboarding/services");
        var servicesA2 = await getSecondA.Content.ReadFromJsonAsync<List<ServiceDto>>();
        Assert.Equal(2, servicesA2!.Count);

        // 5. Verify B sees 0 services (Isolation)
        var getSecondB = await clientB.GetAsync("/api/v1/onboarding/services");
        var servicesB = await getSecondB.Content.ReadFromJsonAsync<List<ServiceDto>>();
        Assert.Empty(servicesB!);

        // 6. B attempts to update A's service -> Should fail (Isolation)
        var updateRequest = new UpdateServiceRequest
        {
            ServiceName = "Hacked Wiring",
            ServiceDescription = "Hacked!"
        };
        var updateResponseB = await clientB.PutAsJsonAsync($"/api/v1/onboarding/services/{addedServiceA.Id}", updateRequest);
        Assert.Equal(HttpStatusCode.BadRequest, updateResponseB.StatusCode); // Or 404 depending on how the endpoint returns it (current code returns 400 BadRequest with "Service not found or access denied")

        // 7. A updates their own service -> Should succeed
        var updateRequestA = new UpdateServiceRequest
        {
            ServiceName = "Premium Electrical Wiring",
            ServiceDescription = "Full house wiring, premium."
        };
        var updateResponseA = await clientA.PutAsJsonAsync($"/api/v1/onboarding/services/{addedServiceA.Id}", updateRequestA);
        Assert.Equal(HttpStatusCode.OK, updateResponseA.StatusCode);

        // 8. B attempts to delete A's service -> Should fail
        var deleteResponseB = await clientB.DeleteAsync($"/api/v1/onboarding/services/{addedServiceA.Id}");
        Assert.Equal(HttpStatusCode.BadRequest, deleteResponseB.StatusCode);

        // 9. A deletes their own service -> Should succeed
        var deleteResponseA = await clientA.DeleteAsync($"/api/v1/onboarding/services/{addedServiceA.Id}");
        Assert.Equal(HttpStatusCode.OK, deleteResponseA.StatusCode);

        // 10. Verify A now sees 1 service
        var getThirdA = await clientA.GetAsync("/api/v1/onboarding/services");
        var servicesA3 = await getThirdA.Content.ReadFromJsonAsync<List<ServiceDto>>();
        Assert.Single(servicesA3!);
    }

    [Fact]
    public async Task Services_Validation_RejectsInvalidInput()
    {
        var client = await GetAuthenticatedClientAsync($"service-val-{Guid.NewGuid()}@test.com");

        // Missing Service Name
        var badRequest1 = new AddServiceRequest
        {
            ServiceDescription = "Valid desc"
        };
        var resp1 = await client.PostAsJsonAsync("/api/v1/onboarding/services", badRequest1);
        Assert.Equal(HttpStatusCode.BadRequest, resp1.StatusCode);

        // Extremely long service name (>256)
        var badRequest2 = new AddServiceRequest
        {
            ServiceName = new string('A', 300)
        };
        var resp2 = await client.PostAsJsonAsync("/api/v1/onboarding/services", badRequest2);
        Assert.Equal(HttpStatusCode.BadRequest, resp2.StatusCode);
    }
}
