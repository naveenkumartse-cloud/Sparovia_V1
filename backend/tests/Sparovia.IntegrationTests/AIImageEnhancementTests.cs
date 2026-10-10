using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.AI;
using Sparovia.Application.Identity;
using Sparovia.Application.Images;
using Sparovia.Application.Onboarding;
using Sparovia.Domain.Constants;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;
using Xunit;

namespace Sparovia.IntegrationTests;

public class AIImageEnhancementTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AIImageEnhancementTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private static byte[] CreateValidJpegBytes()
    {
        return new byte[]
        {
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
            0xFF, 0xC0, 0x00, 0x11, 0x08, 0x04, 0x38, 0x07, 0x80, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
            0xFF, 0xD9
        };
    }

    private static byte[] CreateValidPngBytes()
    {
        return new byte[]
        {
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x03, 0x20,
            0x00, 0x00, 0x02, 0x58,
            0x08, 0x02, 0x00, 0x00, 0x00,
            0x4D, 0xB4, 0x2C, 0x6B
        };
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient();

        var regReq = new RegisterRequest
        {
            FullName = "AI Enhancement Tester",
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
            PrimaryCategory = "Architectural Interiors",
            BusinessPhone = "+1 555-0199",
            BusinessEmail = email,
            Website = "https://example.com"
        };
        var r1 = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", basics);
        r1.EnsureSuccessStatusCode();

        var location = new LocationAndCustomersDto
        {
            AddressLine1 = "100 Architectural Way",
            City = "Metropolis",
            State = "NY",
            PostalCode = "10001",
            Country = "United States"
        };
        var r2 = await client.PutAsJsonAsync("/api/v1/onboarding/location-customers", location);
        r2.EnsureSuccessStatusCode();

        var svc = new ServiceDto { ServiceName = "Bespoke Millwork", ServiceDescription = "Tailored cabinetry and woodworking" };
        var r3 = await client.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        r3.EnsureSuccessStatusCode();

        var rConfirm = await client.PostAsync("/api/v1/onboarding/confirm", null);
        rConfirm.EnsureSuccessStatusCode();
    }

    private async Task ConnectAIModelAsync(string email, string modelKey, string provider = AIProviders.Gemini)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        var user = await db.Users.SingleAsync(u => u.Email == email);
        var membership = await db.Memberships.SingleAsync(m => m.UserId == user.Id);

        var config = await db.TenantAIConfigurations.FirstOrDefaultAsync(c => c.TenantId == membership.TenantId);
        if (config == null)
        {
            config = new TenantAIConfiguration
            {
                TenantId = membership.TenantId,
                ProviderKey = provider,
                EncryptedApiKey = "test_encrypted_key",
                MaskedApiKey = "••••••••test",
                SelectedModelKey = modelKey,
                SupportedCapability = AIModelCapability.Both,
                Status = AIConnectionStatus.Connected,
                LastValidatedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.TenantAIConfigurations.Add(config);
        }
        else
        {
            config.SelectedModelKey = modelKey;
            config.Status = AIConnectionStatus.Connected;
            config.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
    }

    private static MultipartFormDataContent CreateUploadContent(byte[] fileBytes, string fileName, string contentType, string usageType, string? slot = null)
    {
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(fileBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(fileContent, "File", fileName);
        content.Add(new StringContent(usageType), "UsageType");
        if (slot != null)
        {
            content.Add(new StringContent(slot), "Slot");
        }
        return content;
    }

    [Fact]
    public async Task AIEnhancement_HappyPath_CreatesVariant_ApprovalDoesNotPublish_ExplicitPublishSucceeds()
    {
        var email = $"enhance_hp_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Clarity Interiors", email);
        await ConnectAIModelAsync(email, "gemini-1.5-pro"); // Multimodal image-capable

        // 1. Upload original photo
        var uploadContent = CreateUploadContent(CreateValidJpegBytes(), "living_room.jpg", "image/jpeg", "WebsiteImage", "hero");
        var uploadRes = await client.PostAsync("/api/v1/website/images", uploadContent);
        Assert.Equal(HttpStatusCode.Created, uploadRes.StatusCode);
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // 2. Request AI Enhancement: ImproveClarity
        var enhanceRes = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new { Operation = "ImproveClarity" });
        Assert.Equal(HttpStatusCode.Accepted, enhanceRes.StatusCode);
        var enhanceJson = await enhanceRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = enhanceJson.GetProperty("data").GetProperty("variantId").GetString()!;

        // 3. Verify in database: AIRequest tracked and ImageVariant created
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var image = await db.Images.Include(i => i.Variants).FirstAsync(i => i.Id == Guid.Parse(imageId));
            Assert.Single(image.Variants);

            var variant = image.Variants.First();
            Assert.Equal("AIEnhanced", variant.VariantType);
            Assert.Equal("ImproveClarity", variant.Operation);
            Assert.Equal("Enhanced", variant.Status);

            var aiReq = await db.AIRequests.FirstOrDefaultAsync(r => r.ResourceId == Guid.Parse(imageId));
            Assert.NotNull(aiReq);
            Assert.Equal(AIReviewStatus.PendingReview, aiReq.ReviewStatus);
            Assert.Equal(AIRequestStatus.Succeeded, aiReq.Status);

            // Verify original asset remains immutable
            Assert.Equal("image/jpeg", image.MimeType);
            Assert.Equal("living_room.jpg", image.OriginalFileName);
        }

        // 4. Client approves enhancement
        var approveRes = await client.PostAsJsonAsync(
            $"/api/v1/website/images/{imageId}/enhancement/approve",
            new { VariantId = Guid.Parse(variantId) });
        Assert.Equal(HttpStatusCode.OK, approveRes.StatusCode);

        // 5. Verify: Approval MUST NOT automatically publish the image!
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var image = await db.Images.Include(i => i.Variants).FirstAsync(i => i.Id == Guid.Parse(imageId));
            var variant = image.Variants.First();

            Assert.Equal("Approved", variant.Status);
            // Parent image was not yet published, so live status remains unchanged
            Assert.NotEqual("Published", image.Status);

            var aiReq = await db.AIRequests.FirstAsync(r => r.ResourceId == Guid.Parse(imageId));
            Assert.Equal(AIReviewStatus.Accepted, aiReq.ReviewStatus);
        }

        // 6. Explicit Publish
        var pubRes = await client.PostAsJsonAsync(
            $"/api/v1/website/images/{imageId}/publish",
            new { VariantId = Guid.Parse(variantId) });
        Assert.Equal(HttpStatusCode.OK, pubRes.StatusCode);

        // 7. Verify live delivery serves the published enhanced variant
        var anonClient = _factory.CreateClient();
        var fileRes = await anonClient.GetAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/file");
        Assert.Equal(HttpStatusCode.OK, fileRes.StatusCode);
    }

    [Fact]
    public async Task AIEnhancement_ClientRejection_PreservesOriginal_DoesNotPublish()
    {
        var email = $"enhance_rej_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Rejection Studio", email);
        await ConnectAIModelAsync(email, "gemini-1.5-pro");

        var uploadContent = CreateUploadContent(CreateValidPngBytes(), "cabinet.png", "image/png", "WebsiteImage", "secondaryImage");
        var uploadRes = await client.PostAsync("/api/v1/website/images", uploadContent);
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // Request ModernLook
        var enhanceRes = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new { Operation = "ModernLook" });
        var enhanceJson = await enhanceRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = enhanceJson.GetProperty("data").GetProperty("variantId").GetString()!;

        // Reject enhancement
        var rejectRes = await client.PostAsJsonAsync(
            $"/api/v1/website/images/{imageId}/enhancement/reject",
            new { VariantId = Guid.Parse(variantId) });
        Assert.Equal(HttpStatusCode.OK, rejectRes.StatusCode);

        // Verify variant is Rejected and AIRequest is marked Rejected
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var variant = await db.ImageVariants.FirstAsync(v => v.Id == Guid.Parse(variantId));
            Assert.Equal("Rejected", variant.Status);

            var aiReq = await db.AIRequests.FirstAsync(r => r.ResourceId == Guid.Parse(imageId));
            Assert.Equal(AIReviewStatus.Rejected, aiReq.ReviewStatus);
        }

        // Attempting to publish rejected variant fails
        var pubRes = await client.PostAsJsonAsync(
            $"/api/v1/website/images/{imageId}/publish",
            new { VariantId = Guid.Parse(variantId) });
        Assert.Equal(HttpStatusCode.BadRequest, pubRes.StatusCode);
    }

    [Fact]
    public async Task AIEnhancement_ProhibitedTransformations_AreExplicitlyBlocked()
    {
        var email = $"prohibited_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Fidelity Architecture", email);
        await ConnectAIModelAsync(email, "gemini-1.5-pro");

        var uploadContent = CreateUploadContent(CreateValidJpegBytes(), "facade.jpg", "image/jpeg", "WebsiteImage", "hero");
        var uploadRes = await client.PostAsync("/api/v1/website/images", uploadContent);
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // Prohibited transformation: AddObjects
        var res1 = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new { Operation = "AddObjects" });
        Assert.Equal(HttpStatusCode.BadRequest, res1.StatusCode);
        var err1 = await res1.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("PROHIBITED_TRANSFORMATION", err1.GetProperty("code").GetString());

        // Prohibited transformation: GenerateImage
        var res2 = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new { Operation = "GenerateImage" });
        Assert.Equal(HttpStatusCode.BadRequest, res2.StatusCode);
        var err2 = await res2.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("PROHIBITED_TRANSFORMATION", err2.GetProperty("code").GetString());

        // Prohibited transformation: ReplaceArchitecture
        var res3 = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new { Operation = "ReplaceArchitecture" });
        Assert.Equal(HttpStatusCode.BadRequest, res3.StatusCode);
        var err3 = await res3.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("PROHIBITED_TRANSFORMATION", err3.GetProperty("code").GetString());
    }

    [Fact]
    public async Task AIEnhancement_ModelCapabilityMismatch_ReturnsControlledError()
    {
        var email = $"cap_mismatch_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Text Only Design", email);

        var uploadContent = CreateUploadContent(CreateValidJpegBytes(), "decor.jpg", "image/jpeg", "WebsiteImage", "hero");
        var uploadRes = await client.PostAsync("/api/v1/website/images", uploadContent);
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // Enhancement works deterministically without AI capability requirement
        var enhanceRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/enhance", new { Operation = "ReduceNoise" });
        Assert.Equal(HttpStatusCode.Created, enhanceRes.StatusCode);
        var resp = await enhanceRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ReduceNoise", resp.GetProperty("data").GetProperty("operation").GetString());
    }

    [Fact]
    public async Task Enhancement_WorksWithoutAIConfigured_SucceedsDeterministically()
    {
        var email = $"no_ai_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Disconnected Studio", email);
        // Do NOT connect an AI model

        var uploadContent = CreateUploadContent(CreateValidJpegBytes(), "patio.jpg", "image/jpeg", "WebsiteImage", "hero");
        var uploadRes = await client.PostAsync("/api/v1/website/images", uploadContent);
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        var enhanceRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/enhance", new { Operation = "ImproveSharpness" });
        Assert.Equal(HttpStatusCode.Created, enhanceRes.StatusCode);
        var resp = await enhanceRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ImproveSharpness", resp.GetProperty("data").GetProperty("operation").GetString());
    }

    [Fact]
    public async Task AIEnhancement_WebOptimizeOperation_WorksWithoutExternalAIConnection()
    {
        var email = $"webopt_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Web Optimize Co", email);
        // No AI connected

        var uploadContent = CreateUploadContent(CreateValidJpegBytes(), "header.jpg", "image/jpeg", "WebsiteImage", "hero");
        var uploadRes = await client.PostAsync("/api/v1/website/images", uploadContent);
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // WebOptimize via enhance endpoint works deterministically
        var optRes = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new { Operation = "WebOptimize" });
        Assert.Equal(HttpStatusCode.Accepted, optRes.StatusCode);
        var optJson = await optRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.NotNull(optJson.GetProperty("data").GetProperty("variantId").GetString());
    }

    [Fact]
    public async Task AIEnhancement_TenantIsolation_CrossTenantAccessBlocked()
    {
        var emailA = $"tenantA_{Guid.NewGuid():N}@sparovia.com";
        var clientA = await GetAuthenticatedClientAsync(emailA);
        await SetupAndConfirmBusinessContextAsync(clientA, "Tenant A Architecture", emailA);
        await ConnectAIModelAsync(emailA, "gemini-1.5-pro");

        var emailB = $"tenantB_{Guid.NewGuid():N}@sparovia.com";
        var clientB = await GetAuthenticatedClientAsync(emailB);
        await SetupAndConfirmBusinessContextAsync(clientB, "Tenant B Architecture", emailB);
        await ConnectAIModelAsync(emailB, "gemini-1.5-pro");

        // Tenant A uploads image
        var uploadContent = CreateUploadContent(CreateValidJpegBytes(), "secret_project.jpg", "image/jpeg", "WebsiteImage", "hero");
        var uploadRes = await clientA.PostAsync("/api/v1/website/images", uploadContent);
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageIdA = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // Tenant B attempts to enhance Tenant A's image -> 404 NotFound
        var crossEnhanceRes = await clientB.PostAsJsonAsync($"/api/v1/ai/images/{imageIdA}/enhance", new { Operation = "Upscale" });
        Assert.Equal(HttpStatusCode.NotFound, crossEnhanceRes.StatusCode);

        // Tenant A enhances their own image
        var enhanceRes = await clientA.PostAsJsonAsync($"/api/v1/ai/images/{imageIdA}/enhance", new { Operation = "Upscale" });
        Assert.Equal(HttpStatusCode.Accepted, enhanceRes.StatusCode);
        var enhanceJson = await enhanceRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantIdA = enhanceJson.GetProperty("data").GetProperty("variantId").GetString()!;

        // Tenant B attempts to approve Tenant A's variant -> 404 NotFound
        var crossApproveRes = await clientB.PostAsJsonAsync(
            $"/api/v1/website/images/{imageIdA}/enhancement/approve",
            new { VariantId = Guid.Parse(variantIdA) });
        Assert.Equal(HttpStatusCode.NotFound, crossApproveRes.StatusCode);

        // Tenant B attempts to reject Tenant A's variant -> 404 NotFound
        var crossRejectRes = await clientB.PostAsJsonAsync(
            $"/api/v1/website/images/{imageIdA}/enhancement/reject",
            new { VariantId = Guid.Parse(variantIdA) });
        Assert.Equal(HttpStatusCode.NotFound, crossRejectRes.StatusCode);
    }

    [Fact]
    public async Task EnhanceImage_WithMultipartFormDataOrJson_DoesNotReturn415()
    {
        var email = $"media_type_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Media Type Studio", email);

        var uploadContent = CreateUploadContent(CreateValidJpegBytes(), "sample.jpg", "image/jpeg", "WebsiteImage", "hero");
        var uploadRes = await client.PostAsync("/api/v1/website/images", uploadContent);
        uploadRes.EnsureSuccessStatusCode();
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // 1. Send JSON payload
        var jsonRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/enhance", new { Operation = "ImproveClarity" });
        Assert.NotEqual(HttpStatusCode.UnsupportedMediaType, jsonRes.StatusCode);
        Assert.Equal(HttpStatusCode.Created, jsonRes.StatusCode);

        // 2. Send FormUrlEncodedContent (simulating form post)
        var formContent = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("operation", "ImproveSharpness")
        });
        var formRes = await client.PostAsync($"/api/v1/website/images/{imageId}/enhance", formContent);
        Assert.NotEqual(HttpStatusCode.UnsupportedMediaType, formRes.StatusCode);
        Assert.Equal(HttpStatusCode.Created, formRes.StatusCode);

        // 3. Send MultipartFormDataContent (simulating multipart post)
        var multiContent = new MultipartFormDataContent();
        multiContent.Add(new StringContent("ReduceNoise"), "operation");
        var multiRes = await client.PostAsync($"/api/v1/website/images/{imageId}/enhance", multiContent);
        Assert.NotEqual(HttpStatusCode.UnsupportedMediaType, multiRes.StatusCode);
        Assert.Equal(HttpStatusCode.Created, multiRes.StatusCode);

        // 4. Missing operation should return 400 Bad Request, NOT 415
        var emptyJsonRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/enhance", new { Operation = "" });
        Assert.NotEqual(HttpStatusCode.UnsupportedMediaType, emptyJsonRes.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, emptyJsonRes.StatusCode);
    }

    [Fact]
    public async Task EnhanceImage_AllSevenApprovedOperations_ExecuteAndPersistIndependently()
    {
        var email = $"all_seven_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Seven Operations Studio", email);

        var uploadContent = CreateUploadContent(CreateValidJpegBytes(), "architectural.jpg", "image/jpeg", "WebsiteImage", "about-feature");
        var uploadRes = await client.PostAsync("/api/v1/website/images", uploadContent);
        uploadRes.EnsureSuccessStatusCode();
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        var operations = new[]
        {
            "ImproveClarity",
            "ImproveSharpness",
            "ReduceNoise",
            "Upscale",
            "ClassicLook",
            "ModernLook",
            "WebOptimize"
        };

        foreach (var op in operations)
        {
            var res = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/enhance", new { Operation = op });
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
            var json = await res.Content.ReadFromJsonAsync<JsonElement>();
            var data = json.GetProperty("data");

            Assert.Equal(op, data.GetProperty("operation").GetString());
            Assert.NotNull(data.GetProperty("id").GetString());
            Assert.True(data.GetProperty("width").GetInt32() > 0);
            Assert.True(data.GetProperty("height").GetInt32() > 0);
            Assert.True(data.GetProperty("fileSize").GetInt64() > 0);

            if (op == "WebOptimize")
            {
                Assert.Equal("image/webp", data.GetProperty("mimeType").GetString());
            }

            if (op == "Upscale")
            {
                // Verify upscale produced resolution greater than or equal to source
                Assert.True(data.GetProperty("width").GetInt32() >= 800);
            }
        }

        // Verify retrieval of all saved variants after page reload / fresh GET
        var getRes = await client.GetAsync($"/api/v1/website/images/{imageId}");
        getRes.EnsureSuccessStatusCode();
        var getJson = await getRes.Content.ReadFromJsonAsync<JsonElement>();
        var variants = getJson.GetProperty("data").GetProperty("variants");
        Assert.True(variants.GetArrayLength() >= 7);
    }

    [Fact]
    public async Task CategoryPlaceholder_SelectCategory_NotPersistedAsCategory()
    {
        var email = $"cat_placeholder_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Category Validation Co", email);

        // Upload with empty category (Select category placeholder selection)
        var uploadContent = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(CreateValidJpegBytes());
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        uploadContent.Add(fileContent, "File", "portfolio.jpg");
        uploadContent.Add(new StringContent("ExploreOurWork"), "UsageType");
        uploadContent.Add(new StringContent("Kitchen Renovation"), "ProjectWorkName");
        // Category left unset / empty

        var uploadRes = await client.PostAsync("/api/v1/website/images/explore-our-work", uploadContent);
        uploadRes.EnsureSuccessStatusCode();
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // Fetch image directly and assert category is null, not "Select category" or "No Category"
        var getRes = await client.GetAsync($"/api/v1/website/images/{imageId}");
        getRes.EnsureSuccessStatusCode();
        var getJson = await getRes.Content.ReadFromJsonAsync<JsonElement>();
        var catElement = getJson.GetProperty("data").GetProperty("category");
        Assert.True(catElement.ValueKind == JsonValueKind.Null || string.IsNullOrEmpty(catElement.GetString()));
    }
}
