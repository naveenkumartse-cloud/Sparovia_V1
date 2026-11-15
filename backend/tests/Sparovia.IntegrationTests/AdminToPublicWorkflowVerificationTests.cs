using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Application.Onboarding;
using Sparovia.Application.WebsiteContent;
using Sparovia.Infrastructure.Data;
using Xunit;

namespace Sparovia.IntegrationTests;

public class AdminToPublicWorkflowVerificationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AdminToPublicWorkflowVerificationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private static byte[] CreateValidJpegBytes()
    {
        using var bmp = new SkiaSharp.SKBitmap(1920, 1080, SkiaSharp.SKColorType.Rgba8888, SkiaSharp.SKAlphaType.Premul);
        using (var canvas = new SkiaSharp.SKCanvas(bmp))
        {
            canvas.Clear(new SkiaSharp.SKColor(20, 50, 120));
        }
        using var img = SkiaSharp.SKImage.FromBitmap(bmp);
        using var data = img.Encode(SkiaSharp.SKEncodedImageFormat.Jpeg, 90);
        return data.ToArray();
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient();

        var regReq = new RegisterRequest
        {
            FullName = "Admin Workflow Tester",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };
        var regResp = await client.PostAsJsonAsync("/api/v1/auth/register", regReq);
        regResp.EnsureSuccessStatusCode();

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
        var loginResp = await client.PostAsJsonAsync("/api/v1/auth/login", loginReq);
        loginResp.EnsureSuccessStatusCode();

        return client;
    }

    private async Task SetupAndConfirmBusinessContextAsync(HttpClient client, string businessName, string email, string websiteUrl)
    {
        var basics = new BusinessBasicsDto
        {
            BusinessName = businessName,
            BusinessType = "Local Service Business",
            PrimaryCategory = "Interiors",
            BusinessEmail = email,
            BusinessPhone = "+91 9876543210",
            Website = websiteUrl
        };
        var respBasics = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", basics);
        respBasics.EnsureSuccessStatusCode();

        var location = new LocationAndCustomersDto
        {
            AddressLine1 = "42 Residency Road",
            City = "Bengaluru",
            State = "Karnataka",
            PostalCode = "560025",
            Country = "India",
            ServiceAreas = new List<string> { "Bengaluru", "Whitefield", "Indiranagar" }
        };
        var respLoc = await client.PutAsJsonAsync("/api/v1/onboarding/location-customers", location);
        respLoc.EnsureSuccessStatusCode();

        var svc = new ServiceDto { ServiceName = "Modular Kitchens", ServiceDescription = "Premium modular cabinetry" };
        var respSvc = await client.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        respSvc.EnsureSuccessStatusCode();

        var confirmResp = await client.PostAsync("/api/v1/onboarding/confirm", null);
        confirmResp.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task CompleteAdminToPublicSynchronizationWorkflow_12StepVerification()
    {
        // STEP 1: Open Admin Panel for Tenant A (KVN Interior)
        var tenantAEmail = $"admin-kvn-{Guid.NewGuid():N}@kvninterior.com";
        var tenantADomain = $"kvn-{Guid.NewGuid():N}.sparovia.test";
        var clientA = await GetAuthenticatedClientAsync(tenantAEmail);
        await SetupAndConfirmBusinessContextAsync(clientA, "KVN Interior", tenantAEmail, $"https://{tenantADomain}");

        // Initialize CMS overview in Admin
        var overviewRespA = await clientA.GetAsync("/api/v1/website/content");
        overviewRespA.EnsureSuccessStatusCode();

        var publicClient = _factory.CreateClient();

        // Initial check: public site returns default headline
        var initPublicResp = await publicClient.GetAsync($"/api/v1/website/published-content?domain={tenantADomain}");
        initPublicResp.EnsureSuccessStatusCode();
        var initData = await initPublicResp.Content.ReadFromJsonAsync<PublishedWebsiteContentDto>();
        Assert.NotNull(initData);
        Assert.Equal("Transform Your Space.", initData.Sections["hero"].GetProperty("headline").GetString());

        // STEP 2: Update Hero heading in Admin
        var updatedHeroHeading = "Bespoke Interiors Crafted For Luxury";
        var heroDraft = new
        {
            eyebrow = "HOME INTERIORS • uPVC WINDOWS",
            headline = updatedHeroHeading,
            subheadline = "Precision modular kitchens and architectural uPVC solutions.",
            primaryCta = "Get a Quote",
            secondaryCta = "Explore Our Work"
        };
        var putHero = await clientA.PutAsJsonAsync("/api/v1/website/content/hero/draft", new { fields = heroDraft });
        putHero.EnsureSuccessStatusCode();

        // STEP 3: Update About content in Admin
        var updatedAboutTitle = "Pioneering Architectural Interior Craftsmanship";
        var updatedAboutDesc = "Over 15 years of designing and fabricating bespoke residential spaces with absolute engineering precision.";
        var aboutDraft = new
        {
            badge = "Craftsmanship & Quality",
            title = updatedAboutTitle,
            description = updatedAboutDesc,
            pillars = new[] { "Tailored Modular Kitchen & Wardrobe Layouts", "Engineered uPVC Window Systems", "10-Year Comprehensive Warranty" }
        };
        var putAbout = await clientA.PutAsJsonAsync("/api/v1/website/content/about/draft", new { fields = aboutDraft });
        putAbout.EnsureSuccessStatusCode();

        // STEP 4: Update a service in Admin
        var updatedServiceName = "Ultra-Luxury Modular Kitchens";
        var servicesDraft = new
        {
            eyebrow = "INTERIORS",
            heading = "Designed around the way you live.",
            description = "Every space we craft begins with your comfort.",
            categories = new[]
            {
                new { id = "modular-kitchens", index = "01", name = updatedServiceName, tagline = "German hardware & acrylic finishes.", description = "Ergonomic designs tailored to Indian cooking." },
                new { id = "wardrobes", index = "02", name = "Bespoke Wardrobes", tagline = "Walk-in luxury.", description = "Floor-to-ceiling organization." }
            }
        };
        var putServices = await clientA.PutAsJsonAsync("/api/v1/website/content/services/draft", new { fields = servicesDraft });
        putServices.EnsureSuccessStatusCode();

        // STEP 5: Replace an image in Admin (upload new active hero image)
        var jpegBytes = CreateValidJpegBytes();
        var multipart = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(jpegBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        multipart.Add(fileContent, "file", "kvn_hero_luxury.jpg");
        multipart.Add(new StringContent("WebsiteImage"), "usageType");
        multipart.Add(new StringContent("heroImage"), "slot");

        var uploadImgResp = await clientA.PostAsync("/api/v1/website/images", multipart);
        uploadImgResp.EnsureSuccessStatusCode();
        var imgResult = await uploadImgResp.Content.ReadFromJsonAsync<JsonElement>();
        var imageId = imgResult.GetProperty("data").GetProperty("id").GetString();
        Assert.NotNull(imageId);

        // Publish image so it becomes active website media
        var pubImgResp = await clientA.PostAsync($"/api/v1/website/images/{imageId}/publish", null);
        pubImgResp.EnsureSuccessStatusCode();

        // STEP 6 & 7: Test Draft Isolation — Verify unpublished draft changes DO NOT leak publicly
        var duringDraftResp = await publicClient.GetAsync($"/api/v1/website/published-content?domain={tenantADomain}");
        duringDraftResp.EnsureSuccessStatusCode();
        var duringDraftData = await duringDraftResp.Content.ReadFromJsonAsync<PublishedWebsiteContentDto>();
        Assert.NotNull(duringDraftData);
        // Headline must still be the old published headline
        Assert.Equal("Transform Your Space.", duringDraftData.Sections["hero"].GetProperty("headline").GetString());
        // Service must still be the old service name
        var servicesJson = duringDraftData.Sections["services"].GetRawText();
        Assert.DoesNotContain(updatedServiceName, servicesJson);

        // STEP 8: Publish all sections in Admin
        var pubHero = await clientA.PostAsJsonAsync("/api/v1/website/content/hero/publish", new { });
        pubHero.EnsureSuccessStatusCode();

        var pubAbout = await clientA.PostAsJsonAsync("/api/v1/website/content/about/publish", new { });
        pubAbout.EnsureSuccessStatusCode();

        var pubServices = await clientA.PostAsJsonAsync("/api/v1/website/content/services/publish", new { });
        pubServices.EnsureSuccessStatusCode();

        // STEP 9: Open public landing page API and verify all published changes appear
        var postPubResp = await publicClient.GetAsync($"/api/v1/website/published-content?domain={tenantADomain}");
        postPubResp.EnsureSuccessStatusCode();
        var publishedData = await postPubResp.Content.ReadFromJsonAsync<PublishedWebsiteContentDto>();
        Assert.NotNull(publishedData);

        // Verify Hero published changes
        var liveHeroHeadline = publishedData.Sections["hero"].GetProperty("headline").GetString();
        Assert.Equal(updatedHeroHeading, liveHeroHeadline);
        var liveHeroImage = publishedData.Sections["hero"].GetProperty("heroImage").GetString();
        Assert.Contains(imageId, liveHeroImage); // Real replaced published image URL delivered!

        // Verify About published changes
        var liveAboutTitle = publishedData.Sections["about"].GetProperty("title").GetString();
        Assert.Equal(updatedAboutTitle, liveAboutTitle);
        var liveAboutDesc = publishedData.Sections["about"].GetProperty("description").GetString();
        Assert.Equal(updatedAboutDesc, liveAboutDesc);

        // Verify Services published changes
        var liveServicesCat = publishedData.Sections["services"].GetProperty("categories")[0].GetProperty("name").GetString();
        Assert.Equal(updatedServiceName, liveServicesCat);

        // STEP 10: Refresh the page / re-fetch: verify content remains correct and persistent
        var refreshResp = await publicClient.GetAsync($"/api/v1/website/published-content?domain={tenantADomain}");
        refreshResp.EnsureSuccessStatusCode();
        var refreshedData = await refreshResp.Content.ReadFromJsonAsync<PublishedWebsiteContentDto>();
        Assert.NotNull(refreshedData);
        Assert.Equal(updatedHeroHeading, refreshedData.Sections["hero"].GetProperty("headline").GetString());
        Assert.Equal(updatedAboutTitle, refreshedData.Sections["about"].GetProperty("title").GetString());
        Assert.Equal(updatedServiceName, refreshedData.Sections["services"].GetProperty("categories")[0].GetProperty("name").GetString());

        // STEP 11 & 12: Multi-Tenant Security — Verify another tenant's website remains completely unaffected
        var tenantBEmail = $"admin-other-{Guid.NewGuid():N}@othertenant.com";
        var tenantBDomain = $"other-{Guid.NewGuid():N}.sparovia.test";
        var clientB = await GetAuthenticatedClientAsync(tenantBEmail);
        await SetupAndConfirmBusinessContextAsync(clientB, "Other Tenant Co", tenantBEmail, $"https://{tenantBDomain}");

        var overviewRespB = await clientB.GetAsync("/api/v1/website/content");
        overviewRespB.EnsureSuccessStatusCode();

        var tenantBPublicResp = await publicClient.GetAsync($"/api/v1/website/published-content?domain={tenantBDomain}");
        tenantBPublicResp.EnsureSuccessStatusCode();
        var tenantBData = await tenantBPublicResp.Content.ReadFromJsonAsync<PublishedWebsiteContentDto>();
        Assert.NotNull(tenantBData);

        // Tenant B must have their own default headline, NOT Tenant A's edited headline
        Assert.Equal("Transform Your Space.", tenantBData.Sections["hero"].GetProperty("headline").GetString());
        Assert.DoesNotContain(updatedHeroHeading, tenantBData.Sections["hero"].GetProperty("headline").GetString());
        // Tenant B must not have Tenant A's image
        Assert.DoesNotContain(imageId, tenantBData.Sections["hero"].GetRawText());
        // Tenant B must not have Tenant A's service
        Assert.DoesNotContain(updatedServiceName, tenantBData.Sections["services"].GetRawText());
        // Tenant B website metadata must resolve Tenant B
        Assert.Equal("Other Tenant Co", tenantBData.Website.Name);
        Assert.Equal(tenantBDomain, tenantBData.Website.Domain);
    }
}
