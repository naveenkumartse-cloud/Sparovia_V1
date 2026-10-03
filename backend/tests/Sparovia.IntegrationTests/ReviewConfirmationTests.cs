using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Application.Onboarding;
using Sparovia.Infrastructure.Data;

namespace Sparovia.IntegrationTests;

public class ReviewConfirmationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ReviewConfirmationTests(WebApplicationFactory<Program> factory)
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

        return client;
    }

    [Fact]
    public async Task ConfirmBusinessContext_FullLifecycle_SucceedsAndInvalidates()
    {
        var clientA = await GetAuthenticatedClientAsync($"reviewA-{Guid.NewGuid()}@test.com");
        var clientB = await GetAuthenticatedClientAsync($"reviewB-{Guid.NewGuid()}@test.com");

        // 1. Initial State (No Business Basics) -> Confirmation should fail
        var failConfirm = await clientA.PostAsync("/api/v1/onboarding/confirm", null);
        Assert.Equal(HttpStatusCode.BadRequest, failConfirm.StatusCode);

        // 2. Setup minimum viable Business Context
        var basics = new BusinessBasicsDto
        {
            BusinessName = "Company A",
            BusinessType = "Technology",
            PrimaryCategory = "Software",
            BusinessEmail = "a@test.com"
        };
        var respBasics = await clientA.PutAsJsonAsync("/api/v1/onboarding/business-basics", basics);
        if (!respBasics.IsSuccessStatusCode)
        {
            var content = await respBasics.Content.ReadAsStringAsync();
            throw new Exception($"Failed to put basics: {content}");
        }

        // Add a service
        var svc = new ServiceDto { ServiceName = "Dev", ServiceDescription = "Code" };
        var respSvc = await clientA.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        respSvc.EnsureSuccessStatusCode();

        // 3. Verify Summary GET
        var getSummary = await clientA.GetAsync("/api/v1/onboarding/summary");
        Assert.Equal(HttpStatusCode.OK, getSummary.StatusCode);
        var summary = await getSummary.Content.ReadFromJsonAsync<BusinessContextSummaryDto>();
        Assert.NotNull(summary);
        Assert.False(summary!.IsConfirmed);
        Assert.Equal("Company A", summary.BusinessName);
        Assert.Single(summary.Services!);

        // 4. Confirm it
        var confirmResp = await clientA.PostAsync("/api/v1/onboarding/confirm", null);
        Assert.Equal(HttpStatusCode.OK, confirmResp.StatusCode);

        // Verify summary is now confirmed
        var confirmedSummary = await clientA.GetFromJsonAsync<BusinessContextSummaryDto>("/api/v1/onboarding/summary");
        Assert.True(confirmedSummary!.IsConfirmed);

        // 5. Verify Isolation (Client B shouldn't affect A)
        var basicsB = new BusinessBasicsDto { BusinessName = "Company B", BusinessType = "Technology", PrimaryCategory = "Software", BusinessEmail = "b@test.com" };
        var respBasicsB = await clientB.PutAsJsonAsync("/api/v1/onboarding/business-basics", basicsB);
        respBasicsB.EnsureSuccessStatusCode();

        var confirmB = await clientB.PostAsync("/api/v1/onboarding/confirm", null);
        Assert.Equal(HttpStatusCode.OK, confirmB.StatusCode);
        
        var summaryB = await clientB.GetFromJsonAsync<BusinessContextSummaryDto>("/api/v1/onboarding/summary");
        Assert.True(summaryB!.IsConfirmed);

        // 6. Test Invalidation - Client A changes something
        basics.BusinessName = "Company A Updated";
        await clientA.PutAsJsonAsync("/api/v1/onboarding/business-basics", basics);

        // Client A's context should now be unconfirmed
        var updatedSummaryA = await clientA.GetFromJsonAsync<BusinessContextSummaryDto>("/api/v1/onboarding/summary");
        Assert.False(updatedSummaryA!.IsConfirmed);
        Assert.Equal("Company A Updated", updatedSummaryA.BusinessName);

        // Client B's context should STILL be confirmed
        var unchangedSummaryB = await clientB.GetFromJsonAsync<BusinessContextSummaryDto>("/api/v1/onboarding/summary");
        Assert.True(unchangedSummaryB!.IsConfirmed);
    }
}
