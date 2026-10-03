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

public class ImageVariantLifecycleTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ImageVariantLifecycleTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private static byte[] CreateValidJpegBytes(int width = 1920, int height = 1080)
    {
        var hHigh = (byte)((height >> 8) & 0xFF);
        var hLow = (byte)(height & 0xFF);
        var wHigh = (byte)((width >> 8) & 0xFF);
        var wLow = (byte)(width & 0xFF);

        return new byte[]
        {
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
            0xFF, 0xC0, 0x00, 0x11, 0x08, hHigh, hLow, wHigh, wLow, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
            0xFF, 0xD9
        };
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient();

        var regReq = new RegisterRequest
        {
            FullName = "Lifecycle Tester",
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
            AddressLine1 = "500 Artisan Ave",
            City = "Design City",
            State = "CA",
            PostalCode = "94016",
            Country = "United States",
            ServiceAreas = new List<string> { "Greater Metro" }
        };
        var r2 = await client.PutAsJsonAsync("/api/v1/onboarding/location-customers", location);
        r2.EnsureSuccessStatusCode();

        var svc = new ServiceDto { ServiceName = "Bespoke Joinery", ServiceDescription = "Handcrafted woodwork" };
        var r3 = await client.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        r3.EnsureSuccessStatusCode();

        var confirmResp = await client.PostAsync("/api/v1/onboarding/confirm", null);
        confirmResp.EnsureSuccessStatusCode();
    }

    private static MultipartFormDataContent CreateImageMultipartContent(byte[] imageBytes, string fileName, string contentType, string? usageType = null, string? slot = null)
    {
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(imageBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(fileContent, "file", fileName);

        if (!string.IsNullOrWhiteSpace(usageType))
            content.Add(new StringContent(usageType), "usageType");
        if (!string.IsNullOrWhiteSpace(slot))
            content.Add(new StringContent(slot), "slot");

        return content;
    }

    private async Task SetupConnectedAiConfigAsync(string email)
    {
        using var scope = _factory.Services.CreateScope();
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

    [Fact]
    public async Task OriginalImmutability_OriginalBinaryAndRecordRemainUnchangedAfterEnhancementAndOptimization()
    {
        var email = $"lifecycle_immut_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Immutability Studio", email);
        await SetupConnectedAiConfigAsync(email);

        // 1. Upload original image
        var originalJpegBytes = CreateValidJpegBytes(1920, 1080);
        var form = CreateImageMultipartContent(originalJpegBytes, "original_hero.jpg", "image/jpeg", "WebsiteImage", "heroImage");
        var uploadResp = await client.PostAsync("/api/v1/website/images", form);
        Assert.Equal(HttpStatusCode.Created, uploadResp.StatusCode);

        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();
        var originalStorageKey = string.Empty;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var img = await db.Images.FindAsync(Guid.Parse(imageId!));
            Assert.NotNull(img);
            originalStorageKey = img.StorageKey;
            Assert.Contains("/original_", originalStorageKey);
        }

        // 2. Perform AI Enhancement (creates AIEnhanced variant)
        var enhanceReq = new EnhanceImageRequest { Operation = "ImproveClarity" };
        var enhanceResp = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", enhanceReq);
        Assert.Equal(HttpStatusCode.Accepted, enhanceResp.StatusCode);
        var enhanceBody = await enhanceResp.Content.ReadFromJsonAsync<JsonElement>();
        var aiVariantId = enhanceBody.GetProperty("data").GetProperty("variantId").GetString();

        // 3. Perform Website Optimization (creates WebsiteOptimized variant)
        var optReq = new OptimizeImageRequest { MaxWidth = 1200, TargetFormat = "webp" };
        var optResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/optimize", optReq);
        Assert.Equal(HttpStatusCode.Created, optResp.StatusCode);

        // 4. Verify original image entity and storage key are completely untouched
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var imgAfter = await db.Images.Include(i => i.Variants).FirstAsync(i => i.Id == Guid.Parse(imageId!));
            Assert.Equal(originalStorageKey, imgAfter.StorageKey);
            Assert.Equal(1920, imgAfter.Width);
            Assert.Equal(1080, imgAfter.Height);
            Assert.Equal("image/jpeg", imgAfter.MimeType);
            Assert.Equal("original_hero.jpg", imgAfter.OriginalFileName);
            // 2 separate derived variants exist
            Assert.Equal(2, imgAfter.Variants.Count);

            var aiVar = imgAfter.Variants.Single(v => v.VariantType == "AIEnhanced");
            Assert.NotEqual(imgAfter.StorageKey, aiVar.StorageKey);
            Assert.Contains("/variants/", aiVar.StorageKey);

            var optVar = imgAfter.Variants.Single(v => v.VariantType == "WebsiteOptimized");
            Assert.NotEqual(imgAfter.StorageKey, optVar.StorageKey);
            Assert.NotEqual(aiVar.StorageKey, optVar.StorageKey);
            Assert.Equal(1200, optVar.Width);
            Assert.Equal("image/webp", optVar.MimeType);
        }

        // 5. Verify original binary can still be downloaded intact
        var origFileResp = await client.GetAsync($"/api/v1/website/images/{imageId}/file");
        Assert.Equal(HttpStatusCode.OK, origFileResp.StatusCode);
        var downloadedBytes = await origFileResp.Content.ReadAsByteArrayAsync();
        Assert.Equal(originalJpegBytes.Length, downloadedBytes.Length);
    }

    [Fact]
    public async Task VariantReview_RejectVariant_LeavesOriginalIntact()
    {
        var email = $"review_reject_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Review Rejection Studio", email);
        await SetupConnectedAiConfigAsync(email);

        // Upload and publish original
        var form = CreateImageMultipartContent(CreateValidJpegBytes(), "kitchen.jpg", "image/jpeg", "WebsiteImage", "heroImage");
        var uploadResp = await client.PostAsync("/api/v1/website/images", form);
        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();

        await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest());

        // Create AI Variant
        var enhanceResp = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new EnhanceImageRequest { Operation = "ReduceNoise" });
        var enhanceBody = await enhanceResp.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = enhanceBody.GetProperty("data").GetProperty("variantId").GetString();

        // Reject Variant via Review endpoint
        var reviewReq = new ReviewImageVariantRequest { IsApproved = false, Reason = "Too sharp for brand aesthetic" };
        var reviewResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/review", reviewReq);
        Assert.Equal(HttpStatusCode.OK, reviewResp.StatusCode);

        // Verify Variant is Rejected
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var variant = await db.ImageVariants.FindAsync(Guid.Parse(variantId!));
            Assert.NotNull(variant);
            Assert.Equal("Rejected", variant.Status);

            // Original image is still Published and active
            var img = await db.Images.FindAsync(Guid.Parse(imageId!));
            Assert.NotNull(img);
            Assert.Equal("Published", img.Status);
            Assert.True(img.IsActiveWebsiteUsage);
        }
    }

    [Fact]
    public async Task VariantReview_ApproveVariant_DoesNotAutomaticallyPublishToWebsite()
    {
        var email = $"approve_no_pub_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Approval Studio", email);
        await SetupConnectedAiConfigAsync(email);

        var form = CreateImageMultipartContent(CreateValidJpegBytes(), "living.jpg", "image/jpeg", "WebsiteImage", "heroImage");
        var uploadResp = await client.PostAsync("/api/v1/website/images", form);
        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();

        // Create AI variant
        var enhanceResp = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new EnhanceImageRequest { Operation = "ImproveClarity" });
        var enhanceBody = await enhanceResp.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = enhanceBody.GetProperty("data").GetProperty("variantId").GetString();

        // Approve variant
        var reviewReq = new ReviewImageVariantRequest { IsApproved = true };
        var reviewResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/review", reviewReq);
        Assert.Equal(HttpStatusCode.OK, reviewResp.StatusCode);

        // Verify Variant is Approved, but NOT Published!
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var variant = await db.ImageVariants.FindAsync(Guid.Parse(variantId!));
            Assert.NotNull(variant);
            Assert.Equal("Approved", variant.Status);

            // WebsiteContent section draft does NOT yet point to this variant!
            var user = await db.Users.SingleAsync(u => u.Email == email);
            var membership = await db.Memberships.SingleAsync(m => m.UserId == user.Id);
            var website = await db.Websites.FirstAsync(w => w.TenantId == membership.TenantId);
            var content = await db.WebsiteContents.FirstOrDefaultAsync(c => c.WebsiteId == website.Id && c.SectionKey == "hero");
            if (content != null)
            {
                Assert.DoesNotContain(variantId!, content.DraftContentJson);
            }
        }

        // Now explicitly publish
        var pubResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest { VariantId = Guid.Parse(variantId!) });
        Assert.Equal(HttpStatusCode.OK, pubResp.StatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var user = await db.Users.SingleAsync(u => u.Email == email);
            var membership = await db.Memberships.SingleAsync(m => m.UserId == user.Id);
            var variant = await db.ImageVariants.FindAsync(Guid.Parse(variantId!));
            Assert.NotNull(variant);
            Assert.Equal("Published", variant.Status);

            // Now website content section draft points to the published variant
            var website = await db.Websites.FirstAsync(w => w.TenantId == membership.TenantId);
            var content = await db.WebsiteContents.FirstAsync(c => c.WebsiteId == website.Id && c.SectionKey == "hero");
            Assert.Contains(variantId!, content.DraftContentJson);
        }
    }

    [Fact]
    public async Task ParentVariant_CrossTenantOrCrossImage_IsRejected()
    {
        // Tenant A creates an image and variant
        var emailA = $"tenant_a_parent_{Guid.NewGuid():N}@test.local";
        var clientA = await GetAuthenticatedClientAsync(emailA);
        await SetupAndConfirmBusinessContextAsync(clientA, "Tenant A Studio", emailA);
        await SetupConnectedAiConfigAsync(emailA);

        var formA = CreateImageMultipartContent(CreateValidJpegBytes(), "site_a.jpg", "image/jpeg");
        var uploadRespA = await clientA.PostAsync("/api/v1/website/images", formA);
        var bodyA = await uploadRespA.Content.ReadFromJsonAsync<JsonElement>();
        var imageIdA = bodyA.GetProperty("data").GetProperty("id").GetString();

        var enhanceRespA = await clientA.PostAsJsonAsync($"/api/v1/ai/images/{imageIdA}/enhance", new EnhanceImageRequest { Operation = "ImproveClarity" });
        var enhanceBodyA = await enhanceRespA.Content.ReadFromJsonAsync<JsonElement>();
        var variantIdA = enhanceBodyA.GetProperty("data").GetProperty("variantId").GetString();

        // 1. Tenant A uploads a SECOND image, and attempts to use variantIdA as parent variant (cross-image derivation)
        var formA2 = CreateImageMultipartContent(CreateValidJpegBytes(), "site_a2.jpg", "image/jpeg");
        var uploadRespA2 = await clientA.PostAsync("/api/v1/website/images", formA2);
        var bodyA2 = await uploadRespA2.Content.ReadFromJsonAsync<JsonElement>();
        var imageIdA2 = bodyA2.GetProperty("data").GetProperty("id").GetString();

        var crossImageOpt = new OptimizeImageRequest { ParentVariantId = Guid.Parse(variantIdA!) };
        var crossImageResp = await clientA.PostAsJsonAsync($"/api/v1/website/images/{imageIdA2}/optimize", crossImageOpt);
        Assert.Equal(HttpStatusCode.BadRequest, crossImageResp.StatusCode);

        // 2. Tenant B attempts to use Tenant A's variant as parent variant (cross-tenant derivation)
        var emailB = $"tenant_b_parent_{Guid.NewGuid():N}@test.local";
        var clientB = await GetAuthenticatedClientAsync(emailB);
        await SetupAndConfirmBusinessContextAsync(clientB, "Tenant B Studio", emailB);

        var formB = CreateImageMultipartContent(CreateValidJpegBytes(), "site_b.jpg", "image/jpeg");
        var uploadRespB = await clientB.PostAsync("/api/v1/website/images", formB);
        var bodyB = await uploadRespB.Content.ReadFromJsonAsync<JsonElement>();
        var imageIdB = bodyB.GetProperty("data").GetProperty("id").GetString();

        var crossTenantOpt = new OptimizeImageRequest { ParentVariantId = Guid.Parse(variantIdA!) };
        var crossTenantResp = await clientB.PostAsJsonAsync($"/api/v1/website/images/{imageIdB}/optimize", crossTenantOpt);
        Assert.Equal(HttpStatusCode.BadRequest, crossTenantResp.StatusCode);
    }

    [Fact]
    public async Task CrossTenantVariantReviewAndFileStream_IsStrictlyIsolated()
    {
        // Tenant A creates an image and variant
        var emailA = $"tenant_a_var_{Guid.NewGuid():N}@test.local";
        var clientA = await GetAuthenticatedClientAsync(emailA);
        await SetupAndConfirmBusinessContextAsync(clientA, "Tenant A Vars", emailA);
        await SetupConnectedAiConfigAsync(emailA);

        var formA = CreateImageMultipartContent(CreateValidJpegBytes(), "hero_a.jpg", "image/jpeg");
        var uploadRespA = await clientA.PostAsync("/api/v1/website/images", formA);
        var bodyA = await uploadRespA.Content.ReadFromJsonAsync<JsonElement>();
        var imageIdA = bodyA.GetProperty("data").GetProperty("id").GetString();

        var enhanceRespA = await clientA.PostAsJsonAsync($"/api/v1/ai/images/{imageIdA}/enhance", new EnhanceImageRequest { Operation = "ImproveClarity" });
        var enhanceBodyA = await enhanceRespA.Content.ReadFromJsonAsync<JsonElement>();
        var variantIdA = enhanceBodyA.GetProperty("data").GetProperty("variantId").GetString();

        // Tenant B registers
        var emailB = $"tenant_b_var_{Guid.NewGuid():N}@test.local";
        var clientB = await GetAuthenticatedClientAsync(emailB);
        await SetupAndConfirmBusinessContextAsync(clientB, "Tenant B Vars", emailB);

        // Tenant B attempts to review Tenant A's variant
        var reviewResp = await clientB.PostAsJsonAsync($"/api/v1/website/images/{imageIdA}/variants/{variantIdA}/review", new ReviewImageVariantRequest { IsApproved = true });
        Assert.Equal(HttpStatusCode.NotFound, reviewResp.StatusCode);

        // Tenant B attempts to publish Tenant A's variant
        var pubResp = await clientB.PostAsJsonAsync($"/api/v1/website/images/{imageIdA}/publish", new PublishImageRequest { VariantId = Guid.Parse(variantIdA!) });
        Assert.Equal(HttpStatusCode.NotFound, pubResp.StatusCode);

        // Tenant B attempts to stream Tenant A's unpublished variant file
        var fileResp = await clientB.GetAsync($"/api/v1/website/images/{imageIdA}/variants/{variantIdA}/file");
        Assert.Equal(HttpStatusCode.NotFound, fileResp.StatusCode);
    }
}
