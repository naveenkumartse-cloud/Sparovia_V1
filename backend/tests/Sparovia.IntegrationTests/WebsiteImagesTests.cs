using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
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
        using var bmp = new SkiaSharp.SKBitmap(1920, 1080, SkiaSharp.SKColorType.Rgba8888, SkiaSharp.SKAlphaType.Premul);
        using (var canvas = new SkiaSharp.SKCanvas(bmp))
        {
            canvas.Clear(new SkiaSharp.SKColor(40, 80, 160));
        }
        using var img = SkiaSharp.SKImage.FromBitmap(bmp);
        using var data = img.Encode(SkiaSharp.SKEncodedImageFormat.Jpeg, 90);
        return data.ToArray();
    }

    private static byte[] CreateValidPngBytes()
    {
        using var bmp = new SkiaSharp.SKBitmap(800, 600, SkiaSharp.SKColorType.Rgba8888, SkiaSharp.SKAlphaType.Premul);
        using (var canvas = new SkiaSharp.SKCanvas(bmp))
        {
            canvas.Clear(new SkiaSharp.SKColor(30, 120, 60));
        }
        using var img = SkiaSharp.SKImage.FromBitmap(bmp);
        using var data = img.Encode(SkiaSharp.SKEncodedImageFormat.Png, 100);
        return data.ToArray();
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

    [Fact]
    public async Task GetCategories_MatchesActualExploreOurWorkImagesCount_CaseAndWhitespaceInsensitive()
    {
        var email = $"cat_count_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Category Count Design Ltd", email);

        // 1. Create category "Modular Kitchens"
        var createCatReq = new { name = "Modular Kitchens" };
        var catResp = await client.PostAsJsonAsync("/api/v1/website/categories", createCatReq);
        Assert.Equal(HttpStatusCode.Created, catResp.StatusCode);

        // 2. Upload an ExploreOurWork image with Category with whitespace and casing variance
        var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(CreateValidPngBytes());
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(fileContent, "file", "kitchen_showcase.png");
        form.Add(new StringContent("ExploreOurWork"), "usageType");
        form.Add(new StringContent("Modern Villa Kitchen"), "projectWorkName");
        form.Add(new StringContent("  Modular Kitchens  "), "category");

        var uploadResp = await client.PostAsync("/api/v1/website/images", form);
        Assert.Equal(HttpStatusCode.Created, uploadResp.StatusCode);

        // 3. Query categories and verify imageCount is 1
        var listResp = await client.GetAsync("/api/v1/website/categories");
        Assert.Equal(HttpStatusCode.OK, listResp.StatusCode);

        var listBody = await listResp.Content.ReadFromJsonAsync<JsonElement>();
        var cats = listBody.GetProperty("data").EnumerateArray().ToList();
        var modularCat = cats.FirstOrDefault(c => c.GetProperty("name").GetString() == "Modular Kitchens");
        Assert.True(modularCat.ValueKind == JsonValueKind.Object);
        Assert.Equal(1, modularCat.GetProperty("imageCount").GetInt32());
    }

    [Fact]
    public async Task ReEnhancement_And_ReApproval_AllowsNewCandidate_WithoutAffectingCurrentlyPublishedLiveImage()
    {
        var email = $"reenhance_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "ReEnhancement Studio", email);

        // 1. Upload initial hero image
        var form = CreateImageMultipartContent(CreateValidJpegBytes(), "hero_living.jpg", "image/jpeg", "WebsiteImage", "heroImage");
        var uploadResp = await client.PostAsync("/api/v1/website/images", form);
        Assert.Equal(HttpStatusCode.Created, uploadResp.StatusCode);
        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();

        // 2. Enhance with ImproveClarity
        var enhanceResp1 = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/enhance", new EnhanceImageRequest { Operation = "ImproveClarity" });
        Assert.Equal(HttpStatusCode.Created, enhanceResp1.StatusCode);
        var enhanceBody1 = await enhanceResp1.Content.ReadFromJsonAsync<JsonElement>();
        var variant1Id = enhanceBody1.GetProperty("data").GetProperty("id").GetString();
        Assert.Equal("Enhanced", enhanceBody1.GetProperty("data").GetProperty("status").GetString());

        // 3. Approve first variant and publish to website
        var approveResp1 = await client.PostAsync($"/api/v1/website/images/{imageId}/variants/{variant1Id}/approve", null);
        Assert.Equal(HttpStatusCode.OK, approveResp1.StatusCode);

        var publishResp1 = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest { VariantId = Guid.Parse(variant1Id!) });
        Assert.Equal(HttpStatusCode.OK, publishResp1.StatusCode);

        // 4. Verify public website uses variant 1
        var contentResp1 = await client.GetAsync("/api/v1/website/published-content");
        var contentBody1 = await contentResp1.Content.ReadFromJsonAsync<JsonElement>();
        var heroUrl1 = contentBody1.GetProperty("sections").GetProperty("hero").GetProperty("heroImage").GetString();
        Assert.Contains(variant1Id!, heroUrl1!);

        // 5. Re-enhance with ClassicLook operation (or run another operation)
        var enhanceResp2 = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/enhance", new EnhanceImageRequest { Operation = "ClassicLook" });
        Assert.Equal(HttpStatusCode.Created, enhanceResp2.StatusCode);
        var enhanceBody2 = await enhanceResp2.Content.ReadFromJsonAsync<JsonElement>();
        var variant2Id = enhanceBody2.GetProperty("data").GetProperty("id").GetString();
        Assert.NotEqual(variant1Id, variant2Id);
        Assert.Equal("Enhanced", enhanceBody2.GetProperty("data").GetProperty("status").GetString());

        // 6. Verify live website is UNCHANGED while candidate 2 is in review
        var contentResp2 = await client.GetAsync("/api/v1/website/published-content");
        var contentBody2 = await contentResp2.Content.ReadFromJsonAsync<JsonElement>();
        var heroUrl2 = contentBody2.GetProperty("sections").GetProperty("hero").GetProperty("heroImage").GetString();
        Assert.Equal(heroUrl1, heroUrl2);

        // 7. Approve variant 2 candidate
        var approveResp2 = await client.PostAsync($"/api/v1/website/images/{imageId}/variants/{variant2Id}/approve", null);
        Assert.Equal(HttpStatusCode.OK, approveResp2.StatusCode);
        var approveBody2 = await approveResp2.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Approved", approveBody2.GetProperty("data").GetProperty("status").GetString());

        // 8. Verify live website is STILL unchanged (approval never auto-publishes)
        var contentResp3 = await client.GetAsync("/api/v1/website/published-content");
        var contentBody3 = await contentResp3.Content.ReadFromJsonAsync<JsonElement>();
        var heroUrl3 = contentBody3.GetProperty("sections").GetProperty("hero").GetProperty("heroImage").GetString();
        Assert.Equal(heroUrl1, heroUrl3);

        // 9. Explicitly publish approved variant 2
        var publishResp2 = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest { VariantId = Guid.Parse(variant2Id!) });
        Assert.Equal(HttpStatusCode.OK, publishResp2.StatusCode);

        // 10. Verify live website now serves variant 2
        var contentResp4 = await client.GetAsync("/api/v1/website/published-content");
        var contentBody4 = await contentResp4.Content.ReadFromJsonAsync<JsonElement>();
        var heroUrl4 = contentBody4.GetProperty("sections").GetProperty("hero").GetProperty("heroImage").GetString();
        Assert.Contains(variant2Id!, heroUrl4!);
    }

    [Fact]
    public async Task UnpublishImage_RemovesFromPublicWebsite_PreservesOriginalAndVariantsInLibrary_AndAllowsRepublishing()
    {
        var email = $"unpublish_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Unpublish Studio", email);

        // 1. Upload and publish hero image
        var form = CreateImageMultipartContent(CreateValidJpegBytes(), "hero_unpublish.jpg", "image/jpeg", "WebsiteImage", "heroImage");
        var uploadResp = await client.PostAsync("/api/v1/website/images", form);
        Assert.Equal(HttpStatusCode.Created, uploadResp.StatusCode);
        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();

        await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest());

        // Verify website renders it
        var contentResp1 = await client.GetAsync("/api/v1/website/published-content");
        var contentBody1 = await contentResp1.Content.ReadFromJsonAsync<JsonElement>();
        var heroUrl1 = contentBody1.GetProperty("sections").GetProperty("hero").GetProperty("heroImage").GetString();
        Assert.NotNull(heroUrl1);
        Assert.Contains(imageId!, heroUrl1);

        // 2. Call Unpublish endpoint
        var unpublishResp = await client.PostAsync($"/api/v1/website/images/{imageId}/unpublish", null);
        Assert.Equal(HttpStatusCode.OK, unpublishResp.StatusCode);

        // 3. Verify public website has slot removed/empty
        var contentResp2 = await client.GetAsync("/api/v1/website/published-content");
        var contentBody2 = await contentResp2.Content.ReadFromJsonAsync<JsonElement>();
        var heroSection = contentBody2.GetProperty("sections").GetProperty("hero");
        var heroUrl2 = heroSection.TryGetProperty("heroImage", out var prop) ? prop.GetString() : null;
        Assert.True(string.IsNullOrEmpty(heroUrl2));

        // 4. Verify original image remains preserved in media library with status "Approved"
        var getResp = await client.GetAsync($"/api/v1/website/images/{imageId}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var getBody = await getResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Approved", getBody.GetProperty("data").GetProperty("status").GetString());
        Assert.False(getBody.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());

        // 5. Verify image can be republished
        var republishResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest());
        Assert.Equal(HttpStatusCode.OK, republishResp.StatusCode);

        var contentResp3 = await client.GetAsync("/api/v1/website/published-content");
        var contentBody3 = await contentResp3.Content.ReadFromJsonAsync<JsonElement>();
        var heroUrl3 = contentBody3.GetProperty("sections").GetProperty("hero").GetProperty("heroImage").GetString();
        Assert.NotNull(heroUrl3);
        Assert.Contains(imageId!, heroUrl3);
    }

    [Fact]
    public async Task ImageReplacement_SuccessfulLifecycle_KeepsOriginalLiveUntilReplacementPublished_ThenDemotesOriginal()
    {
        var email = $"repl_lifecycle_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Replacement Lifecycle Studio", email);

        // 1. Upload and publish initial hero image (Image A)
        var formA = CreateImageMultipartContent(CreateValidJpegBytes(), "hero_original.jpg", "image/jpeg", "WebsiteImage", "heroImage");
        var uploadRespA = await client.PostAsync("/api/v1/website/images", formA);
        Assert.Equal(HttpStatusCode.Created, uploadRespA.StatusCode);
        var bodyA = await uploadRespA.Content.ReadFromJsonAsync<JsonElement>();
        var imageAId = bodyA.GetProperty("data").GetProperty("id").GetString();

        await client.PostAsJsonAsync($"/api/v1/website/images/{imageAId}/publish", new PublishImageRequest());

        // 2. Upload and publish an unrelated slot (primaryImage, Image C) to verify slot isolation
        var formC = CreateImageMultipartContent(CreateValidJpegBytes(), "about_photo.jpg", "image/jpeg", "WebsiteImage", "primaryImage");
        var uploadRespC = await client.PostAsync("/api/v1/website/images", formC);
        Assert.Equal(HttpStatusCode.Created, uploadRespC.StatusCode);
        var bodyC = await uploadRespC.Content.ReadFromJsonAsync<JsonElement>();
        var imageCId = bodyC.GetProperty("data").GetProperty("id").GetString();

        await client.PostAsJsonAsync($"/api/v1/website/images/{imageCId}/publish", new PublishImageRequest());

        // Verify Image A and Image C are live on public website
        var pubContent1 = await client.GetAsync("/api/v1/website/published-content");
        var pubBody1 = await pubContent1.Content.ReadFromJsonAsync<JsonElement>();
        var initialHeroUrl = pubBody1.GetProperty("sections").GetProperty("hero").GetProperty("heroImage").GetString();
        var initialAboutUrl = pubBody1.GetProperty("sections").GetProperty("about").GetProperty("primaryImage").GetString();
        Assert.Contains(imageAId!, initialHeroUrl!);
        Assert.Contains(imageCId!, initialAboutUrl!);

        // 3. Upload replacement for Image A (Image B)
        var formB = CreateImageMultipartContent(CreateValidPngBytes(), "hero_replacement.png", "image/png");
        var replaceResp = await client.PostAsync($"/api/v1/website/images/{imageAId}/replace", formB);
        Assert.Equal(HttpStatusCode.OK, replaceResp.StatusCode);
        var bodyB = await replaceResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageBId = bodyB.GetProperty("data").GetProperty("id").GetString();

        // 4. Verify Image B attributes: assigned to heroImage slot, status Approved, isActiveWebsiteUsage = false
        Assert.Equal("heroImage", bodyB.GetProperty("data").GetProperty("slot").GetString());
        Assert.Equal("Approved", bodyB.GetProperty("data").GetProperty("status").GetString());
        Assert.False(bodyB.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());

        // 5. Verify Image A is STILL live and active
        var verifyAResp = await client.GetAsync($"/api/v1/website/images/{imageAId}");
        var verifyABody = await verifyAResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Published", verifyABody.GetProperty("data").GetProperty("status").GetString());
        Assert.True(verifyABody.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());

        // 6. Verify public website STILL serves Image A for hero and Image C for about
        var pubContent2 = await client.GetAsync("/api/v1/website/published-content");
        var pubBody2 = await pubContent2.Content.ReadFromJsonAsync<JsonElement>();
        var currentHeroUrl = pubBody2.GetProperty("sections").GetProperty("hero").GetProperty("heroImage").GetString();
        var currentAboutUrl = pubBody2.GetProperty("sections").GetProperty("about").GetProperty("primaryImage").GetString();
        Assert.Contains(imageAId!, currentHeroUrl!);
        Assert.Contains(imageCId!, currentAboutUrl!);

        // 7. Verify both images appear in media library listing
        var listResp = await client.GetAsync("/api/v1/website/images");
        Assert.Equal(HttpStatusCode.OK, listResp.StatusCode);
        var listBody = await listResp.Content.ReadFromJsonAsync<JsonElement>();
        var imagesList = listBody.GetProperty("data").EnumerateArray().ToList();
        Assert.Contains(imagesList, img => img.GetProperty("id").GetString() == imageAId && img.GetProperty("isActiveWebsiteUsage").GetBoolean());
        Assert.Contains(imagesList, img => img.GetProperty("id").GetString() == imageBId && !img.GetProperty("isActiveWebsiteUsage").GetBoolean() && img.GetProperty("slot").GetString() == "heroImage");

        // 8. Now explicitly publish Image B
        var pubRespB = await client.PostAsJsonAsync($"/api/v1/website/images/{imageBId}/publish", new PublishImageRequest());
        Assert.Equal(HttpStatusCode.OK, pubRespB.StatusCode);

        // 9. Verify public website now serves Image B for heroImage
        var pubContent3 = await client.GetAsync("/api/v1/website/published-content");
        var pubBody3 = await pubContent3.Content.ReadFromJsonAsync<JsonElement>();
        var updatedHeroUrl = pubBody3.GetProperty("sections").GetProperty("hero").GetProperty("heroImage").GetString();
        var updatedAboutUrl = pubBody3.GetProperty("sections").GetProperty("about").GetProperty("primaryImage").GetString();
        Assert.Contains(imageBId!, updatedHeroUrl!);
        Assert.Contains(imageCId!, updatedAboutUrl!); // Unrelated slot remains untouched!

        // 10. Verify Image A was demoted: isActiveWebsiteUsage = false, status = Approved
        var demotedAResp = await client.GetAsync($"/api/v1/website/images/{imageAId}");
        var demotedABody = await demotedAResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(demotedABody.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());
        Assert.Equal("Approved", demotedABody.GetProperty("data").GetProperty("status").GetString());

        // 11. Verify Image B is active: isActiveWebsiteUsage = true, status = Published
        var activeBResp = await client.GetAsync($"/api/v1/website/images/{imageBId}");
        var activeBBody = await activeBResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(activeBBody.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());
        Assert.Equal("Published", activeBBody.GetProperty("data").GetProperty("status").GetString());
    }

    private static string ComputeSha256(byte[] data)
    {
        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(data);
        return Convert.ToHexString(hash);
    }

    [Fact]
    public async Task Lifecycle_CompleteE2E_UploadEnhanceReviewApprovePublishVerifyDeliveryAndReplace_WithOriginalImmutability()
    {
        var email = $"lifecycle_e2e_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Immutability & Lifecycle Studio", email);
        var publicClient = _factory.CreateClient();

        // 1. Upload original photograph (JPEG)
        var originalJpegBytes = CreateValidJpegBytes();
        var originalSha256 = ComputeSha256(originalJpegBytes);

        var form = CreateImageMultipartContent(originalJpegBytes, "original_kitchen_photo.jpg", "image/jpeg", "WebsiteImage", "heroImage");
        var uploadResp = await client.PostAsync("/api/v1/website/images", form);
        Assert.Equal(HttpStatusCode.Created, uploadResp.StatusCode);

        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();
        Assert.NotNull(imageId);

        // 2. Verify initial state: Cleanly validated, Status is Approved, not yet Published
        Assert.Equal("heroImage", uploadBody.GetProperty("data").GetProperty("slot").GetString());
        Assert.Equal("Approved", uploadBody.GetProperty("data").GetProperty("status").GetString());
        Assert.NotEqual("Published", uploadBody.GetProperty("data").GetProperty("status").GetString());

        // 3. Verify public visitor CANNOT access unpublished image file
        var pubFileUnpublished = await publicClient.GetAsync($"/api/v1/website/images/{imageId}/file");
        Assert.Equal(HttpStatusCode.NotFound, pubFileUnpublished.StatusCode);

        // 4. Verify public website payload does NOT render unpublished image
        var initialWebsiteContent = await client.GetAsync("/api/v1/website/published-content");
        var initialContentBody = await initialWebsiteContent.Content.ReadFromJsonAsync<JsonElement>();
        var heroImageInContent = initialContentBody.GetProperty("sections").GetProperty("hero").TryGetProperty("heroImage", out var initialHeroProp)
            ? initialHeroProp.GetString()
            : null;
        Assert.True(string.IsNullOrEmpty(heroImageInContent) || !heroImageInContent.Contains(imageId!));

        // 5. Enhance using single primary action "EnhanceForWebsite" (default operation)
        var enhanceResp1 = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/enhance", new EnhanceImageRequest { Operation = "EnhanceForWebsite" });
        Assert.Equal(HttpStatusCode.Created, enhanceResp1.StatusCode);

        var enhanceBody1 = await enhanceResp1.Content.ReadFromJsonAsync<JsonElement>();
        var candidateVariant1Id = enhanceBody1.GetProperty("data").GetProperty("id").GetString();
        Assert.NotNull(candidateVariant1Id);
        Assert.Equal("Enhanced", enhanceBody1.GetProperty("data").GetProperty("status").GetString());

        // 6. Verify public visitor CANNOT access candidate variant file
        var pubVariantCandidate = await publicClient.GetAsync($"/api/v1/website/images/{imageId}/file?variantId={candidateVariant1Id}");
        Assert.Equal(HttpStatusCode.NotFound, pubVariantCandidate.StatusCode);

        // 7. Verify original file bytes downloaded by tenant remain bit-for-bit identical to uploaded bytes
        var origDownloadResp1 = await client.GetAsync($"/api/v1/website/images/{imageId}/file");
        Assert.Equal(HttpStatusCode.OK, origDownloadResp1.StatusCode);
        var origBytes1 = await origDownloadResp1.Content.ReadAsByteArrayAsync();
        Assert.Equal(originalSha256, ComputeSha256(origBytes1));

        // 8. Test Candidate Discard / Reject: User rejects the candidate
        var rejectResp = await client.PostAsync($"/api/v1/website/images/{imageId}/variants/{candidateVariant1Id}/reject", null);
        Assert.Equal(HttpStatusCode.OK, rejectResp.StatusCode);

        // Verify variant is now Rejected
        var rejectedImgResp = await client.GetAsync($"/api/v1/website/images/{imageId}");
        var rejectedImgBody = await rejectedImgResp.Content.ReadFromJsonAsync<JsonElement>();
        var variants = rejectedImgBody.GetProperty("data").GetProperty("variants").EnumerateArray().ToList();
        var rejectedVar = variants.FirstOrDefault(v => v.GetProperty("id").GetString() == candidateVariant1Id);
        Assert.True(rejectedVar.ValueKind == JsonValueKind.Object);
        Assert.Equal("Rejected", rejectedVar.GetProperty("status").GetString());

        // 9. Original image bytes STILL bit-for-bit identical after rejection
        var origDownloadResp2 = await client.GetAsync($"/api/v1/website/images/{imageId}/file");
        var origBytes2 = await origDownloadResp2.Content.ReadAsByteArrayAsync();
        Assert.Equal(originalSha256, ComputeSha256(origBytes2));

        // 10. Re-enhance to produce an approved candidate
        var enhanceResp2 = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/enhance", new EnhanceImageRequest { Operation = "EnhanceForWebsite" });
        Assert.Equal(HttpStatusCode.Created, enhanceResp2.StatusCode);
        var enhanceBody2 = await enhanceResp2.Content.ReadFromJsonAsync<JsonElement>();
        var candidateVariant2Id = enhanceBody2.GetProperty("data").GetProperty("id").GetString();
        Assert.NotNull(candidateVariant2Id);
        Assert.NotEqual(candidateVariant1Id, candidateVariant2Id);

        // 11. Approve candidate variant 2
        var approveResp = await client.PostAsync($"/api/v1/website/images/{imageId}/variants/{candidateVariant2Id}/approve", null);
        Assert.Equal(HttpStatusCode.OK, approveResp.StatusCode);

        // 12. Verification: Approval DOES NOT auto-publish! Public site still must not render it
        var prePublishWebsiteContent = await client.GetAsync("/api/v1/website/published-content");
        var prePublishContentBody = await prePublishWebsiteContent.Content.ReadFromJsonAsync<JsonElement>();
        var preHeroUrl = prePublishContentBody.GetProperty("sections").GetProperty("hero").TryGetProperty("heroImage", out var preHeroProp)
            ? preHeroProp.GetString()
            : null;
        Assert.True(string.IsNullOrEmpty(preHeroUrl) || !preHeroUrl.Contains(candidateVariant2Id!));

        // 13. Explicitly Publish approved variant 2
        var pubReq = new PublishImageRequest { VariantId = Guid.Parse(candidateVariant2Id!) };
        var publishResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", pubReq);
        Assert.Equal(HttpStatusCode.OK, publishResp.StatusCode);

        // 14. Verification: Public website payload now serves variant 2
        var postPublishWebsiteContent = await client.GetAsync("/api/v1/website/published-content");
        var postPublishContentBody = await postPublishWebsiteContent.Content.ReadFromJsonAsync<JsonElement>();
        var postHeroUrl = postPublishContentBody.GetProperty("sections").GetProperty("hero").GetProperty("heroImage").GetString();
        Assert.NotNull(postHeroUrl);
        Assert.Contains(candidateVariant2Id!, postHeroUrl);

        // 15. Verification: Public visitor CAN now retrieve the published variant
        var pubFilePublished = await publicClient.GetAsync($"/api/v1/website/images/{imageId}/file?variantId={candidateVariant2Id}");
        Assert.Equal(HttpStatusCode.OK, pubFilePublished.StatusCode);
        Assert.Equal("image/webp", pubFilePublished.Content.Headers.ContentType?.MediaType);

        // 16. Verification: Original image file in tenant repository STILL has the exact original SHA-256 hash!
        var origDownloadResp3 = await client.GetAsync($"/api/v1/website/images/{imageId}/file");
        var origBytes3 = await origDownloadResp3.Content.ReadAsByteArrayAsync();
        Assert.Equal(originalSha256, ComputeSha256(origBytes3));

        // 17. Replace Image: Upload a replacement photograph (Image B)
        var replacementPngBytes = CreateValidPngBytes();
        var replForm = CreateImageMultipartContent(replacementPngBytes, "hero_replacement.png", "image/png");
        var replaceResp = await client.PostAsync($"/api/v1/website/images/{imageId}/replace", replForm);
        Assert.Equal(HttpStatusCode.OK, replaceResp.StatusCode);

        var replaceBody = await replaceResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageBId = replaceBody.GetProperty("data").GetProperty("id").GetString();
        Assert.NotNull(imageBId);

        // Image B is assigned to heroImage, status is Approved, but NOT active yet
        Assert.Equal("heroImage", replaceBody.GetProperty("data").GetProperty("slot").GetString());
        Assert.False(replaceBody.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());

        // 18. Verification: Original Image A is STILL live and serving on public site until replacement is published
        var duringReplContent = await client.GetAsync("/api/v1/website/published-content");
        var duringReplBody = await duringReplContent.Content.ReadFromJsonAsync<JsonElement>();
        var liveHeroDuringRepl = duringReplBody.GetProperty("sections").GetProperty("hero").GetProperty("heroImage").GetString();
        Assert.Contains(candidateVariant2Id!, liveHeroDuringRepl);

        // 19. Explicitly Publish replacement Image B
        var pubRespB = await client.PostAsJsonAsync($"/api/v1/website/images/{imageBId}/publish", new PublishImageRequest());
        Assert.Equal(HttpStatusCode.OK, pubRespB.StatusCode);

        // 20. Verification: Public website now seamlessly delivers Image B
        var afterReplContent = await client.GetAsync("/api/v1/website/published-content");
        var afterReplBody = await afterReplContent.Content.ReadFromJsonAsync<JsonElement>();
        var liveHeroAfterRepl = afterReplBody.GetProperty("sections").GetProperty("hero").GetProperty("heroImage").GetString();
        Assert.Contains(imageBId!, liveHeroAfterRepl);

        // 21. Verification: Image A was demoted cleanly, and its original bytes remain 100% immutable
        var origDownloadResp4 = await client.GetAsync($"/api/v1/website/images/{imageId}/file");
        var origBytes4 = await origDownloadResp4.Content.ReadAsByteArrayAsync();
        Assert.Equal(originalSha256, ComputeSha256(origBytes4));

        // 22. Safe Removal: Remove Image B from website usage
        var removeResp = await client.DeleteAsync($"/api/v1/website/images/{imageBId}");
        Assert.Equal(HttpStatusCode.OK, removeResp.StatusCode);

        // Public website has slot cleared
        var afterRemoveContent = await client.GetAsync("/api/v1/website/published-content");
        var afterRemoveBody = await afterRemoveContent.Content.ReadFromJsonAsync<JsonElement>();
        var heroAfterRemove = afterRemoveBody.GetProperty("sections").GetProperty("hero").TryGetProperty("heroImage", out var p) ? p.GetString() : null;
        Assert.True(string.IsNullOrEmpty(heroAfterRemove));

        // Image B is still preserved in library with status "Unused"
        var imgBCheck = await client.GetAsync($"/api/v1/website/images/{imageBId}");
        var imgBBody = await imgBCheck.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Unused", imgBBody.GetProperty("data").GetProperty("status").GetString());
        Assert.False(imgBBody.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());
    }

    [Fact]
    public async Task Lifecycle_SecurityAndTenantIsolation_AllEndpointsStrictlyEnforced()
    {
        // Setup Tenant A
        var emailA = $"iso_a_{Guid.NewGuid():N}@test.local";
        var clientA = await GetAuthenticatedClientAsync(emailA);
        await SetupAndConfirmBusinessContextAsync(clientA, "Tenant A Architecture", emailA);

        var formA = CreateImageMultipartContent(CreateValidJpegBytes(), "estate.jpg", "image/jpeg", "WebsiteImage", "heroImage");
        var uploadA = await clientA.PostAsync("/api/v1/website/images", formA);
        var bodyA = await uploadA.Content.ReadFromJsonAsync<JsonElement>();
        var imageIdA = bodyA.GetProperty("data").GetProperty("id").GetString();

        // Enhance image for Tenant A
        var enhanceRespA = await clientA.PostAsJsonAsync($"/api/v1/website/images/{imageIdA}/enhance", new EnhanceImageRequest { Operation = "EnhanceForWebsite" });
        var enhanceBodyA = await enhanceRespA.Content.ReadFromJsonAsync<JsonElement>();
        var variantIdA = enhanceBodyA.GetProperty("data").GetProperty("id").GetString();

        // Setup Tenant B
        var emailB = $"iso_b_{Guid.NewGuid():N}@test.local";
        var clientB = await GetAuthenticatedClientAsync(emailB);
        await SetupAndConfirmBusinessContextAsync(clientB, "Tenant B Construction", emailB);

        // Tenant B attempts unauthorized operations against Tenant A's image & variant:
        // 1. GET Image Metadata
        var r1 = await clientB.GetAsync($"/api/v1/website/images/{imageIdA}");
        Assert.Equal(HttpStatusCode.NotFound, r1.StatusCode);

        // 2. GET Image Original File Stream
        var r2 = await clientB.GetAsync($"/api/v1/website/images/{imageIdA}/file");
        Assert.Equal(HttpStatusCode.NotFound, r2.StatusCode);

        // 3. GET Image Preview (authenticated)
        var r3 = await clientB.GetAsync($"/api/v1/website/images/{imageIdA}/preview");
        Assert.Equal(HttpStatusCode.NotFound, r3.StatusCode);

        // 4. POST Enhance Tenant A's image
        var r4 = await clientB.PostAsJsonAsync($"/api/v1/website/images/{imageIdA}/enhance", new EnhanceImageRequest { Operation = "EnhanceForWebsite" });
        Assert.Equal(HttpStatusCode.NotFound, r4.StatusCode);

        // 5. POST Approve Variant
        var r5 = await clientB.PostAsync($"/api/v1/website/images/{imageIdA}/variants/{variantIdA}/approve", null);
        Assert.Equal(HttpStatusCode.NotFound, r5.StatusCode);

        // 6. POST Reject Variant
        var r6 = await clientB.PostAsync($"/api/v1/website/images/{imageIdA}/variants/{variantIdA}/reject", null);
        Assert.Equal(HttpStatusCode.NotFound, r6.StatusCode);

        // 7. POST Publish Image
        var r7 = await clientB.PostAsJsonAsync($"/api/v1/website/images/{imageIdA}/publish", new PublishImageRequest { VariantId = Guid.Parse(variantIdA!) });
        Assert.Equal(HttpStatusCode.NotFound, r7.StatusCode);

        // 8. POST Unpublish Image
        var r8 = await clientB.PostAsync($"/api/v1/website/images/{imageIdA}/unpublish", null);
        Assert.Equal(HttpStatusCode.NotFound, r8.StatusCode);

        // 9. POST Replace Image
        var r9 = await clientB.PostAsync($"/api/v1/website/images/{imageIdA}/replace", CreateImageMultipartContent(CreateValidPngBytes(), "hack.png", "image/png"));
        Assert.Equal(HttpStatusCode.NotFound, r9.StatusCode);

        // 10. DELETE Remove Image
        var r10 = await clientB.DeleteAsync($"/api/v1/website/images/{imageIdA}");
        Assert.Equal(HttpStatusCode.NotFound, r10.StatusCode);
    }

    [Fact]
    public async Task PublicWebsiteDelivery_DraftOrUnapprovedImages_NeverExposedToPublicRoutes()
    {
        var email = $"public_guard_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Public Guard Design Co", email);
        var publicClient = _factory.CreateClient();

        // Upload image
        var form = CreateImageMultipartContent(CreateValidJpegBytes(), "draft_dining.jpg", "image/jpeg", "WebsiteImage", "heroImage");
        var uploadResp = await client.PostAsync("/api/v1/website/images", form);
        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();

        // 1. Unapproved/Draft original: public file returns 404
        var pub1 = await publicClient.GetAsync($"/api/v1/website/images/{imageId}/file");
        Assert.Equal(HttpStatusCode.NotFound, pub1.StatusCode);

        // 2. Generate candidate variant
        var enhanceResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/enhance", new EnhanceImageRequest { Operation = "EnhanceForWebsite" });
        var enhanceBody = await enhanceResp.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = enhanceBody.GetProperty("data").GetProperty("id").GetString();

        // Candidate variant: public file returns 404
        var pub2 = await publicClient.GetAsync($"/api/v1/website/images/{imageId}/file?variantId={variantId}");
        Assert.Equal(HttpStatusCode.NotFound, pub2.StatusCode);

        // 3. Approve candidate variant (without publishing)
        await client.PostAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/approve", null);

        // Approved variant: public file STILL returns 404
        var pub3 = await publicClient.GetAsync($"/api/v1/website/images/{imageId}/file?variantId={variantId}");
        Assert.Equal(HttpStatusCode.NotFound, pub3.StatusCode);

        // 4. Publish image
        await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest { VariantId = Guid.Parse(variantId!) });

        // Published variant: public file now returns 200 OK
        var pub4 = await publicClient.GetAsync($"/api/v1/website/images/{imageId}/file?variantId={variantId}");
        Assert.Equal(HttpStatusCode.OK, pub4.StatusCode);

        // 5. Unpublish image
        await client.PostAsync($"/api/v1/website/images/{imageId}/unpublish", null);

        // Unpublished variant: public file immediately returns 404 again
        var pub5 = await publicClient.GetAsync($"/api/v1/website/images/{imageId}/file?variantId={variantId}");
        Assert.Equal(HttpStatusCode.NotFound, pub5.StatusCode);
    }
}
