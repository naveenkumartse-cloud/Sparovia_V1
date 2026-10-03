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

public class ExploreOurWorkTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ExploreOurWorkTests(WebApplicationFactory<Program> factory)
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
            FullName = "Explore Work Tester",
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

        var svc = new ServiceDto { ServiceName = "Modular Kitchens", ServiceDescription = "Tailored kitchen design" };
        var r3 = await client.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        r3.EnsureSuccessStatusCode();

        var rConfirm = await client.PostAsync("/api/v1/onboarding/confirm", null);
        rConfirm.EnsureSuccessStatusCode();
    }

    private static MultipartFormDataContent CreateExploreOurWorkMultipartContent(
        byte[] fileBytes,
        string fileName,
        string contentType,
        string? projectWorkName = null,
        string? caption = null,
        string? category = null)
    {
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(fileBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(fileContent, "File", fileName);

        if (projectWorkName != null)
        {
            content.Add(new StringContent(projectWorkName), "ProjectWorkName");
        }

        if (category != null)
        {
            content.Add(new StringContent(category), "Category");
        }

        if (caption != null)
        {
            content.Add(new StringContent(caption), "Caption");
        }

        return content;
    }

    [Fact]
    public async Task ExploreOurWork_ValidImageCreation_AcceptedWithMetadataAndPreservedImmutableOriginal()
    {
        var email = $"eow_create_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Prestige Interiors", email);

        var form = CreateExploreOurWorkMultipartContent(
            CreateValidJpegBytes(),
            "luxury_kitchen.jpg",
            "image/jpeg",
            "Bespoke Villa Kitchen",
            "Handcrafted walnut cabinetry with brushed brass hardware.");

        var uploadResp = await client.PostAsync("/api/v1/website/images/explore-our-work", form);
        Assert.Equal(HttpStatusCode.Created, uploadResp.StatusCode);

        var body = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var data = body.GetProperty("data");

        Assert.Equal("ExploreOurWork", data.GetProperty("usageType").GetString());
        Assert.Equal("Bespoke Villa Kitchen", data.GetProperty("projectWorkName").GetString());
        Assert.Equal("Handcrafted walnut cabinetry with brushed brass hardware.", data.GetProperty("caption").GetString());
        Assert.Equal("Approved", data.GetProperty("status").GetString());
        Assert.True(data.GetProperty("isActiveWebsiteUsage").GetBoolean());
        Assert.True(data.GetProperty("width").GetInt32() > 0);
        Assert.True(data.GetProperty("height").GetInt32() > 0);
    }

    [Fact]
    public async Task ExploreOurWork_InvalidFormatAndCorruptPayload_Rejected()
    {
        var email = $"eow_invalid_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Interiors Co", email);

        var corruptBytes = new byte[] { 0x00, 0x01, 0x02, 0x03, 0x04 };
        var form = CreateExploreOurWorkMultipartContent(
            corruptBytes,
            "corrupt.jpg",
            "image/jpeg",
            "Corrupt Work",
            "Testing failure");

        var uploadResp = await client.PostAsync("/api/v1/website/images/explore-our-work", form);
        Assert.Equal(HttpStatusCode.BadRequest, uploadResp.StatusCode);
    }

    [Fact]
    public async Task ExploreOurWork_Metadata_ExcessiveLength_Rejected()
    {
        var email = $"eow_len_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Length Test Studio", email);

        var longName = new string('A', 201);
        var form = CreateExploreOurWorkMultipartContent(
            CreateValidJpegBytes(),
            "test.jpg",
            "image/jpeg",
            longName,
            "Valid caption");

        var resp = await client.PostAsync("/api/v1/website/images/explore-our-work", form);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("INVALID_METADATA", body.GetProperty("code").GetString());
    }

    [Fact]
    public async Task ExploreOurWork_Metadata_UnsafeContent_Rejected()
    {
        var email = $"eow_xss_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Security Studio", email);

        var unsafeName = "<script>alert('pwned')</script>";
        var form = CreateExploreOurWorkMultipartContent(
            CreateValidJpegBytes(),
            "test.jpg",
            "image/jpeg",
            unsafeName,
            "Valid caption");

        var resp = await client.PostAsync("/api/v1/website/images/explore-our-work", form);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("UNSAFE_CONTENT", body.GetProperty("code").GetString());
    }

    [Fact]
    public async Task ExploreOurWork_UpdateMetadata_WorksAndSanitizes()
    {
        var email = $"eow_meta_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Metadata Studio", email);

        var form = CreateExploreOurWorkMultipartContent(
            CreateValidPngBytes(),
            "living.png",
            "image/png",
            "Initial Living Room",
            "Initial notes");

        var uploadResp = await client.PostAsync("/api/v1/website/images/explore-our-work", form);
        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();

        var updateReq = new UpdateImageMetadataRequest
        {
            ProjectWorkName = "  Contemporary Media Lounge  ",
            Caption = "  Custom architectural slatted acoustic wall with concealed wiring.  "
        };
        var updateResp = await client.PutAsJsonAsync($"/api/v1/website/images/{imageId}/metadata", updateReq);
        Assert.Equal(HttpStatusCode.OK, updateResp.StatusCode);

        var updateBody = await updateResp.Content.ReadFromJsonAsync<JsonElement>();
        var data = updateBody.GetProperty("data");
        Assert.Equal("Contemporary Media Lounge", data.GetProperty("projectWorkName").GetString());
        Assert.Equal("Custom architectural slatted acoustic wall with concealed wiring.", data.GetProperty("caption").GetString());
    }

    [Fact]
    public async Task ExploreOurWork_ApprovalAndPublishingLifecycle_EnforcesApprovalBeforePublish()
    {
        var email = $"eow_lifecycle_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Approval Lifecycle Studio", email);

        var form = CreateExploreOurWorkMultipartContent(
            CreateValidJpegBytes(),
            "walkin_closet.jpg",
            "image/jpeg",
            "Luxury Walk-In Closet",
            "Integrated sensor lighting and smoked glass doors.");

        var uploadResp = await client.PostAsync("/api/v1/website/images/explore-our-work", form);
        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();

        // 1. Manually set status to "Uploaded" in DB to verify approval gate
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var img = await db.Images.SingleAsync(i => i.Id == Guid.Parse(imageId));
            img.Status = "Uploaded";
            await db.SaveChangesAsync();
        }

        // 2. Publishing unapproved image must fail
        var unapprovedPubResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest());
        Assert.Equal(HttpStatusCode.BadRequest, unapprovedPubResp.StatusCode);
        var unapprovedBody = await unapprovedPubResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("IMAGE_NOT_APPROVED", unapprovedBody.GetProperty("code").GetString());

        // 3. Approve the image
        var approveResp = await client.PostAsync($"/api/v1/website/images/{imageId}/approve", null);
        Assert.Equal(HttpStatusCode.OK, approveResp.StatusCode);
        var approveBody = await approveResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Approved", approveBody.GetProperty("data").GetProperty("status").GetString());

        // 4. Now publishing succeeds
        var pubResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest());
        Assert.Equal(HttpStatusCode.OK, pubResp.StatusCode);
        var pubBody = await pubResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Published", pubBody.GetProperty("data").GetProperty("status").GetString());
        Assert.True(pubBody.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());
    }

    [Fact]
    public async Task ExploreOurWork_PublicWebsiteIntegration_DeliversOnlyPublishedActiveImages()
    {
        var email = $"eow_public_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Public Integration Studio", email);

        var form = CreateExploreOurWorkMultipartContent(
            CreateValidJpegBytes(),
            "kitchen_island.jpg",
            "image/jpeg",
            "Island Kitchen Countertop",
            "Italian quartz waterfall edge with fluted oak base.");

        var uploadResp = await client.PostAsync("/api/v1/website/images/explore-our-work", form);
        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();

        // 1. Manually set status to "Uploaded" to test public blocking
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var img = await db.Images.SingleAsync(i => i.Id == Guid.Parse(imageId));
            img.Status = "Uploaded";
            await db.SaveChangesAsync();
        }

        var publicAnonClient = _factory.CreateClient();

        // 2. Public image file request should return 404 while unpublished
        var unpubFileResp = await publicAnonClient.GetAsync($"/api/v1/website/images/{imageId}/file");
        Assert.Equal(HttpStatusCode.NotFound, unpubFileResp.StatusCode);

        // 3. Now approve and publish
        await client.PostAsync($"/api/v1/website/images/{imageId}/approve", null);
        var pubResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest());
        Assert.Equal(HttpStatusCode.OK, pubResp.StatusCode);

        // 4. Public image file request should now succeed
        var pubFileResp = await publicAnonClient.GetAsync($"/api/v1/website/images/{imageId}/file");
        Assert.Equal(HttpStatusCode.OK, pubFileResp.StatusCode);
        Assert.Equal("image/jpeg", pubFileResp.Content.Headers.ContentType?.MediaType);

        // 5. Public website published-content API should include the new published image in our-work section
        var contentResp = await publicAnonClient.GetAsync("/api/v1/website/published-content");
        Assert.Equal(HttpStatusCode.OK, contentResp.StatusCode);
        var contentBody = await contentResp.Content.ReadFromJsonAsync<JsonElement>();

        var sections = contentBody.GetProperty("sections");
        Assert.True(sections.TryGetProperty("our-work", out var ourWork) || sections.TryGetProperty("gallery", out ourWork));
        var items = ourWork.GetProperty("items");
        Assert.True(items.GetArrayLength() > 0);

        var firstItem = items[0];
        Assert.Equal(imageId, firstItem.GetProperty("id").GetString());
        Assert.Equal("Island Kitchen Countertop", firstItem.GetProperty("title").GetString());
        Assert.Equal($"/api/v1/website/images/{imageId}/file", firstItem.GetProperty("image").GetString());
    }

    [Fact]
    public async Task ExploreOurWork_RemoveFromWebsiteUsage_PreservesOriginalAssetAndRemovesFromPublicDelivery()
    {
        var email = $"eow_remove_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Removal Studio", email);

        var form = CreateExploreOurWorkMultipartContent(
            CreateValidPngBytes(),
            "vanity.png",
            "image/png",
            "Master Bath Vanity",
            "Custom fluted vanity with marble basin.");

        var uploadResp = await client.PostAsync("/api/v1/website/images/explore-our-work", form);
        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();

        await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest());

        // Safe removal from active website usage
        var removeResp = await client.DeleteAsync($"/api/v1/website/images/{imageId}");
        Assert.Equal(HttpStatusCode.OK, removeResp.StatusCode);

        // Image still exists in tenant library with status "Unused" and isActiveWebsiteUsage = false
        var checkResp = await client.GetAsync($"/api/v1/website/images/{imageId}");
        var checkBody = await checkResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Unused", checkBody.GetProperty("data").GetProperty("status").GetString());
        Assert.False(checkBody.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());

        // Authenticated client can still download preserved original
        var authFileResp = await client.GetAsync($"/api/v1/website/images/{imageId}/file");
        Assert.Equal(HttpStatusCode.OK, authFileResp.StatusCode);

        // Public website cannot access removed image
        var publicAnonClient = _factory.CreateClient();
        var publicFileResp = await publicAnonClient.GetAsync($"/api/v1/website/images/{imageId}/file");
        Assert.Equal(HttpStatusCode.NotFound, publicFileResp.StatusCode);
    }

    [Fact]
    public async Task ExploreOurWork_Replacement_PreservesExistingImageUntilNewImagePublished()
    {
        var email = $"eow_replace_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Replacement Safety Studio", email);

        // 1. Upload and publish initial image
        var form1 = CreateExploreOurWorkMultipartContent(
            CreateValidJpegBytes(),
            "first_kitchen.jpg",
            "image/jpeg",
            "Initial Kitchen Work",
            "Phase 1 documentation");

        var uploadResp1 = await client.PostAsync("/api/v1/website/images/explore-our-work", form1);
        var body1 = await uploadResp1.Content.ReadFromJsonAsync<JsonElement>();
        var imageId1 = body1.GetProperty("data").GetProperty("id").GetString();

        await client.PostAsJsonAsync($"/api/v1/website/images/{imageId1}/publish", new PublishImageRequest());

        // 2. Perform replacement with new valid image
        var replaceForm = new MultipartFormDataContent();
        var repFileContent = new ByteArrayContent(CreateValidPngBytes());
        repFileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        replaceForm.Add(repFileContent, "File", "replacement_kitchen.png");

        var replaceResp = await client.PostAsync($"/api/v1/website/images/{imageId1}/replace", replaceForm);
        Assert.Equal(HttpStatusCode.OK, replaceResp.StatusCode);
        var repBody = await replaceResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId2 = repBody.GetProperty("data").GetProperty("id").GetString();

        // 3. Verify original image 1 remains live and published until image 2 is published
        var check1 = await client.GetAsync($"/api/v1/website/images/{imageId1}");
        var checkBody1 = await check1.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Published", checkBody1.GetProperty("data").GetProperty("status").GetString());
        Assert.True(checkBody1.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());

        // 4. Publish replacement image 2
        var pub2 = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId2}/publish", new PublishImageRequest());
        Assert.Equal(HttpStatusCode.OK, pub2.StatusCode);

        // 5. Now image 1 is demoted to Unused and image 2 is Published
        var checkAfter1 = await client.GetAsync($"/api/v1/website/images/{imageId1}");
        var checkAfterBody1 = await checkAfter1.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Unused", checkAfterBody1.GetProperty("data").GetProperty("status").GetString());
        Assert.False(checkAfterBody1.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());

        var checkAfter2 = await client.GetAsync($"/api/v1/website/images/{imageId2}");
        var checkAfterBody2 = await checkAfter2.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Published", checkAfterBody2.GetProperty("data").GetProperty("status").GetString());
        Assert.True(checkAfterBody2.GetProperty("data").GetProperty("isActiveWebsiteUsage").GetBoolean());
    }

    [Fact]
    public async Task ExploreOurWork_AIEnhancement_CreatesSeparateVariantPreservingOriginal()
    {
        var email = $"eow_ai_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "AI Enhancement Studio", email);

        // Setup AI model connection with image enhancement support
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var user = await db.Users.SingleAsync(u => u.Email == email);
            var membership = await db.Memberships.SingleAsync(m => m.UserId == user.Id);

            var aiConfig = await db.TenantAIConfigurations.FirstOrDefaultAsync(c => c.TenantId == membership.TenantId);
            if (aiConfig == null)
            {
                aiConfig = new TenantAIConfiguration
                {
                    TenantId = membership.TenantId,
                    ProviderKey = "openai",
                    SelectedModelKey = "gpt-4o",
                    Status = AIConnectionStatus.Connected,
                    SupportedCapability = AIModelCapability.Both,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                db.TenantAIConfigurations.Add(aiConfig);
            }
            else
            {
                aiConfig.ProviderKey = "openai";
                aiConfig.SelectedModelKey = "gpt-4o";
                aiConfig.Status = AIConnectionStatus.Connected;
                aiConfig.SupportedCapability = AIModelCapability.Both;
            }
            await db.SaveChangesAsync();
        }

        // Upload Explore Our Work image
        var form = CreateExploreOurWorkMultipartContent(
            CreateValidJpegBytes(),
            "architectural_facade.jpg",
            "image/jpeg",
            "Engineered Window Showcase",
            "Triple-glazed acoustic uPVC architectural profiles.");

        var uploadResp = await client.PostAsync("/api/v1/website/images/explore-our-work", form);
        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();

        // Request enhancement
        var enhanceReq = new EnhanceImageRequest { Operation = "ImproveClarity" };
        var enhanceResp = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", enhanceReq);
        Assert.Equal(HttpStatusCode.Accepted, enhanceResp.StatusCode);

        var enhanceBody = await enhanceResp.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = enhanceBody.GetProperty("data").GetProperty("variantId").GetString();

        // Verify original image remains unchanged
        var origResp = await client.GetAsync($"/api/v1/website/images/{imageId}");
        var origBody = await origResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Approved", origBody.GetProperty("data").GetProperty("status").GetString());
        Assert.Equal("image/jpeg", origBody.GetProperty("data").GetProperty("mimeType").GetString());

        // Approve enhancement variant
        var approveVariantResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/enhancement/approve", new ApproveEnhancementRequest { VariantId = Guid.Parse(variantId!) });
        Assert.Equal(HttpStatusCode.OK, approveVariantResp.StatusCode);

        // Publish image with variant
        var pubResp = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest { VariantId = Guid.Parse(variantId!) });
        Assert.Equal(HttpStatusCode.OK, pubResp.StatusCode);

        // Public delivery for variant should now be served
        var anonClient = _factory.CreateClient();
        var variantFileResp = await anonClient.GetAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/file");
        Assert.Equal(HttpStatusCode.OK, variantFileResp.StatusCode);
    }

    [Fact]
    public async Task ExploreOurWork_TenantIsolation_EnforcedAcrossAllEndpoints()
    {
        var emailA = $"tenant_a_{Guid.NewGuid():N}@test.local";
        var clientA = await GetAuthenticatedClientAsync(emailA);
        await SetupAndConfirmBusinessContextAsync(clientA, "Tenant A Studio", emailA);

        var emailB = $"tenant_b_{Guid.NewGuid():N}@test.local";
        var clientB = await GetAuthenticatedClientAsync(emailB);
        await SetupAndConfirmBusinessContextAsync(clientB, "Tenant B Studio", emailB);

        // Tenant A creates an Explore Our Work image
        var formA = CreateExploreOurWorkMultipartContent(
            CreateValidJpegBytes(),
            "tenant_a_work.jpg",
            "image/jpeg",
            "Tenant A Secret Project",
            "Private work details");

        var uploadResp = await clientA.PostAsync("/api/v1/website/images/explore-our-work", formA);
        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageIdA = uploadBody.GetProperty("data").GetProperty("id").GetString();

        // 1. Tenant B cannot get image
        var getResp = await clientB.GetAsync($"/api/v1/website/images/{imageIdA}");
        Assert.Equal(HttpStatusCode.NotFound, getResp.StatusCode);

        // 2. Tenant B cannot update metadata
        var updateResp = await clientB.PutAsJsonAsync($"/api/v1/website/images/{imageIdA}/metadata", new UpdateImageMetadataRequest { ProjectWorkName = "Hacked" });
        Assert.Equal(HttpStatusCode.NotFound, updateResp.StatusCode);

        // 3. Tenant B cannot approve image
        var approveResp = await clientB.PostAsync($"/api/v1/website/images/{imageIdA}/approve", null);
        Assert.Equal(HttpStatusCode.NotFound, approveResp.StatusCode);

        // 4. Tenant B cannot publish image
        var pubResp = await clientB.PostAsJsonAsync($"/api/v1/website/images/{imageIdA}/publish", new PublishImageRequest());
        Assert.Equal(HttpStatusCode.NotFound, pubResp.StatusCode);

        // 5. Tenant B cannot remove image
        var delResp = await clientB.DeleteAsync($"/api/v1/website/images/{imageIdA}");
        Assert.Equal(HttpStatusCode.NotFound, delResp.StatusCode);

        // 6. Tenant B cannot replace image
        var repForm = new MultipartFormDataContent();
        var repBytes = new ByteArrayContent(CreateValidJpegBytes());
        repBytes.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        repForm.Add(repBytes, "File", "rep.jpg");
        var repResp = await clientB.PostAsync($"/api/v1/website/images/{imageIdA}/replace", repForm);
        Assert.Equal(HttpStatusCode.NotFound, repResp.StatusCode);

        // 7. Tenant B cannot enhance image
        var enhanceResp = await clientB.PostAsJsonAsync($"/api/v1/ai/images/{imageIdA}/enhance", new EnhanceImageRequest { Operation = "ImproveClarity" });
        Assert.Equal(HttpStatusCode.NotFound, enhanceResp.StatusCode);

        // 8. Tenant B list does not contain Tenant A's image
        var listResp = await clientB.GetAsync("/api/v1/website/images?usageType=ExploreOurWork");
        Assert.Equal(HttpStatusCode.OK, listResp.StatusCode);
        var listBody = await listResp.Content.ReadFromJsonAsync<JsonElement>();
        var listData = listBody.GetProperty("data");
        Assert.Equal(0, listData.GetArrayLength());
    }

    [Fact]
    public async Task ExploreOurWork_DynamicCategories_And_DeleteLifecycle_Verified()
    {
        var email = $"eow_dyn_{Guid.NewGuid():N}@test.local";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Dynamic Category Studio", email);

        // 1. Create a custom category via POST /api/v1/website/categories
        var catReq = new CreateWorkCategoryRequest { Name = "Modern Villas" };
        var catResp = await client.PostAsJsonAsync("/api/v1/website/categories", catReq);
        Assert.Equal(HttpStatusCode.Created, catResp.StatusCode);
        var catBody = await catResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Modern Villas", catBody.GetProperty("data").GetProperty("name").GetString());
        Assert.Equal("modern-villas", catBody.GetProperty("data").GetProperty("slug").GetString());

        // 2. Upload an image assigned to this category
        var form = CreateExploreOurWorkMultipartContent(
            CreateValidJpegBytes(),
            "modern_villa.jpg",
            "image/jpeg",
            "Hillside Villa",
            "Panoramic floor-to-ceiling glazing.",
            category: "Modern Villas");

        var uploadResp = await client.PostAsync("/api/v1/website/images/explore-our-work", form);
        Assert.Equal(HttpStatusCode.Created, uploadResp.StatusCode);
        var uploadBody = await uploadResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadBody.GetProperty("data").GetProperty("id").GetString();
        Assert.Equal("Modern Villas", uploadBody.GetProperty("data").GetProperty("category").GetString());

        // 3. Verify category list shows imageCount = 1
        var listCatsResp = await client.GetAsync("/api/v1/website/categories");
        Assert.Equal(HttpStatusCode.OK, listCatsResp.StatusCode);
        var listCatsBody = await listCatsResp.Content.ReadFromJsonAsync<JsonElement>();
        var catItems = listCatsBody.GetProperty("data").EnumerateArray().ToList();
        var modernVillaCat = catItems.FirstOrDefault(c => c.GetProperty("name").GetString() == "Modern Villas");
        Assert.True(modernVillaCat.ValueKind != JsonValueKind.Undefined);
        Assert.Equal(1, modernVillaCat.GetProperty("imageCount").GetInt32());

        // 4. Publish image
        await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new PublishImageRequest());

        // 5. Verify published content has dynamic category, not hardcoded KVN categories
        var pubContentResp = await client.GetAsync("/api/v1/website/published-content");
        Assert.Equal(HttpStatusCode.OK, pubContentResp.StatusCode);
        var pubContentBody = await pubContentResp.Content.ReadFromJsonAsync<JsonElement>();
        var ourWorkSection = pubContentBody.GetProperty("sections").GetProperty("our-work");
        var categoriesArray = ourWorkSection.GetProperty("categories").EnumerateArray().Select(c => c.GetString()).ToList();

        Assert.Contains("All", categoriesArray);
        Assert.Contains("Modern Villas", categoriesArray);
        Assert.DoesNotContain("WARDROBES", categoriesArray);
        Assert.DoesNotContain("UPVC WINDOWS", categoriesArray);

        var items = ourWorkSection.GetProperty("items").EnumerateArray().ToList();
        Assert.Single(items);
        Assert.Equal("Modern Villas", items[0].GetProperty("category").GetString());

        // 6. Delete image
        var deleteResp = await client.DeleteAsync($"/api/v1/website/images/{imageId}");
        Assert.Equal(HttpStatusCode.OK, deleteResp.StatusCode);

        // 7. Verify removed from Admin ExploreOurWork list
        var adminImagesResp = await client.GetAsync("/api/v1/website/images?usageType=ExploreOurWork");
        var adminImagesBody = await adminImagesResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, adminImagesBody.GetProperty("data").GetArrayLength());

        // 8. Verify category count decrements back to 0
        var afterCatsResp = await client.GetAsync("/api/v1/website/categories");
        var afterCatsBody = await afterCatsResp.Content.ReadFromJsonAsync<JsonElement>();
        var afterCatItems = afterCatsBody.GetProperty("data").EnumerateArray().ToList();
        var afterVillaCat = afterCatItems.First(c => c.GetProperty("name").GetString() == "Modern Villas");
        Assert.Equal(0, afterVillaCat.GetProperty("imageCount").GetInt32());

        // 9. Verify removed from published content gallery
        var afterPubContentResp = await client.GetAsync("/api/v1/website/published-content");
        var afterPubContentBody = await afterPubContentResp.Content.ReadFromJsonAsync<JsonElement>();
        var afterItems = afterPubContentBody.GetProperty("sections").GetProperty("our-work").GetProperty("items").EnumerateArray().ToList();
        Assert.Empty(afterItems);
    }
}
