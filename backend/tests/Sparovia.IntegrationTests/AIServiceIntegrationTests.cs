using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.AI;
using Sparovia.Application.Identity;
using Sparovia.Application.Onboarding;
using Sparovia.Domain.Constants;
using Sparovia.Infrastructure.Data;

namespace Sparovia.IntegrationTests;

public class AIServiceIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AIServiceIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient();

        var regReq = new RegisterRequest
        {
            FullName = "AI Foundation Tester",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };
        await client.PostAsJsonAsync("/api/v1/auth/register", regReq);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            db.Database.Migrate();
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
            PrimaryCategory = "Interiors",
            BusinessEmail = email,
            BusinessPhone = "+1 555-0199",
            Website = "https://example.com"
        };
        var respBasics = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", basics);
        respBasics.EnsureSuccessStatusCode();

        var location = new LocationAndCustomersDto
        {
            AddressLine1 = "100 Design Studio Way",
            City = "Metropolis",
            State = "CA",
            PostalCode = "94016",
            Country = "United States",
            ServiceAreas = new List<string> { "Downtown", "Metro Area" }
        };
        var respLoc = await client.PutAsJsonAsync("/api/v1/onboarding/location-customers", location);
        respLoc.EnsureSuccessStatusCode();

        var svc = new ServiceDto { ServiceName = "Custom Cabinetry", ServiceDescription = "Handcrafted custom woodwork" };
        var respSvc = await client.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        respSvc.EnsureSuccessStatusCode();

        var confirmResp = await client.PostAsync("/api/v1/onboarding/confirm", null);
        confirmResp.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task ImproveContent_Unauthenticated_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var req = new AIImproveContentRequest
        {
            SectionKey = "BusinessHero",
            Field = "headline",
            Operation = AIOperationTypes.MakeMoreProfessional,
            CurrentText = "We do good interiors."
        };

        var response = await client.PostAsJsonAsync("/api/v1/ai/content/improve", req);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ImproveContent_UnconfirmedContext_ReturnsForbidden()
    {
        var email = $"ai-unconfirmed-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);

        var req = new AIImproveContentRequest
        {
            SectionKey = "BusinessHero",
            Field = "headline",
            Operation = AIOperationTypes.MakeMoreProfessional,
            CurrentText = "We do good interiors."
        };

        var response = await client.PostAsJsonAsync("/api/v1/ai/content/improve", req);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ONBOARDING_REQUIRED", json.GetProperty("code").GetString());
    }

    [Fact]
    public async Task ImproveContent_ValidRequest_ReturnsSucceededSuggestion_AndPersistsAIRequest()
    {
        var email = $"ai-valid-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Apex Interior Studio", email);

        var req = new AIImproveContentRequest
        {
            SectionKey = "BusinessHero",
            Field = "headline",
            Operation = AIOperationTypes.MakeMoreProfessional,
            CurrentText = "Modern homes made simple."
        };

        var response = await client.PostAsJsonAsync("/api/v1/ai/content/improve", req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var data = json.GetProperty("data");
        var aiRequestIdStr = data.GetProperty("aiRequestId").GetString();
        var suggestion = data.GetProperty("suggestion").GetString();
        var status = data.GetProperty("status").GetString();

        Assert.NotNull(aiRequestIdStr);
        Assert.True(Guid.TryParse(aiRequestIdStr, out var aiRequestId));
        Assert.Equal(AIRequestStatus.Succeeded, status);
        Assert.Contains("Elevating spaces with bespoke craftsmanship", suggestion);

        // Verify request was recorded in database with proper tenant ownership
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        var record = await db.AIRequests.FirstOrDefaultAsync(r => r.Id == aiRequestId);
        Assert.NotNull(record);
        Assert.Equal(AIRequestStatus.Succeeded, record.Status);
        Assert.Equal(AIOperationTypes.MakeMoreProfessional, record.OperationType);
        Assert.NotNull(record.CompletedAt);
    }

    [Fact]
    public async Task ImproveContent_ValidationErrors_ReturnBadRequest()
    {
        var email = $"ai-val-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Validation Test Studio", email);

        // 1. Unsupported Operation
        var badOpReq = new AIImproveContentRequest
        {
            SectionKey = "BusinessHero",
            Field = "headline",
            Operation = "UnknownUnsupportedOp",
            CurrentText = "Text"
        };
        var respBadOp = await client.PostAsJsonAsync("/api/v1/ai/content/improve", badOpReq);
        Assert.Equal(HttpStatusCode.BadRequest, respBadOp.StatusCode);

        // 2. Oversized CurrentText
        var oversizedReq = new AIImproveContentRequest
        {
            SectionKey = "BusinessHero",
            Field = "headline",
            Operation = AIOperationTypes.MakeMoreProfessional,
            CurrentText = new string('X', AIRequestValidator.MaxInputTextLength + 10)
        };
        var respOversized = await client.PostAsJsonAsync("/api/v1/ai/content/improve", oversizedReq);
        Assert.Equal(HttpStatusCode.BadRequest, respOversized.StatusCode);
    }

    [Fact]
    public async Task GetRequestStatus_StrictTenantIsolation()
    {
        var emailA = $"ai-tenant-a-{Guid.NewGuid():N}@sparovia-test.com";
        var clientA = await GetAuthenticatedClientAsync(emailA);
        await SetupAndConfirmBusinessContextAsync(clientA, "Tenant A Studio", emailA);

        var emailB = $"ai-tenant-b-{Guid.NewGuid():N}@sparovia-test.com";
        var clientB = await GetAuthenticatedClientAsync(emailB);
        await SetupAndConfirmBusinessContextAsync(clientB, "Tenant B Studio", emailB);

        // Tenant A creates an AI request
        var req = new AIImproveContentRequest
        {
            SectionKey = "BusinessHero",
            Field = "headline",
            Operation = AIOperationTypes.MakeShorter,
            CurrentText = "This is a descriptive headline that we want to make significantly shorter for our landing page."
        };
        var responseA = await clientA.PostAsJsonAsync("/api/v1/ai/content/improve", req);
        responseA.EnsureSuccessStatusCode();

        var jsonA = await responseA.Content.ReadFromJsonAsync<JsonElement>();
        var aiRequestId = jsonA.GetProperty("data").GetProperty("aiRequestId").GetGuid();

        // Tenant A can check its own AI request status
        var statusRespA = await clientA.GetAsync($"/api/v1/ai/requests/{aiRequestId}");
        Assert.Equal(HttpStatusCode.OK, statusRespA.StatusCode);

        // Tenant B cannot access Tenant A's AI request -> returns 404 NotFound
        var statusRespB = await clientB.GetAsync($"/api/v1/ai/requests/{aiRequestId}");
        Assert.Equal(HttpStatusCode.NotFound, statusRespB.StatusCode);
    }

    [Fact]
    public async Task ImproveContent_SimulatedProviderFailure_ReturnsServiceUnavailable_AndPreservesState()
    {
        var email = $"ai-fail-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Failure Safe Studio", email);

        // Save a draft first to ensure failure doesn't corrupt it
        var draftReq = new
        {
            Fields = new Dictionary<string, string>
            {
                { "headline", "Original Intact Headline" },
                { "subheadline", "Original Intact Subheadline" }
            }
        };
        var draftResp = await client.PutAsJsonAsync("/api/v1/website/content/hero/draft", draftReq);
        draftResp.EnsureSuccessStatusCode();

        // Trigger simulated provider failure
        var req = new AIImproveContentRequest
        {
            SectionKey = "hero",
            Field = "headline",
            Operation = AIOperationTypes.MakeMoreProfessional,
            CurrentText = "Original Intact Headline __SIMULATE_PROVIDER_ERROR__"
        };

        var response = await client.PostAsJsonAsync("/api/v1/ai/content/improve", req);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);

        var errJson = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(AIErrorCodes.ProviderUnavailable, errJson.GetProperty("code").GetString());
        var failedRequestId = errJson.GetProperty("aiRequestId").GetGuid();

        // Verify failure was persisted in AIRequest with Failed status
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        var record = await db.AIRequests.FirstOrDefaultAsync(r => r.Id == failedRequestId);
        Assert.NotNull(record);
        Assert.Equal(AIRequestStatus.Failed, record.Status);
        Assert.Equal(AIErrorCodes.ProviderUnavailable, record.ErrorCode);

        // Verify website draft content is completely preserved and untouched
        var sectionResp = await client.GetAsync("/api/v1/website/content/hero");
        sectionResp.EnsureSuccessStatusCode();
        var sectionJson = await sectionResp.Content.ReadFromJsonAsync<JsonElement>();
        var headline = sectionJson.GetProperty("draftFields").GetProperty("headline").GetString();
        Assert.Equal("Original Intact Headline", headline);
    }

    [Theory]
    [InlineData(AIOperationTypes.ImproveWording)]
    [InlineData(AIOperationTypes.MakeMoreProfessional)]
    [InlineData(AIOperationTypes.MakeShorter)]
    [InlineData(AIOperationTypes.MakeClearer)]
    [InlineData(AIOperationTypes.ImproveServiceDescription)]
    public async Task ImproveContent_AllStandardOperations_Succeed(string operation)
    {
        var email = $"ai-op-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Operation Test Studio", email);

        var req = new AIImproveContentRequest
        {
            SectionKey = "BusinessHero",
            Field = "headline",
            Operation = operation,
            CurrentText = "Custom craftsmanship and quality interior architecture."
        };

        var response = await client.PostAsJsonAsync("/api/v1/ai/content/improve", req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var data = json.GetProperty("data");
        var suggestion = data.GetProperty("suggestion").GetString();
        Assert.False(string.IsNullOrWhiteSpace(suggestion));
    }

    [Fact]
    public async Task ImproveContent_CustomInstruction_AppliesInstruction()
    {
        var email = $"ai-custom-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Custom Instruction Studio", email);

        var req = new AIImproveContentRequest
        {
            SectionKey = "BusinessHero",
            Field = "subheadline",
            Operation = AIOperationTypes.CustomInstruction,
            CurrentText = "Handmade solid wood dining tables.",
            Instruction = "Focus on sustainable FSC-certified oak"
        };

        var response = await client.PostAsJsonAsync("/api/v1/ai/content/improve", req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var data = json.GetProperty("data");
        var suggestion = data.GetProperty("suggestion").GetString();
        Assert.Contains("Focus on sustainable FSC-certified oak", suggestion);
    }
}

