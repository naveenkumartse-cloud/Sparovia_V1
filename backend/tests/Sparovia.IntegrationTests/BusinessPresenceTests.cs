using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.BusinessPresence;
using Sparovia.Application.Identity;
using Sparovia.Application.Onboarding;
using Sparovia.Infrastructure.Data;

namespace Sparovia.IntegrationTests;

public class BusinessPresenceTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public BusinessPresenceTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient();

        var regReq = new RegisterRequest
        {
            FullName = "Presence Tester",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };
        await client.PostAsJsonAsync("/api/v1/auth/register", regReq);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            try
            {
                db.Database.Migrate();
            }
            catch (Exception ex)
            {
                throw new Exception($"Database.Migrate failed: {ex.Message}", ex);
            }
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

    private async Task SetupAndConfirmBusinessContextAsync(HttpClient client, string businessName, string email)
    {
        var basics = new BusinessBasicsDto
        {
            BusinessName = businessName,
            BusinessType = "Local Service Business",
            PrimaryCategory = "Consulting",
            BusinessEmail = email,
            BusinessPhone = "+1 555-0199",
            Website = "https://example.com"
        };
        var respBasics = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", basics);
        respBasics.EnsureSuccessStatusCode();

        var location = new LocationAndCustomersDto
        {
            AddressLine1 = "100 Innovation Way",
            City = "Tech City",
            State = "CA",
            PostalCode = "94016",
            Country = "United States",
            ServiceAreas = new List<string> { "Greater Tech Metro", "Silicon Valley" }
        };
        var respLoc = await client.PutAsJsonAsync("/api/v1/onboarding/location-customers", location);
        respLoc.EnsureSuccessStatusCode();

        var svc = new ServiceDto { ServiceName = "Advisory", ServiceDescription = "Strategic consulting" };
        var respSvc = await client.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        respSvc.EnsureSuccessStatusCode();

        var confirmResp = await client.PostAsync("/api/v1/onboarding/confirm", null);
        confirmResp.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task GetPresence_Unauthenticated_ReturnsUnauthorized()
    {
        var unauthenticatedClient = _factory.CreateClient();
        var response = await unauthenticatedClient.GetAsync("/api/v1/business-presence");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetPresence_UnconfirmedContext_ReturnsForbiddenWithOnboardingRequired()
    {
        var email = $"unconfirmed-presence-{Guid.NewGuid()}@test.com";
        var client = await GetAuthenticatedClientAsync(email);

        var response = await client.GetAsync("/api/v1/business-presence");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("ONBOARDING_REQUIRED", content);
    }

    [Fact]
    public async Task GetPresence_ConfirmedContext_ReturnsVerifiedNapAndDefaultPresence()
    {
        var email = $"presence-ok-{Guid.NewGuid()}@test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Apex Advisory", email);

        var response = await client.GetAsync("/api/v1/business-presence");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var presence = await response.Content.ReadFromJsonAsync<BusinessPresenceDto>();
        Assert.NotNull(presence);
        Assert.NotNull(presence.VerifiedNap);
        Assert.Equal("Apex Advisory", presence.VerifiedNap.BusinessName);
        Assert.Equal("Consulting", presence.VerifiedNap.PrimaryCategory);
        Assert.Equal("+1 555-0199", presence.VerifiedNap.BusinessPhone);
        Assert.Equal("100 Innovation Way", presence.VerifiedNap.AddressLine1);
        Assert.Equal("Tech City", presence.VerifiedNap.City);
        Assert.NotNull(presence.VerifiedNap.ServiceAreas);
        Assert.Contains("Greater Tech Metro", presence.VerifiedNap.ServiceAreas);
        Assert.True(presence.VerifiedNap.IsConfirmed);
    }

    [Fact]
    public async Task UpdatePresence_ValidData_PersistsOperatingHoursAndPublicNotice()
    {
        var email = $"presence-update-{Guid.NewGuid()}@test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Northstar Tech", email);

        var updateReq = new UpdateBusinessPresenceRequest
        {
            OperatingHours = "Monday - Friday: 9:00 AM - 5:00 PM\nSaturday: 10:00 AM - 2:00 PM\nSunday: Closed",
            PublicNotice = "Special summer hours are now in effect."
        };

        var putResp = await client.PutAsJsonAsync("/api/v1/business-presence", updateReq);
        Assert.Equal(HttpStatusCode.OK, putResp.StatusCode);

        var updatedPresence = await putResp.Content.ReadFromJsonAsync<BusinessPresenceDto>();
        Assert.NotNull(updatedPresence);
        Assert.Equal(updateReq.OperatingHours, updatedPresence.OperatingHours);
        Assert.Equal(updateReq.PublicNotice, updatedPresence.PublicNotice);

        // Fetch again to verify persistence
        var getResp = await client.GetAsync("/api/v1/business-presence");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var fetchedPresence = await getResp.Content.ReadFromJsonAsync<BusinessPresenceDto>();
        Assert.NotNull(fetchedPresence);
        Assert.Equal(updateReq.OperatingHours, fetchedPresence.OperatingHours);
        Assert.Equal(updateReq.PublicNotice, fetchedPresence.PublicNotice);
    }

    [Fact]
    public async Task MarkAsReviewed_UpdatesTimestamp()
    {
        var email = $"presence-review-{Guid.NewGuid()}@test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Veritas Legal", email);

        var reviewResp = await client.PostAsync("/api/v1/business-presence/mark-reviewed", null);
        Assert.Equal(HttpStatusCode.OK, reviewResp.StatusCode);

        var presence = await reviewResp.Content.ReadFromJsonAsync<BusinessPresenceDto>();
        Assert.NotNull(presence);
        Assert.NotNull(presence.LastReviewedAt);
        Assert.True(presence.LastReviewedAt > DateTime.UtcNow.AddMinutes(-5));
    }

    [Fact]
    public async Task TenantIsolation_TenantCannotAccessOrMutateOtherTenantsPresence()
    {
        var emailA = $"tenantA-presence-{Guid.NewGuid()}@test.com";
        var clientA = await GetAuthenticatedClientAsync(emailA);
        await SetupAndConfirmBusinessContextAsync(clientA, "Tenant A Business", emailA);

        var emailB = $"tenantB-presence-{Guid.NewGuid()}@test.com";
        var clientB = await GetAuthenticatedClientAsync(emailB);
        await SetupAndConfirmBusinessContextAsync(clientB, "Tenant B Business", emailB);

        // Update Tenant A
        var updateA = new UpdateBusinessPresenceRequest
        {
            OperatingHours = "Tenant A Hours",
            PublicNotice = "Tenant A Notice"
        };
        var putA = await clientA.PutAsJsonAsync("/api/v1/business-presence", updateA);
        putA.EnsureSuccessStatusCode();

        // Check Tenant B has not received Tenant A's updates
        var getB = await clientB.GetAsync("/api/v1/business-presence");
        getB.EnsureSuccessStatusCode();
        var presenceB = await getB.Content.ReadFromJsonAsync<BusinessPresenceDto>();

        Assert.NotNull(presenceB);
        Assert.NotNull(presenceB.VerifiedNap);
        Assert.Equal("Tenant B Business", presenceB.VerifiedNap.BusinessName);
        Assert.NotEqual("Tenant A Hours", presenceB.OperatingHours);
        Assert.NotEqual("Tenant A Notice", presenceB.PublicNotice);
    }

    [Fact]
    public async Task GetPresence_WithExtendedBusinessContext_ReturnsDescriptionDifferentiatorsAndClaims()
    {
        var email = $"extended-presence-{Guid.NewGuid()}@test.com";
        var client = await GetAuthenticatedClientAsync(email);

        var basics = new BusinessBasicsDto
        {
            BusinessName = "Craftsman Architecture",
            BusinessType = "Local Service Business",
            PrimaryCategory = "Architecture",
            BusinessEmail = email,
            BusinessPhone = "+1 555-4321",
            Website = "https://craftsman-arch.com"
        };
        var respBasics = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", basics);
        respBasics.EnsureSuccessStatusCode();

        var location = new LocationAndCustomersDto
        {
            AddressLine1 = "500 Main Street",
            City = "Metropolis",
            State = "NY",
            PostalCode = "10001",
            Country = "United States",
            ServiceAreas = new List<string> { "Greater Metropolis" },
            TargetCustomers = new List<string> { "Commercial Developers", "High-End Residential" }
        };
        var respLoc = await client.PutAsJsonAsync("/api/v1/onboarding/location-customers", location);
        respLoc.EnsureSuccessStatusCode();

        var desc = new BusinessDescriptionDto
        {
            BusinessDescription = "Premium sustainable architectural design firm.",
            Differentiators = "Over 20 years of AIA-awarded sustainable architecture."
        };
        var respDesc = await client.PutAsJsonAsync("/api/v1/onboarding/business-description", desc);
        respDesc.EnsureSuccessStatusCode();

        var facts = new ApprovedFactsDto
        {
            YearsInBusiness = 22,
            Certifications = new List<string> { "LEED AP", "NCARB" },
            Awards = new List<string> { "AIA Excellence 2023" },
            Accreditations = new List<string> { "AIA Member" },
            Warranties = new List<string> { "Lifetime Structural Guarantee" },
            AuthorizedStatuses = new List<string> { "State Licensed Architect" },
            OtherClaims = new List<string> { "100% In-House Design Team" }
        };
        var respFacts = await client.PutAsJsonAsync("/api/v1/onboarding/approved-facts", facts);
        respFacts.EnsureSuccessStatusCode();

        var svc = new ServiceDto { ServiceName = "Sustainable Design", ServiceDescription = "Net-zero building planning" };
        var respSvc = await client.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        respSvc.EnsureSuccessStatusCode();

        var confirmResp = await client.PostAsync("/api/v1/onboarding/confirm", null);
        confirmResp.EnsureSuccessStatusCode();

        var response = await client.GetAsync("/api/v1/business-presence");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var presence = await response.Content.ReadFromJsonAsync<BusinessPresenceDto>();
        Assert.NotNull(presence);
        Assert.NotNull(presence.VerifiedNap);
        Assert.Equal("Craftsman Architecture", presence.VerifiedNap.BusinessName);
        Assert.Equal("Premium sustainable architectural design firm.", presence.VerifiedNap.BusinessDescription);
        Assert.Equal("Over 20 years of AIA-awarded sustainable architecture.", presence.VerifiedNap.Differentiators);
        Assert.Equal(22, presence.VerifiedNap.YearsInBusiness);
        Assert.NotNull(presence.VerifiedNap.TargetCustomers);
        Assert.Contains("Commercial Developers", presence.VerifiedNap.TargetCustomers);
        Assert.NotNull(presence.VerifiedNap.Certifications);
        Assert.Contains("LEED AP", presence.VerifiedNap.Certifications);
        Assert.NotNull(presence.VerifiedNap.Awards);
        Assert.Contains("AIA Excellence 2023", presence.VerifiedNap.Awards);
        Assert.NotNull(presence.VerifiedNap.Warranties);
        Assert.Contains("Lifetime Structural Guarantee", presence.VerifiedNap.Warranties);
        Assert.Equal(1, presence.VerifiedNap.ServicesCount);
        Assert.Contains("Sustainable Design", presence.VerifiedNap.ServiceNames!);
    }
}
