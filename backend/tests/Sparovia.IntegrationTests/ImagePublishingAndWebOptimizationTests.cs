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

public class ImagePublishingAndWebOptimizationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ImagePublishingAndWebOptimizationTests(WebApplicationFactory<Program> factory)
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
            0x00, 0x00, 0x03, 0x20, // 800 width
            0x00, 0x00, 0x02, 0x58, // 600 height
            0x08, 0x02, 0x00, 0x00, 0x00,
            0x4D, 0xB4, 0x2C, 0x6B
        };
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient();

        var regReq = new RegisterRequest
        {
            FullName = "Web Optimization Tester",
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

        var svc = new ServiceDto { ServiceName = "Interior Architecture", ServiceDescription = "Premium architectural interiors" };
        var r3 = await client.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        r3.EnsureSuccessStatusCode();

        var rConfirm = await client.PostAsync("/api/v1/onboarding/confirm", null);
        rConfirm.EnsureSuccessStatusCode();
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
    public async Task WebOptimization_CreatesDerivedVariant_OriginalRemainsUntouched()
    {
        var email = $"opt_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Optimization Studios", email);

        // Upload original image
        var uploadContent = CreateUploadContent(CreateValidJpegBytes(), "hero_original.jpg", "image/jpeg", "WebsiteImage", "hero");
        var uploadRes = await client.PostAsync("/api/v1/website/images", uploadContent);
        Assert.Equal(HttpStatusCode.Created, uploadRes.StatusCode);
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // Trigger web optimization
        var optReq = new { TargetFormat = "webp", MaxWidth = 1200 };
        var optRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/optimize", optReq);
        Assert.Equal(HttpStatusCode.Created, optRes.StatusCode);

        var optJson = await optRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantData = optJson.GetProperty("data");
        Assert.Equal("WebsiteOptimized", variantData.GetProperty("variantType").GetString());
        Assert.Equal("image/webp", variantData.GetProperty("mimeType").GetString());
        Assert.Equal("Approved", variantData.GetProperty("status").GetString());
        var variantId = variantData.GetProperty("id").GetString()!;

        // Verify in database: Original asset is untouched
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        var imageInDb = await db.Images.Include(i => i.Variants).FirstAsync(i => i.Id == Guid.Parse(imageId));

        Assert.Equal("image/jpeg", imageInDb.MimeType);
        Assert.Equal("hero_original.jpg", imageInDb.OriginalFileName);
        Assert.Single(imageInDb.Variants);

        var dbVariant = imageInDb.Variants.First();
        Assert.Equal(Guid.Parse(variantId), dbVariant.Id);
        Assert.Equal("WebsiteOptimized", dbVariant.VariantType);
        Assert.Equal("image/webp", dbVariant.MimeType);
    }

    [Fact]
    public async Task Publishing_UnapprovedVariant_IsRejected_WithVariantNotApproved()
    {
        var email = $"unapp_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Variant Approval Co", email);

        var uploadContent = CreateUploadContent(CreateValidPngBytes(), "about_orig.png", "image/png", "WebsiteImage", "primaryImage");
        var uploadRes = await client.PostAsync("/api/v1/website/images", uploadContent);
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // Approve the parent image
        var appRes = await client.PostAsync($"/api/v1/website/images/{imageId}/approve", null);
        Assert.Equal(HttpStatusCode.OK, appRes.StatusCode);

        // Create an optimized variant
        var optRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/optimize", new { TargetFormat = "webp" });
        var optJson = await optRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = optJson.GetProperty("data").GetProperty("id").GetString()!;

        // Reject the variant
        var reviewRes = await client.PostAsJsonAsync(
            $"/api/v1/website/images/{imageId}/variants/{variantId}/review",
            new { IsApproved = false, Reason = "Needs higher resolution" });
        Assert.Equal(HttpStatusCode.OK, reviewRes.StatusCode);

        // Attempt to publish rejected variant -> Must fail with VARIANT_NOT_APPROVED
        var pubRes = await client.PostAsJsonAsync(
            $"/api/v1/website/images/{imageId}/publish",
            new { VariantId = Guid.Parse(variantId) });

        Assert.Equal(HttpStatusCode.BadRequest, pubRes.StatusCode);
        var errJson = await pubRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("VARIANT_NOT_APPROVED", errJson.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Publishing_ApprovedOptimizedVariant_Succeeds_AndSyncsToPublicWebsite()
    {
        var email = $"pubopt_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Live Web Studio", email);

        // 1. Upload
        var uploadContent = CreateUploadContent(CreateValidPngBytes(), "banner.png", "image/png", "WebsiteImage", "hero");
        var uploadRes = await client.PostAsync("/api/v1/website/images", uploadContent);
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // 2. Approve image
        await client.PostAsync($"/api/v1/website/images/{imageId}/approve", null);

        // 3. Optimize image
        var optRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/optimize", new { TargetFormat = "webp", MaxWidth = 1000 });
        var optJson = await optRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = optJson.GetProperty("data").GetProperty("id").GetString()!;

        // 4. Publish optimized variant
        var pubRes = await client.PostAsJsonAsync(
            $"/api/v1/website/images/{imageId}/publish",
            new { VariantId = Guid.Parse(variantId) });
        Assert.Equal(HttpStatusCode.OK, pubRes.StatusCode);

        // 5. Verify published variant delivers web-optimized webp file
        var anonymousClient = _factory.CreateClient();
        var variantDeliveryRes = await anonymousClient.GetAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/file");
        Assert.Equal(HttpStatusCode.OK, variantDeliveryRes.StatusCode);
        Assert.Equal("image/webp", variantDeliveryRes.Content.Headers.ContentType?.MediaType);

        // 6. Verify base public file delivery defaults to the published optimized variant
        var publicFileRes = await anonymousClient.GetAsync($"/api/v1/website/images/{imageId}/file");
        Assert.Equal(HttpStatusCode.OK, publicFileRes.StatusCode);
        Assert.Equal("image/webp", publicFileRes.Content.Headers.ContentType?.MediaType);

        // 7. Verify website public content section references the published variant URL
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
        var user = await db.Users.FirstAsync(u => u.Email == email);
        var membership = await db.Memberships.FirstAsync(m => m.UserId == user.Id);
        var website = await db.Websites.FirstAsync(w => w.TenantId == membership.TenantId);
        var heroContent = await db.WebsiteContents.FirstAsync(c => c.WebsiteId == website.Id && c.SectionKey == "hero");
        Assert.Contains($"/api/v1/website/images/{imageId}/variants/{variantId}/file", heroContent.PublishedContentJson);
    }

    [Fact]
    public async Task CrossTenant_OptimizationAndPublishing_IsStrictlyIsolated()
    {
        var emailA = $"tenantA_{Guid.NewGuid():N}@sparovia.com";
        var clientA = await GetAuthenticatedClientAsync(emailA);
        await SetupAndConfirmBusinessContextAsync(clientA, "Tenant A Architecture", emailA);

        var emailB = $"tenantB_{Guid.NewGuid():N}@sparovia.com";
        var clientB = await GetAuthenticatedClientAsync(emailB);
        await SetupAndConfirmBusinessContextAsync(clientB, "Tenant B Architecture", emailB);

        // Tenant A uploads image
        var uploadContent = CreateUploadContent(CreateValidJpegBytes(), "tenanta.jpg", "image/jpeg", "WebsiteImage", "hero");
        var uploadRes = await clientA.PostAsync("/api/v1/website/images", uploadContent);
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageIdA = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // Tenant B attempts to optimize Tenant A's image -> NotFound
        var crossOptRes = await clientB.PostAsJsonAsync($"/api/v1/website/images/{imageIdA}/optimize", new { TargetFormat = "webp" });
        Assert.Equal(HttpStatusCode.NotFound, crossOptRes.StatusCode);

        // Tenant B attempts to publish Tenant A's image -> NotFound
        var crossPubRes = await clientB.PostAsJsonAsync($"/api/v1/website/images/{imageIdA}/publish", new { });
        Assert.Equal(HttpStatusCode.NotFound, crossPubRes.StatusCode);

        // Tenant A optimizes their own image
        var optRes = await clientA.PostAsJsonAsync($"/api/v1/website/images/{imageIdA}/optimize", new { TargetFormat = "webp" });
        var optJson = await optRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantIdA = optJson.GetProperty("data").GetProperty("id").GetString()!;

        // Tenant B attempts to review Tenant A's variant -> NotFound
        var crossReviewRes = await clientB.PostAsJsonAsync(
            $"/api/v1/website/images/{imageIdA}/variants/{variantIdA}/review",
            new { IsApproved = true });
        Assert.Equal(HttpStatusCode.NotFound, crossReviewRes.StatusCode);
    }

    [Fact]
    public async Task UnapprovedParentImage_CannotBePublished_EvenWithApprovedVariant()
    {
        var email = $"unapp_parent_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Parent Approval Co", email);

        // Upload image (Status: Uploaded / not Approved)
        var uploadContent = CreateUploadContent(CreateValidJpegBytes(), "draft_hero.jpg", "image/jpeg", "WebsiteImage", "hero");
        var uploadRes = await client.PostAsync("/api/v1/website/images", uploadContent);
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // Reject parent image so status is "Rejected" (unapproved)
        var rejRes = await client.PostAsync($"/api/v1/website/images/{imageId}/reject", null);
        Assert.Equal(HttpStatusCode.OK, rejRes.StatusCode);

        // Create optimized variant
        var optRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/optimize", new { TargetFormat = "webp" });
        var optJson = await optRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = optJson.GetProperty("data").GetProperty("id").GetString()!;

        // Attempt publish while parent image is unapproved/rejected -> IMAGE_NOT_APPROVED
        var pubRes = await client.PostAsJsonAsync(
            $"/api/v1/website/images/{imageId}/publish",
            new { VariantId = Guid.Parse(variantId) });

        Assert.Equal(HttpStatusCode.BadRequest, pubRes.StatusCode);
        var errJson = await pubRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("IMAGE_NOT_APPROVED", errJson.GetProperty("code").GetString());
    }
}
