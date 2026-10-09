using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Application.Images;
using Sparovia.Application.Onboarding;
using Sparovia.Domain.Constants;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;
using Xunit;

namespace Sparovia.IntegrationTests;

public class WebsiteImagesTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public WebsiteImagesTests(WebApplicationFactory<Program> factory)
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
            FullName = "Image Tester",
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
            BusinessPhone = "+1 555-0199",
            BusinessEmail = email,
            Website = "https://example.com"
        };
        var r1 = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", basics);
        r1.EnsureSuccessStatusCode();

        var location = new LocationAndCustomersDto
        {
            AddressLine1 = "100 Design Studio Way",
            City = "Tech City",
            State = "CA",
            PostalCode = "94016",
            Country = "United States",
            ServiceAreas = new List<string> { "Greater Metro" }
        };
        var r2 = await client.PutAsJsonAsync("/api/v1/onboarding/location-customers", location);
        r2.EnsureSuccessStatusCode();

        var svc = new ServiceDto { ServiceName = "Modular Kitchens", ServiceDescription = "Tailored kitchen design" };
        var r3 = await client.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        r3.EnsureSuccessStatusCode();

        var confirmResp = await client.PostAsync("/api/v1/onboarding/confirm", null);
        confirmResp.EnsureSuccessStatusCode();
    }

    private static MultipartFormDataContent CreateImageMultipartContent(byte[] imageBytes, string fileName, string contentType, string? usageType = null, string? slot = null, string? projectWorkName = null, string? caption = null)
    {
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(imageBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(fileContent, "file", fileName);

        if (!string.IsNullOrWhiteSpace(usageType))
            content.Add(new StringContent(usageType), "usageType");
        if (!string.IsNullOrWhiteSpace(slot))
            content.Add(new StringContent(slot), "slot");
        if (!string.IsNullOrWhiteSpace(projectWorkName))
            content.Add(new StringContent(projectWorkName), "projectWorkName");
        if (!string.IsNullOrWhiteSpace(caption))
            content.Add(new StringContent(caption), "caption");

        return content;
    }

    [Fact]
    public async Task ImageUpload_ValidImage_ReturnsCreatedAndPreservesOriginal()
    {
        var email = $"img_upload_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Upload Design Ltd", email);

        var jpegBytes = CreateValidJpegBytes();
        var form = CreateImageMultipartContent(jpegBytes, "hero_kitchen.jpg", "image/jpeg", "WebsiteImage", "heroImage");

        var resp = await client.PostAsync("/api/v1/website/images", form);
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var data = body.GetProperty("data");
        var imageId = data.GetProperty("id").GetString();
        Assert.NotNull(imageId);
        Assert.Equal("heroImage", data.GetProperty("slot").GetString());
        Assert.Equal("WebsiteImage", data.GetProperty("usageType").GetString());
        Assert.Equal(1920, data.GetProperty("width").GetInt32());
        Assert.Equal(1080, data.GetProperty("height").GetInt32());

        // Verify retrieval
        var listResp = await client.GetAsync("/api/v1/website/images");
        Assert.Equal(HttpStatusCode.OK, listResp.StatusCode);
        var listBody = await listResp.Content.ReadFromJsonAsync<JsonElement>();
        var images = listBody.GetProperty("data");
        Assert.True(images.GetArrayLength() >= 1);
    }

    [Fact]
    public async Task ImageUpload_UnsupportedFormat_RejectsWithClientFriendlyError()
    {
        var email = $"img_reject_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Reject Design Ltd", email);

        var fakeBytes = new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00 }; // EXE header
        var form = CreateImageMultipartContent(fakeBytes, "malicious.jpg", "image/jpeg");

        var resp = await client.PostAsync("/api/v1/website/images", form);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("error", out var err) || body.TryGetProperty("Error", out err));
    }

    [Fact]
    public async Task CrossTenantImageAccess_IsStrictlyIsolatedAndRejected()
    {
        // Tenant A uploads an image
        var emailA = $"tenant_a_{Guid.NewGuid():N}@test.local";
        var clientA = await GetAuthenticatedClientAsync(emailA);
        await SetupAndConfirmBusinessContextAsync(clientA, "Tenant A Interiors", emailA);

        var formA = CreateImageMultipartContent(CreateValidJpegBytes(), "secret.jpg", "image/jpeg");
        var uploadRespA = await clientA.PostAsync("/api/v1/website/images", formA);
        var bodyA = await uploadRespA.Content.ReadFromJsonAsync<JsonElement>();
        var imageIdA = bodyA.GetProperty("data").GetProperty("id").GetString();

        // Tenant B registers and attempts to access Tenant A's image
        var emailB = $"tenant_b_{Guid.NewGuid():N}@test.local";
        var clientB = await GetAuthenticatedClientAsync(emailB);
        await SetupAndConfirmBusinessContextAsync(clientB, "Tenant B Interiors", emailB);

        // 1. GET Image A
        var getResp = await clientB.GetAsync($"/api/v1/website/images/{imageIdA}");
        Assert.Equal(HttpStatusCode.NotFound, getResp.StatusCode);

        // 2. GET Preview Image A
        var previewResp = await clientB.GetAsync($"/api/v1/website/images/{imageIdA}/preview");
        Assert.Equal(HttpStatusCode.NotFound, previewResp.StatusCode);

        // 3. REPLACE Image A
        var replaceForm = CreateImageMultipartContent(CreateValidPngBytes(), "hacked.png", "image/png");
        var replaceResp = await clientB.PostAsync($"/api/v1/website/images/{imageIdA}/replace", replaceForm);
        Assert.Equal(HttpStatusCode.NotFound, replaceResp.StatusCode);

        // 4. PUBLISH Image A
        var pubResp = await clientB.PostAsJsonAsync($"/api/v1/website/images/{imageIdA}/publish", new PublishImageRequest());
        Assert.Equal(HttpStatusCode.NotFound, pubResp.StatusCode);

        // 5. REMOVE/DEACTIVATE Image A
        var deleteResp = await clientB.DeleteAsync($"/api/v1/website/images/{imageIdA}");
        Assert.Equal(HttpStatusCode.NotFound, deleteResp.StatusCode);

        // 6. ENHANCE Image A
        var enhanceResp = await clientB.PostAsJsonAsync($"/api/v1/ai/images/{imageIdA}/enhance", new EnhanceImageRequest { Operation = "ImproveClarity" });
        Assert.Equal(HttpStatusCode.NotFound, enhanceResp.StatusCode);
    }

    [Fact]
    public async Task ImageReplacement_FailedValidation_PreservesExistingLiveImage()
    {
        var email = $"img_repl_fail_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Replacement Test Studio", email);

        // 1. Upload initial image
        var form = CreateImageMultipartContent(CreateValidJpegBytes(), "initial_hero.jpg", "image/jpeg", "WebsiteImage", "heroImage");
        var uploadResp = await client.PostAsync("/api/v1/website/images", form);
        var body = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = body.GetProperty("data").GetProperty("id").GetString();

        // 2. Publish initial image
        await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest());

        // 3. Attempt replacement with corrupt file
        var corruptBytes = new byte[] { 0x00, 0x01, 0x02, 0x03, 0x04 };
        var badReplaceForm = CreateImageMultipartContent(corruptBytes, "corrupt.jpg", "image/jpeg");
        var replaceResp = await client.PostAsync($"/api/v1/website/images/{imageId}/replace", badReplaceForm);
        Assert.Equal(HttpStatusCode.BadRequest, replaceResp.StatusCode);

        // 4. Confirm original image is still Published and active
        var verifyResp = await client.GetAsync($"/api/v1/website/images/{imageId}");
        var verifyBody = await verifyResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Published", verifyBody.GetProperty("data").GetProperty("status").GetString());
        Assert.True(verifyBody.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());
    }

    [Fact]
    public async Task ExploreOurWork_AddAndMetadataUpdate_WorksAndPreservesFactualInformation()
    {
        var email = $"explore_work_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Craftwork Projects Co", email);

        var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(CreateValidPngBytes());
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(fileContent, "file", "craft_kitchen.png");
        form.Add(new StringContent("Modern Minimalist Kitchen"), "projectWorkName");
        form.Add(new StringContent("Completed renovation in 2026 with custom cabinetry."), "caption");

        var addResp = await client.PostAsync("/api/v1/website/images/explore-our-work", form);
        Assert.Equal(HttpStatusCode.Created, addResp.StatusCode);

        var body = await addResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = body.GetProperty("data").GetProperty("id").GetString();
        Assert.Equal("ExploreOurWork", body.GetProperty("data").GetProperty("usageType").GetString());
        Assert.Equal("Modern Minimalist Kitchen", body.GetProperty("data").GetProperty("projectWorkName").GetString());

        // Update metadata
        var updateReq = new UpdateImageMetadataRequest
        {
            ProjectWorkName = "Updated Kitchen Project",
            Caption = "Custom solid walnut and quartz countertops."
        };
        var updateResp = await client.PutAsJsonAsync($"/api/v1/website/images/{imageId}/metadata", updateReq);
        Assert.Equal(HttpStatusCode.OK, updateResp.StatusCode);

        var updateBody = await updateResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Updated Kitchen Project", updateBody.GetProperty("data").GetProperty("projectWorkName").GetString());
        Assert.Equal("Custom solid walnut and quartz countertops.", updateBody.GetProperty("data").GetProperty("caption").GetString());
    }

    [Fact]
    public async Task SafeRemoval_DeactivatesFromActiveUsage_PreservesOriginalAsset()
    {
        var email = $"safe_remove_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Removals Studio", email);

        var form = CreateImageMultipartContent(CreateValidJpegBytes(), "living.jpg", "image/jpeg");
        var uploadResp = await client.PostAsync("/api/v1/website/images", form);
        var body = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = body.GetProperty("data").GetProperty("id").GetString();

        // Safe removal from active usage
        var removeResp = await client.DeleteAsync($"/api/v1/website/images/{imageId}");
        Assert.Equal(HttpStatusCode.OK, removeResp.StatusCode);

        // Image still exists in tenant library with status "Unused" and IsActiveWebsiteUsage = false
        var verifyResp = await client.GetAsync($"/api/v1/website/images/{imageId}");
        Assert.Equal(HttpStatusCode.OK, verifyResp.StatusCode);
        var verifyBody = await verifyResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Unused", verifyBody.GetProperty("data").GetProperty("status").GetString());
        Assert.False(verifyBody.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());

        // Original file is still downloadable internally for the tenant
        var fileResp = await client.GetAsync($"/api/v1/website/images/{imageId}/file");
        Assert.Equal(HttpStatusCode.OK, fileResp.StatusCode);
    }

    [Fact]
    public async Task EnhanceImage_DoesNotRequireAIProvider_SucceedsDeterministically()
    {
        var email = $"non_ai_enhance_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Deterministic Studio", email);

        // Upload image
        var form = CreateImageMultipartContent(CreateValidJpegBytes(), "kitchen.jpg", "image/jpeg");
        var uploadResp = await client.PostAsync("/api/v1/website/images", form);
        var body = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = body.GetProperty("data").GetProperty("id").GetString();

        // Attempt EnhanceImage - succeeds without any AI provider configured
        var enhanceReq = new EnhanceImageRequest { Operation = "ImproveClarity" };
        var enhanceResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/enhance", enhanceReq);
        Assert.Equal(HttpStatusCode.Created, enhanceResp.StatusCode);

        var respBody = await enhanceResp.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = respBody.GetProperty("data").GetProperty("id").GetString();
        Assert.NotNull(variantId);
        Assert.Equal("ImproveClarity", respBody.GetProperty("data").GetProperty("operation").GetString());
    }

    [Fact]
    public async Task EnhanceImage_WithImageCapableModel_CreatesVariantAndApprovesAndPublishes()
    {
        var email = $"ai_enhance_success_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Multimodal Studio", email);

        // Upload image
        var form = CreateImageMultipartContent(CreateValidJpegBytes(), "architectural.jpg", "image/jpeg", "WebsiteImage", "heroImage");
        var uploadResp = await client.PostAsync("/api/v1/website/images", form);
        var body = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = body.GetProperty("data").GetProperty("id").GetString();

        // Connect AI with multimodal model: gpt-4o (Both)
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var user = db.Users.Single(u => u.Email == email);
            var membership = db.Memberships.Single(m => m.UserId == user.Id);
            var aiConfig = new TenantAIConfiguration
            {
                TenantId = membership.TenantId,
                ProviderKey = AIProviders.OpenAI,
                SelectedModelKey = "gpt-4o", // Multimodal / Both
                Status = AIConnectionStatus.Connected,
                SupportedCapability = AIModelCapability.Both
            };
            db.TenantAIConfigurations.Add(aiConfig);
            await db.SaveChangesAsync();
        }

        // 1. Request enhancement
        var enhanceReq = new EnhanceImageRequest { Operation = "ImproveClarity" };
        var enhanceResp = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", enhanceReq);
        Assert.Equal(HttpStatusCode.Accepted, enhanceResp.StatusCode);

        var enhanceBody = await enhanceResp.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = enhanceBody.GetProperty("data").GetProperty("variantId").GetString();
        Assert.NotNull(variantId);

        // 2. Original image remains untouched and is not overwritten
        var originalImgResp = await client.GetAsync($"/api/v1/website/images/{imageId}");
        var origBody = await originalImgResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Approved", origBody.GetProperty("data").GetProperty("status").GetString());

        // 3. Approve enhancement
        var approveReq = new ApproveEnhancementRequest { VariantId = Guid.Parse(variantId) };
        var approveResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/enhancement/approve", approveReq);
        Assert.Equal(HttpStatusCode.OK, approveResp.StatusCode);

        // 4. Publish image with approved variant
        var pubReq = new PublishImageRequest { VariantId = Guid.Parse(variantId) };
        var pubResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", pubReq);
        Assert.Equal(HttpStatusCode.OK, pubResp.StatusCode);

        var pubBody = await pubResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Published", pubBody.GetProperty("data").GetProperty("status").GetString());
    }

    [Fact]
    public async Task ImageUpload_PathTraversalInFilename_IsSanitizedAndCannotEscapeStoragePath()
    {
        var email = $"path_traversal_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Path Traversal Defense Studio", email);

        var jpegBytes = CreateValidJpegBytes();
        var form = CreateImageMultipartContent(jpegBytes, "../../../../../etc/passwd.jpg", "image/jpeg", "WebsiteImage", "heroImage");

        var resp = await client.PostAsync("/api/v1/website/images", form);
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var originalFileName = body.GetProperty("data").GetProperty("originalFileName").GetString();
        Assert.Equal("passwd.jpg", originalFileName);

        // Verify storage key does not contain relative path traversal
        var imageId = body.GetProperty("data").GetProperty("id").GetString();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        var imgEntity = await db.Images.FindAsync(Guid.Parse(imageId!));
        Assert.NotNull(imgEntity);
        Assert.DoesNotContain("..", imgEntity.StorageKey);
        Assert.StartsWith("tenants/", imgEntity.StorageKey);
    }

    [Fact]
    public async Task ImageUpload_ClientCannotControlTenantIdOrStorageKey()
    {
        var email = $"tamper_test_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Tamper Defense Studio", email);

        var fakeTenantId = Guid.NewGuid();
        var jpegBytes = CreateValidJpegBytes();
        var form = CreateImageMultipartContent(jpegBytes, "tamper.jpg", "image/jpeg");
        // Attempt to inject arbitrary client fields
        form.Add(new StringContent(fakeTenantId.ToString()), "tenantId");
        form.Add(new StringContent("/etc/custom_storage_key.jpg"), "storageKey");

        var resp = await client.PostAsync("/api/v1/website/images", form);
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = body.GetProperty("data").GetProperty("id").GetString();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        var imgEntity = await db.Images.FindAsync(Guid.Parse(imageId!));
        Assert.NotNull(imgEntity);
        // TenantId must NOT equal the injected fakeTenantId
        Assert.NotEqual(fakeTenantId, imgEntity.TenantId);
        // StorageKey must NOT equal the client-injected storageKey
        Assert.NotEqual("/etc/custom_storage_key.jpg", imgEntity.StorageKey);
        Assert.StartsWith($"tenants/{imgEntity.TenantId}/", imgEntity.StorageKey);
    }

    [Fact]
    public async Task QualityStudio_ProcessAndApprove_PreservesOriginalAndEnforcesTenantIsolation()
    {
        var email = $"quality_studio_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Quality Studio Testing Co", email);

        // 1. Upload an image
        var form = CreateImageMultipartContent(CreateValidPngBytes(), "studio_work.png", "image/png", "WebsiteImage", "heroImage");
        var uploadResp = await client.PostAsync("/api/v1/website/images", form);
        Assert.Equal(HttpStatusCode.Created, uploadResp.StatusCode);
        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();
        var originalFileName = uploadBody.GetProperty("data").GetProperty("originalFileName").GetString();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        var originalImgEntity = await db.Images.AsNoTracking().FirstOrDefaultAsync(i => i.Id == Guid.Parse(imageId!));
        Assert.NotNull(originalImgEntity);
        var originalStorageKey = originalImgEntity.StorageKey;

        // 2. Process image via Quality Studio using default Balanced preset
        var qsReq = new QualityStudioProcessRequest
        {
            Preset = "Balanced"
        };
        var processResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/quality/process", qsReq);
        Assert.Equal(HttpStatusCode.Created, processResp.StatusCode);

        var processBody = await processResp.Content.ReadFromJsonAsync<JsonElement>();
        var variantData = processBody.GetProperty("data");
        var variantId = variantData.GetProperty("id").GetString();
        var variantType = variantData.GetProperty("variantType").GetString();
        var operation = variantData.GetProperty("operation").GetString();
        var status = variantData.GetProperty("status").GetString();

        Assert.Equal("QualityStudio", variantType);
        Assert.Equal("QualityStudio:Balanced", operation);
        Assert.Equal("Enhanced", status);

        // 3. Verify original image entity in database is NOT modified
        var postImgEntity = await db.Images.AsNoTracking().FirstOrDefaultAsync(i => i.Id == Guid.Parse(imageId!));
        Assert.NotNull(postImgEntity);
        Assert.Equal(originalStorageKey, postImgEntity.StorageKey);

        var origResp = await client.GetAsync($"/api/v1/website/images/{imageId}");
        var origBody = await origResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(originalFileName, origBody.GetProperty("data").GetProperty("originalFileName").GetString());

        // 4. Approve the variant
        var approveResp = await client.PostAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/approve", null);
        Assert.Equal(HttpStatusCode.OK, approveResp.StatusCode);
        var approveBody = await approveResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Approved", approveBody.GetProperty("data").GetProperty("status").GetString());

        // 5. Test tenant isolation: another tenant cannot access or approve this variant
        var otherEmail = $"other_tenant_{Guid.NewGuid():N}@test.local";
        var otherClient = await GetAuthenticatedClientAsync(otherEmail);
        await SetupAndConfirmBusinessContextAsync(otherClient, "Other Studio Co", otherEmail);

        var unauthorizedProcessResp = await otherClient.PostAsJsonAsync($"/api/v1/website/images/{imageId}/quality/process", qsReq);
        Assert.Equal(HttpStatusCode.NotFound, unauthorizedProcessResp.StatusCode);

        var unauthorizedApproveResp = await otherClient.PostAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/approve", null);
        Assert.Equal(HttpStatusCode.NotFound, unauthorizedApproveResp.StatusCode);
    }
}
