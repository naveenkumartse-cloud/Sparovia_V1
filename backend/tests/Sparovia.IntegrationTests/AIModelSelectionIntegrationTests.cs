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

public class AIModelSelectionIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AIModelSelectionIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient();

        var regReq = new RegisterRequest
        {
            FullName = "AI Connection Tester",
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

        var svc = new ServiceDto { ServiceName = "Interior Architecture", ServiceDescription = "Full-space custom architectural interiors." };
        var respServices = await client.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        respServices.EnsureSuccessStatusCode();

        var desc = new BusinessDescriptionDto
        {
            BusinessDescription = "Premium bespoke residential and commercial spaces.",
            Differentiators = "End-to-end design fidelity."
        };
        var respDesc = await client.PutAsJsonAsync("/api/v1/onboarding/business-description", desc);
        respDesc.EnsureSuccessStatusCode();

        var facts = new ApprovedFactsDto
        {
            YearsInBusiness = 12,
            Certifications = new List<string> { "LEED AP" }
        };
        var respFacts = await client.PutAsJsonAsync("/api/v1/onboarding/approved-facts", facts);
        respFacts.EnsureSuccessStatusCode();

        var respConfirm = await client.PostAsync("/api/v1/onboarding/confirm", null);
        respConfirm.EnsureSuccessStatusCode();
    }

    private static async Task<T> ReadDataAsync<T>(HttpResponseMessage response)
    {
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var dataJson = json.GetProperty("data").GetRawText();
        return JsonSerializer.Deserialize<T>(dataJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
    }

    [Fact]
    public async Task GetProviders_Unauthenticated_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/ai/providers");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetProviders_Authenticated_ReturnsApprovedProvidersList()
    {
        var email = $"ai-prov-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);

        var response = await client.GetAsync("/api/v1/ai/providers");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var providers = await ReadDataAsync<List<AIProviderDto>>(response);
        Assert.NotNull(providers);
        Assert.Contains(providers, p => p.Key == AIProviders.OpenAI && p.DisplayName == "OpenAI");
        Assert.Contains(providers, p => p.Key == AIProviders.Gemini && p.DisplayName == "Google Gemini");
        Assert.Contains(providers, p => p.Key == AIProviders.Claude && p.DisplayName == "Anthropic Claude");
    }

    [Fact]
    public async Task GetModels_FilterByProvider_ReturnsOnlyProviderModels()
    {
        var email = $"ai-filt-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);

        var response = await client.GetAsync("/api/v1/ai/models?providerKey=openai");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await ReadDataAsync<AIModelsResponseDto>(response);
        Assert.NotNull(result);
        Assert.All(result.Models, m => Assert.Equal("openai", m.ProviderKey));
        Assert.Contains(result.Models, m => m.Key == "gpt-4o-mini");
        Assert.Contains(result.Models, m => m.Key == "gpt-4o");
    }

    [Fact]
    public async Task TestConnection_WithValidCredential_Succeeds()
    {
        var email = $"ai-test-ok-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);

        var testReq = new TestAIConnectionRequest
        {
            ProviderKey = AIProviders.OpenAI,
            ApiKey = "sk-test-valid-credential-12345"
        };

        var response = await client.PostAsJsonAsync("/api/v1/ai/connection/test", testReq);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await ReadDataAsync<TestAIConnectionResponse>(response);
        Assert.True(result.Success);
        Assert.Equal(AIProviders.OpenAI, result.ProviderKey);
    }

    [Fact]
    public async Task TestConnection_WithInvalidCredential_FailsSafely()
    {
        var email = $"ai-test-fail-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);

        var testReq = new TestAIConnectionRequest
        {
            ProviderKey = AIProviders.OpenAI,
            ApiKey = "__SIMULATE_INVALID_KEY__"
        };

        var response = await client.PostAsJsonAsync("/api/v1/ai/connection/test", testReq);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(AIErrorCodes.ConnectionTestFailed, json.GetProperty("error").GetProperty("code").GetString());
    }

    [Fact]
    public async Task ConnectProvider_ValidCredentials_PersistsEncryptedKey_AndNeverReturnsPlaintext()
    {
        var email = $"ai-conn-save-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);

        var plainApiKey = "sk-test-live-key-99887766";
        var connReq = new ConnectAIProviderRequest
        {
            ProviderKey = AIProviders.OpenAI,
            ApiKey = plainApiKey,
            SelectedModelKey = "gpt-4o"
        };

        var response = await client.PostAsJsonAsync("/api/v1/ai/connection", connReq);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var connection = await ReadDataAsync<AIConnectionDto>(response);
        Assert.NotNull(connection);
        Assert.Equal(AIConnectionStatus.Connected, connection.Status);
        Assert.Equal(AIProviders.OpenAI, connection.ProviderKey);
        Assert.Equal("gpt-4o", connection.SelectedModelKey);
        Assert.Equal(AIModelCapability.Both, connection.SupportedCapability);
        Assert.NotNull(connection.MaskedApiKey);
        Assert.DoesNotContain(plainApiKey, connection.MaskedApiKey);

        // Raw response content inspection: plain key is NOT in response body
        var rawContent = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain(plainApiKey, rawContent);

        // Verify database: key is encrypted, not plaintext
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        var user = await db.Users.SingleAsync(u => u.Email == email);
        var membership = await db.Memberships.FirstAsync(m => m.UserId == user.Id);
        var config = await db.TenantAIConfigurations.FirstOrDefaultAsync(c => c.TenantId == membership.TenantId);
        Assert.NotNull(config);
        Assert.Equal(AIConnectionStatus.Connected, config.Status);
        Assert.NotEqual(plainApiKey, config.EncryptedApiKey);
        Assert.NotNull(config.EncryptedApiKey);

        // GET /connection returns safe state
        var getResp = await client.GetAsync("/api/v1/ai/connection");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var getConn = await ReadDataAsync<AIConnectionDto>(getResp);
        Assert.Equal(AIConnectionStatus.Connected, getConn.Status);
        Assert.Equal("gpt-4o", getConn.SelectedModelKey);
    }

    [Fact]
    public async Task UpdateConnection_UpdatesModel_AndDisconnectClearsCredentials()
    {
        var email = $"ai-conn-upd-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);

        // 1. Initial connection
        var connReq = new ConnectAIProviderRequest
        {
            ProviderKey = AIProviders.OpenAI,
            ApiKey = "sk-test-key-11112222",
            SelectedModelKey = "gpt-4o-mini"
        };
        var connResp = await client.PostAsJsonAsync("/api/v1/ai/connection", connReq);
        connResp.EnsureSuccessStatusCode();

        // 2. Update model to gpt-4o
        var updReq = new UpdateAIConnectionRequest
        {
            SelectedModelKey = "gpt-4o"
        };
        var updResp = await client.PutAsJsonAsync("/api/v1/ai/connection", updReq);
        Assert.Equal(HttpStatusCode.OK, updResp.StatusCode);

        var updConn = await ReadDataAsync<AIConnectionDto>(updResp);
        Assert.Equal("gpt-4o", updConn.SelectedModelKey);
        Assert.Equal(AIModelCapability.Both, updConn.SupportedCapability);

        // 3. Disconnect
        var delResp = await client.DeleteAsync("/api/v1/ai/connection");
        Assert.Equal(HttpStatusCode.OK, delResp.StatusCode);

        // 4. Verify status is NotConnected
        var getResp = await client.GetAsync("/api/v1/ai/connection");
        var getConn = await ReadDataAsync<AIConnectionDto>(getResp);
        Assert.Equal(AIConnectionStatus.NotConnected, getConn.Status);
    }

    [Fact]
    public async Task AIConnection_StrictTenantIsolation()
    {
        var emailA = $"ai-iso-conn-a-{Guid.NewGuid():N}@sparovia-test.com";
        var clientA = await GetAuthenticatedClientAsync(emailA);

        var emailB = $"ai-iso-conn-b-{Guid.NewGuid():N}@sparovia-test.com";
        var clientB = await GetAuthenticatedClientAsync(emailB);

        // Tenant A connects OpenAI with gpt-4o
        var connReqA = new ConnectAIProviderRequest
        {
            ProviderKey = AIProviders.OpenAI,
            ApiKey = "sk-test-tenant-a-key-9999",
            SelectedModelKey = "gpt-4o"
        };
        var respA = await clientA.PostAsJsonAsync("/api/v1/ai/connection", connReqA);
        respA.EnsureSuccessStatusCode();

        // Tenant B checks connection: should be NotConnected
        var respB = await clientB.GetAsync("/api/v1/ai/connection");
        respB.EnsureSuccessStatusCode();
        var connB = await ReadDataAsync<AIConnectionDto>(respB);
        Assert.Equal(AIConnectionStatus.NotConnected, connB.Status);
        Assert.Null(connB.ProviderKey);
        Assert.Null(connB.SelectedModelKey);
    }

    [Fact]
    public async Task ImproveContent_UsesTenantConfiguredProviderAndModel()
    {
        var email = $"ai-flow-conn-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Connected Provider Studio", email);

        // Connect OpenAI with gpt-4o
        var connReq = new ConnectAIProviderRequest
        {
            ProviderKey = AIProviders.OpenAI,
            ApiKey = "sk-test-live-flow-key",
            SelectedModelKey = "gpt-4o"
        };
        var connResp = await client.PostAsJsonAsync("/api/v1/ai/connection", connReq);
        connResp.EnsureSuccessStatusCode();

        // Execute AI Improve Content
        var req = new AIImproveContentRequest
        {
            SectionKey = "BusinessHero",
            Field = "headline",
            Operation = AIOperationTypes.MakeMoreProfessional,
            CurrentText = "Modern interiors handcrafted for you."
        };

        var response = await client.PostAsJsonAsync("/api/v1/ai/content/improve", req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var aiRequestId = json.GetProperty("data").GetProperty("aiRequestId").GetGuid();

        // Verify AIRequest in DB recorded the provider and model
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        var record = await db.AIRequests.FirstOrDefaultAsync(r => r.Id == aiRequestId);
        Assert.NotNull(record);
        Assert.Equal("openai", record.ProviderReference);
        Assert.Equal("gpt-4o", record.ModelReference);
    }

    [Fact]
    public async Task UpdateModel_WithUnknownModel_RejectsAndPreservesPreviousModel()
    {
        var email = $"ai-attack-unknown-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);

        // 1. Initial valid connection
        var connReq = new ConnectAIProviderRequest
        {
            ProviderKey = AIProviders.OpenAI,
            ApiKey = "sk-test-live-key-preserve-1",
            SelectedModelKey = "gpt-4o"
        };
        var connResp = await client.PostAsJsonAsync("/api/v1/ai/connection", connReq);
        connResp.EnsureSuccessStatusCode();

        // 2. Direct API attack: try to select unknown / unapproved model
        var attackReq = new UpdateAIConnectionRequest
        {
            SelectedModelKey = "rogue-unapproved-ai-999"
        };
        var attackResp = await client.PutAsJsonAsync("/api/v1/ai/connection", attackReq);
        Assert.Equal(HttpStatusCode.BadRequest, attackResp.StatusCode);

        var json = await attackResp.Content.ReadFromJsonAsync<JsonElement>();
        var errCode = json.GetProperty("error").GetProperty("code").GetString();
        Assert.Equal(AIErrorCodes.ModelNotFound, errCode);

        // 3. Verify previous valid model is strictly preserved
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        var user = await db.Users.SingleAsync(u => u.Email == email);
        var membership = await db.Memberships.FirstAsync(m => m.UserId == user.Id);
        var config = await db.TenantAIConfigurations.FirstOrDefaultAsync(c => c.TenantId == membership.TenantId);
        Assert.NotNull(config);
        Assert.Equal("gpt-4o", config.SelectedModelKey);
        Assert.Equal(AIProviders.OpenAI, config.ProviderKey);
    }

    [Fact]
    public async Task UpdateModel_WithCrossProviderModel_RejectsAndPreservesPreviousModel()
    {
        var email = $"ai-cross-prov-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);

        // 1. Connect Google Gemini
        var connReq = new ConnectAIProviderRequest
        {
            ProviderKey = AIProviders.Gemini,
            ApiKey = "AIzaSyTestKeyGemini12345",
            SelectedModelKey = "gemini-1.5-flash"
        };
        var connResp = await client.PostAsJsonAsync("/api/v1/ai/connection", connReq);
        connResp.EnsureSuccessStatusCode();

        // 2. Direct API attack: try to select Anthropic Claude model on Gemini connection
        var crossReq = new UpdateAIConnectionRequest
        {
            SelectedModelKey = "claude-3-5-sonnet"
        };
        var crossResp = await client.PutAsJsonAsync("/api/v1/ai/connection", crossReq);
        Assert.Equal(HttpStatusCode.BadRequest, crossResp.StatusCode);

        var json = await crossResp.Content.ReadFromJsonAsync<JsonElement>();
        var errCode = json.GetProperty("error").GetProperty("code").GetString();
        Assert.Equal(AIErrorCodes.ProviderModelMismatch, errCode);

        // 3. Verify Gemini model is strictly preserved
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        var user = await db.Users.SingleAsync(u => u.Email == email);
        var membership = await db.Memberships.FirstAsync(m => m.UserId == user.Id);
        var config = await db.TenantAIConfigurations.FirstOrDefaultAsync(c => c.TenantId == membership.TenantId);
        Assert.NotNull(config);
        Assert.Equal("gemini-1.5-flash", config.SelectedModelKey);
        Assert.Equal(AIProviders.Gemini, config.ProviderKey);
    }

    [Fact]
    public async Task UpdateModel_WithoutConnectedProvider_Rejects()
    {
        var email = $"ai-no-conn-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);

        // Attempt to select a model without connecting any provider
        var updReq = new UpdateAIConnectionRequest
        {
            SelectedModelKey = "gpt-4o"
        };
        var response = await client.PutAsJsonAsync("/api/v1/ai/connection", updReq);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var errCode = json.GetProperty("error").GetProperty("code").GetString();
        Assert.Equal(AIErrorCodes.ProviderConnectionRequired, errCode);
    }

    [Fact]
    public async Task UpdateModelSelection_LegacyEndpoint_ValidatesAllowlistAndPreservesOnFailure()
    {
        var email = $"ai-legacy-sel-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);

        // 1. Initial valid connection
        var connReq = new ConnectAIProviderRequest
        {
            ProviderKey = AIProviders.OpenAI,
            ApiKey = "sk-test-live-key-legacy",
            SelectedModelKey = "gpt-4o-mini"
        };
        var connResp = await client.PostAsJsonAsync("/api/v1/ai/connection", connReq);
        connResp.EnsureSuccessStatusCode();

        // 2. Cross-provider rejection via legacy endpoint
        var crossReq = new UpdateModelSelectionRequest { ModelKey = "gemini-1.5-pro" };
        var crossResp = await client.PutAsJsonAsync("/api/v1/ai/models/selection", crossReq);
        Assert.Equal(HttpStatusCode.BadRequest, crossResp.StatusCode);

        var json = await crossResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(AIErrorCodes.ProviderModelMismatch, json.GetProperty("error").GetProperty("code").GetString());

        // 3. Valid update via legacy endpoint
        var validReq = new UpdateModelSelectionRequest { ModelKey = "gpt-4o" };
        var validResp = await client.PutAsJsonAsync("/api/v1/ai/models/selection", validReq);
        Assert.Equal(HttpStatusCode.OK, validResp.StatusCode);

        var selDto = await ReadDataAsync<AIModelSelectionDto>(validResp);
        Assert.Equal("gpt-4o", selDto.SelectedModelKey);
        Assert.True(selDto.Model.IsSelected);
    }

    [Fact]
    public async Task GetConnection_WhenGeminiConnected_ReturnsContentAIAvailableAndBothCapabilities()
    {
        var email = $"ai-gemini-conn-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);

        // 1. Connect Google Gemini with Gemini 1.5 Pro
        var connReq = new ConnectAIProviderRequest
        {
            ProviderKey = AIProviders.Google,
            ApiKey = "AIzaSyTestKey1234567890",
            SelectedModelKey = "gemini-1.5-pro"
        };
        var connResp = await client.PostAsJsonAsync("/api/v1/ai/connection", connReq);
        connResp.EnsureSuccessStatusCode();

        // 2. Query GET /api/v1/ai/connection
        var getResp = await client.GetAsync("/api/v1/ai/connection");
        getResp.EnsureSuccessStatusCode();

        var connDto = await ReadDataAsync<AIConnectionDto>(getResp);
        Assert.Equal(AIConnectionStatus.Connected, connDto.Status);
        Assert.Equal(AIProviders.Google, connDto.ProviderKey);
        Assert.Equal("Google Gemini", connDto.ProviderDisplayName);
        Assert.Equal("gemini-1.5-pro", connDto.SelectedModelKey);
        Assert.Equal("Gemini 1.5 Pro (Multimodal)", connDto.SelectedModelDisplayName);
        Assert.True(connDto.IsContentAIAvailable);
        Assert.True(connDto.IsImageEnhancementAvailable);
    }

    [Fact]
    public async Task GetConnection_WhenNotConnected_ReturnsNotConnectedWithUnavailableCapabilities()
    {
        var email = $"ai-unconn-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);

        var getResp = await client.GetAsync("/api/v1/ai/connection");
        getResp.EnsureSuccessStatusCode();

        var connDto = await ReadDataAsync<AIConnectionDto>(getResp);
        Assert.Equal(AIConnectionStatus.NotConnected, connDto.Status);
        Assert.False(connDto.IsContentAIAvailable);
        Assert.False(connDto.IsImageEnhancementAvailable);
    }

    [Fact]
    public async Task ContentAssistance_WhenGeminiConnected_ExecutesWithPersistedConfigurationAndAllowsReviewAccept()
    {
        var email = $"ai-gemini-improve-{Guid.NewGuid():N}@sparovia-test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Gemini Design Studio", email);

        // 1. Connect Google Gemini
        var connReq = new ConnectAIProviderRequest
        {
            ProviderKey = AIProviders.Google,
            ApiKey = "AIzaSyTestKeyForContent123",
            SelectedModelKey = "gemini-1.5-pro"
        };
        var connResp = await client.PostAsJsonAsync("/api/v1/ai/connection", connReq);
        connResp.EnsureSuccessStatusCode();

        // 2. Initialize baseline draft in website content
        var baselineDraft = new
        {
            Fields = new Dictionary<string, string>
            {
                { "headline", "Modern bespoke living rooms crafted with precision." }
            }
        };
        var draftResp = await client.PutAsJsonAsync("/api/v1/website/content/hero/draft", baselineDraft);
        draftResp.EnsureSuccessStatusCode();

        // 3. Request Content AI improvement
        var improveReq = new AIImproveContentRequest
        {
            SectionKey = "hero",
            Field = "headline",
            Operation = AIOperationTypes.ImproveWording,
            CurrentText = "Modern bespoke living rooms crafted with precision."
        };
        var improveResp = await client.PostAsJsonAsync("/api/v1/ai/content/improve", improveReq);
        Assert.Equal(HttpStatusCode.OK, improveResp.StatusCode);

        var improveDto = await ReadDataAsync<AIContentResponseDto>(improveResp);
        Assert.Equal(AIRequestStatus.Succeeded, improveDto.Status);
        Assert.Equal(AIReviewStatus.PendingReview, improveDto.ReviewStatus);
        Assert.False(string.IsNullOrWhiteSpace(improveDto.Suggestion));

        // 4. Accept suggestion into draft
        var acceptResp = await client.PostAsJsonAsync($"/api/v1/ai/requests/{improveDto.AiRequestId}/accept", new AIReviewRequestDto());
        Assert.Equal(HttpStatusCode.OK, acceptResp.StatusCode);

        var acceptDto = await ReadDataAsync<AIReviewResultDto>(acceptResp);
        Assert.True(acceptDto.Success);
        Assert.Equal(AIReviewStatus.Accepted, acceptDto.ReviewStatus);

        // 5. Verify draft received suggestion and publishing boundary is intact
        var sectionResp = await client.GetAsync("/api/v1/website/content/hero");
        sectionResp.EnsureSuccessStatusCode();
        var sectionJson = await sectionResp.Content.ReadFromJsonAsync<JsonElement>();
        var draftHeadline = sectionJson.GetProperty("draftFields").GetProperty("headline").GetString();
        Assert.Equal(improveDto.Suggestion, draftHeadline);
    }
}
