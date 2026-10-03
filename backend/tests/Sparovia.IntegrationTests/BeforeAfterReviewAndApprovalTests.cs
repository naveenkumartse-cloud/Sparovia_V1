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

public class BeforeAfterReviewAndApprovalTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public BeforeAfterReviewAndApprovalTests(WebApplicationFactory<Program> factory)
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

    private async Task<HttpClient> GetAuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient();

        var regReq = new RegisterRequest
        {
            FullName = "Review Approval Tester",
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
            PrimaryCategory = "Architectural Woodworking",
            BusinessPhone = "+1 555-0188",
            BusinessEmail = email,
            Website = "https://example.com"
        };
        var r1 = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", basics);
        r1.EnsureSuccessStatusCode();

        var location = new LocationAndCustomersDto
        {
            AddressLine1 = "200 Artisan Way",
            City = "Metropolis",
            State = "NY",
            PostalCode = "10001",
            Country = "United States"
        };
        var r2 = await client.PutAsJsonAsync("/api/v1/onboarding/location-customers", location);
        r2.EnsureSuccessStatusCode();

        var svc = new ServiceDto { ServiceName = "Custom Cabinetry", ServiceDescription = "Precision cabinetry and millwork" };
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
    public async Task ReviewEndpoint_ReturnsServerResolvedBeforeAndAfterMetadata()
    {
        var email = $"review_get_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Before After Studio", email);
        await ConnectAIModelAsync(email, "gemini-1.5-pro");

        // Upload original image
        var uploadRes = await client.PostAsync("/api/v1/website/images",
            CreateUploadContent(CreateValidJpegBytes(), "portfolio.jpg", "image/jpeg", "WebsiteImage", "hero"));
        Assert.Equal(HttpStatusCode.Created, uploadRes.StatusCode);
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // Enhance image
        var enhanceRes = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new { Operation = "ImproveClarity" });
        Assert.Equal(HttpStatusCode.Accepted, enhanceRes.StatusCode);
        var enhanceJson = await enhanceRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = enhanceJson.GetProperty("data").GetProperty("variantId").GetString()!;

        // Call GET review endpoint
        var reviewRes = await client.GetAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/review");
        Assert.Equal(HttpStatusCode.OK, reviewRes.StatusCode);
        var reviewJson = await reviewRes.Content.ReadFromJsonAsync<JsonElement>();
        var data = reviewJson.GetProperty("data");

        // Root level review DTO checks
        Assert.Equal(imageId, data.GetProperty("imageId").GetString());
        Assert.Equal(variantId, data.GetProperty("variantId").GetString());
        Assert.Equal("ImproveClarity", data.GetProperty("operation").GetString());
        Assert.True(data.GetProperty("canApprove").GetBoolean());
        Assert.True(data.GetProperty("canReject").GetBoolean());

        // Validate Before (Image) metadata
        var before = data.GetProperty("before");
        Assert.Equal(imageId, before.GetProperty("id").GetString());
        Assert.Equal("portfolio.jpg", before.GetProperty("originalFileName").GetString());
        Assert.Equal("image/jpeg", before.GetProperty("mimeType").GetString());
        Assert.True(before.GetProperty("width").GetInt32() > 0);
        Assert.True(before.GetProperty("height").GetInt32() > 0);
        Assert.True(before.GetProperty("fileSize").GetInt64() > 0);
        Assert.False(string.IsNullOrEmpty(before.GetProperty("previewUrl").GetString()));

        // Validate After (Variant) metadata
        var after = data.GetProperty("after");
        Assert.Equal(variantId, after.GetProperty("id").GetString());
        Assert.Equal("ImproveClarity", after.GetProperty("operation").GetString());
        Assert.Equal("Enhanced", after.GetProperty("status").GetString());
        Assert.False(string.IsNullOrEmpty(after.GetProperty("previewUrl").GetString()));
    }

    [Fact]
    public async Task ReadyForReview_To_Approve_UpdatesStatusAndAIRequest_DoesNotAutoPublish()
    {
        var email = $"review_approve_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Approval Studio", email);
        await ConnectAIModelAsync(email, "gemini-1.5-pro");

        var uploadRes = await client.PostAsync("/api/v1/website/images",
            CreateUploadContent(CreateValidJpegBytes(), "facade.jpg", "image/jpeg", "WebsiteImage", "hero"));
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        var enhanceRes = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new { Operation = "ImproveSharpness" });
        var enhanceJson = await enhanceRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = enhanceJson.GetProperty("data").GetProperty("variantId").GetString()!;

        // Approve variant via POST review endpoint
        var reviewRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/review", new ReviewImageVariantRequest
        {
            IsApproved = true,
            Reason = "Lighting looks natural and balanced"
        });
        Assert.Equal(HttpStatusCode.OK, reviewRes.StatusCode);

        // Verify in Database
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var image = await db.Images.Include(i => i.Variants).FirstAsync(i => i.Id == Guid.Parse(imageId));
            var variant = image.Variants.First(v => v.Id == Guid.Parse(variantId));

            // Variant is approved
            Assert.Equal("Approved", variant.Status);

            // AIRequest is Accepted
            var aiReq = await db.AIRequests.FirstOrDefaultAsync(r => r.ResourceId == Guid.Parse(imageId));
            Assert.NotNull(aiReq);
            Assert.Equal(AIReviewStatus.Accepted, aiReq.ReviewStatus);

            // Original image is NOT published automatically
            Assert.NotEqual("Published", image.Status);
        }

        // Verify review endpoint now reflects cannot approve again
        var reviewCheckRes = await client.GetAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/review");
        Assert.Equal(HttpStatusCode.OK, reviewCheckRes.StatusCode);
        var checkJson = await reviewCheckRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(checkJson.GetProperty("data").GetProperty("canApprove").GetBoolean());
    }

    [Fact]
    public async Task ReadyForReview_To_Reject_UpdatesStatusAndAIRequest_PreservesOriginal()
    {
        var email = $"review_reject_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Rejection Studio", email);
        await ConnectAIModelAsync(email, "gemini-1.5-pro");

        var uploadRes = await client.PostAsync("/api/v1/website/images",
            CreateUploadContent(CreateValidJpegBytes(), "entryway.jpg", "image/jpeg", "WebsiteImage", "hero"));
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        var enhanceRes = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new { Operation = "ReduceNoise" });
        var enhanceJson = await enhanceRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = enhanceJson.GetProperty("data").GetProperty("variantId").GetString()!;

        // Reject variant via POST review endpoint
        var reviewRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/review", new ReviewImageVariantRequest
        {
            IsApproved = false,
            Reason = "Altered genuine architectural lines"
        });
        Assert.Equal(HttpStatusCode.OK, reviewRes.StatusCode);

        // Verify in Database
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var image = await db.Images.Include(i => i.Variants).FirstAsync(i => i.Id == Guid.Parse(imageId));
            var variant = image.Variants.First(v => v.Id == Guid.Parse(variantId));

            Assert.Equal("Rejected", variant.Status);

            var aiReq = await db.AIRequests.FirstOrDefaultAsync(r => r.ResourceId == Guid.Parse(imageId));
            Assert.NotNull(aiReq);
            Assert.Equal(AIReviewStatus.Rejected, aiReq.ReviewStatus);

            // Original image is pristine
            Assert.Equal("entryway.jpg", image.OriginalFileName);
            Assert.Equal("image/jpeg", image.MimeType);
        }
    }

    [Fact]
    public async Task StateTransitions_ProcessingCannotBeApprovedOrRejected()
    {
        var email = $"state_proc_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "State Transition Studio", email);

        var uploadRes = await client.PostAsync("/api/v1/website/images",
            CreateUploadContent(CreateValidJpegBytes(), "processing_test.jpg", "image/jpeg", "WebsiteImage", "hero"));
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        Guid variantId;
        // Inject a variant in "Processing" state directly
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var image = await db.Images.FirstAsync(i => i.Id == Guid.Parse(imageId));
            var v = new ImageVariant
            {
                ImageId = image.Id,
                TenantId = image.TenantId,
                VariantType = "AIEnhanced",
                Operation = "ImproveClarity",
                StorageKey = "test/proc.jpg",
                MimeType = "image/jpeg",
                FileSize = 1024,
                Width = 800,
                Height = 600,
                Status = "Processing",
                CreatedAt = DateTime.UtcNow
            };
            db.ImageVariants.Add(v);
            await db.SaveChangesAsync();
            variantId = v.Id;
        }

        // Attempting to approve must fail with 400 Bad Request
        var approveRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/review", new ReviewImageVariantRequest
        {
            IsApproved = true
        });
        Assert.Equal(HttpStatusCode.BadRequest, approveRes.StatusCode);
        var errJson = await approveRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("INVALID_STATE_TRANSITION", errJson.GetProperty("code").GetString());

        // Attempting to reject must also fail with 400 Bad Request
        var rejectRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/review", new ReviewImageVariantRequest
        {
            IsApproved = false
        });
        Assert.Equal(HttpStatusCode.BadRequest, rejectRes.StatusCode);
    }

    [Fact]
    public async Task StateTransitions_RejectedCannotBeApproved()
    {
        var email = $"state_invalid_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Invalid Transition Studio", email);
        await ConnectAIModelAsync(email, "gemini-1.5-pro");

        var uploadRes = await client.PostAsync("/api/v1/website/images",
            CreateUploadContent(CreateValidJpegBytes(), "transition_test.jpg", "image/jpeg", "WebsiteImage", "hero"));
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        var enhanceRes = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new { Operation = "ImproveClarity" });
        var enhanceJson = await enhanceRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = enhanceJson.GetProperty("data").GetProperty("variantId").GetString()!;

        // 1. Reject first
        var rejRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/review", new ReviewImageVariantRequest
        {
            IsApproved = false
        });
        Assert.Equal(HttpStatusCode.OK, rejRes.StatusCode);

        // 2. Rejected variant cannot be approved -> 400 INVALID_STATE_TRANSITION
        var appRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/review", new ReviewImageVariantRequest
        {
            IsApproved = true
        });
        Assert.Equal(HttpStatusCode.BadRequest, appRes.StatusCode);
        var errApp = await appRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("INVALID_STATE_TRANSITION", errApp.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Review_Idempotency_RepeatCallsSucceedWithoutAlteringState()
    {
        var email = $"idempotent_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Idempotent Studio", email);
        await ConnectAIModelAsync(email, "gemini-1.5-pro");

        var uploadRes = await client.PostAsync("/api/v1/website/images",
            CreateUploadContent(CreateValidJpegBytes(), "idempotent.jpg", "image/jpeg", "WebsiteImage", "hero"));
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        var enhanceRes = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new { Operation = "ImproveClarity" });
        var enhanceJson = await enhanceRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = enhanceJson.GetProperty("data").GetProperty("variantId").GetString()!;

        // First approval
        var app1 = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/review", new ReviewImageVariantRequest
        {
            IsApproved = true
        });
        Assert.Equal(HttpStatusCode.OK, app1.StatusCode);

        // Second approval (idempotent)
        var app2 = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/review", new ReviewImageVariantRequest
        {
            IsApproved = true
        });
        Assert.Equal(HttpStatusCode.OK, app2.StatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var variant = await db.ImageVariants.FirstAsync(v => v.Id == Guid.Parse(variantId));
            Assert.Equal("Approved", variant.Status);
        }
    }

    [Fact]
    public async Task MultiTenantIsolation_CrossTenantReviewAndApproval_Blocked()
    {
        var emailA = $"tenant_a_{Guid.NewGuid():N}@sparovia.com";
        var clientA = await GetAuthenticatedClientAsync(emailA);
        await SetupAndConfirmBusinessContextAsync(clientA, "Tenant A Studio", emailA);
        await ConnectAIModelAsync(emailA, "gemini-1.5-pro");

        var emailB = $"tenant_b_{Guid.NewGuid():N}@sparovia.com";
        var clientB = await GetAuthenticatedClientAsync(emailB);
        await SetupAndConfirmBusinessContextAsync(clientB, "Tenant B Studio", emailB);
        await ConnectAIModelAsync(emailB, "gemini-1.5-pro");

        // Tenant A creates image and variant
        var uploadRes = await clientA.PostAsync("/api/v1/website/images",
            CreateUploadContent(CreateValidJpegBytes(), "tenant_a.jpg", "image/jpeg", "WebsiteImage", "hero"));
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageIdA = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        var enhanceRes = await clientA.PostAsJsonAsync($"/api/v1/ai/images/{imageIdA}/enhance", new { Operation = "ImproveClarity" });
        var enhanceJson = await enhanceRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantIdA = enhanceJson.GetProperty("data").GetProperty("variantId").GetString()!;

        // Tenant B attempts to call GET review endpoint on Tenant A's image -> 404
        var crossGet = await clientB.GetAsync($"/api/v1/website/images/{imageIdA}/variants/{variantIdA}/review");
        Assert.Equal(HttpStatusCode.NotFound, crossGet.StatusCode);

        // Tenant B attempts to approve Tenant A's variant -> 404
        var crossApprove = await clientB.PostAsJsonAsync($"/api/v1/website/images/{imageIdA}/variants/{variantIdA}/review", new ReviewImageVariantRequest
        {
            IsApproved = true
        });
        Assert.Equal(HttpStatusCode.NotFound, crossApprove.StatusCode);

        // Tenant B attempts to reject Tenant A's variant -> 404
        var crossReject = await clientB.PostAsJsonAsync($"/api/v1/website/images/{imageIdA}/variants/{variantIdA}/review", new ReviewImageVariantRequest
        {
            IsApproved = false
        });
        Assert.Equal(HttpStatusCode.NotFound, crossReject.StatusCode);
    }

    [Fact]
    public async Task Approval_DoesNotAutoPublish_ExplicitPublishSucceeds()
    {
        var email = $"pub_explicit_{Guid.NewGuid():N}@sparovia.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Publish Studio", email);
        await ConnectAIModelAsync(email, "gemini-1.5-pro");

        // 1. Upload original photo
        var uploadRes = await client.PostAsync("/api/v1/website/images",
            CreateUploadContent(CreateValidJpegBytes(), "living_room.jpg", "image/jpeg", "WebsiteImage", "hero"));
        var uploadJson = await uploadRes.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = uploadJson.GetProperty("data").GetProperty("id").GetString()!;

        // 2. Request AI Enhancement
        var enhanceRes = await client.PostAsJsonAsync($"/api/v1/ai/images/{imageId}/enhance", new { Operation = "ImproveClarity" });
        var enhanceJson = await enhanceRes.Content.ReadFromJsonAsync<JsonElement>();
        var variantId = enhanceJson.GetProperty("data").GetProperty("variantId").GetString()!;

        // 3. Approve variant
        var reviewRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/variants/{variantId}/review", new ReviewImageVariantRequest
        {
            IsApproved = true
        });
        Assert.Equal(HttpStatusCode.OK, reviewRes.StatusCode);

        // 4. Verify Approval does NOT publish to live site
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var image = await db.Images.FirstAsync(i => i.Id == Guid.Parse(imageId));
            Assert.NotEqual("Published", image.Status);

            var user = await db.Users.FirstAsync(u => u.Email == email);
            var membership = await db.Memberships.FirstAsync(m => m.UserId == user.Id);
            var website = await db.Websites.FirstAsync(w => w.TenantId == membership.TenantId);
            var content = await db.WebsiteContents.FirstOrDefaultAsync(c => c.WebsiteId == website.Id);
            if (content != null && content.PublishedContentJson != null)
            {
                // Content JSON does not reference the variant URL prior to explicit publish
                Assert.DoesNotContain(variantId, content.PublishedContentJson);
            }
        }

        // 5. Explicit publish
        var pubRes = await client.PostAsJsonAsync($"/api/v1/website/images/{imageId}/publish", new { VariantId = Guid.Parse(variantId) });
        Assert.Equal(HttpStatusCode.OK, pubRes.StatusCode);

        // 6. Verify image is now Published
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var image = await db.Images.FirstAsync(i => i.Id == Guid.Parse(imageId));
            Assert.Equal("Published", image.Status);
        }
    }
}
