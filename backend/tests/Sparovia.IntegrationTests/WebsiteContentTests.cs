using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Application.Onboarding;
using Sparovia.Application.WebsiteContent;
using Sparovia.Infrastructure.Data;

namespace Sparovia.IntegrationTests;

public class WebsiteContentTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public WebsiteContentTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient();

        var regReq = new RegisterRequest
        {
            FullName = "CMS Tester",
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

    private async Task SetupAndConfirmBusinessContextAsync(HttpClient client, string businessName, string email, string? websiteUrl = null)
    {
        var basics = new BusinessBasicsDto
        {
            BusinessName = businessName,
            BusinessType = "Local Service Business",
            PrimaryCategory = "Interiors",
            BusinessEmail = email,
            BusinessPhone = "+1 555-0199",
            Website = websiteUrl ?? "https://example.com"
        };
        var respBasics = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", basics);
        respBasics.EnsureSuccessStatusCode();

        var location = new LocationAndCustomersDto
        {
            AddressLine1 = "100 Design Studio Way",
            City = "Tech City",
            State = "CA",
            PostalCode = "94016",
            Country = "United States",
            ServiceAreas = new List<string> { "Greater Metro" }
        };
        var respLoc = await client.PutAsJsonAsync("/api/v1/onboarding/location-customers", location);
        respLoc.EnsureSuccessStatusCode();

        var svc = new ServiceDto { ServiceName = "Modular Kitchens", ServiceDescription = "Tailored kitchen design" };
        var respSvc = await client.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        respSvc.EnsureSuccessStatusCode();

        var confirmResp = await client.PostAsync("/api/v1/onboarding/confirm", null);
        confirmResp.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task GetWebsite_Unauthenticated_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/website");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetWebsite_UnconfirmedContext_ReturnsForbidden()
    {
        var email = $"cms-unconfirmed-{Guid.NewGuid()}@test.com";
        var client = await GetAuthenticatedClientAsync(email);

        var response = await client.GetAsync("/api/v1/website");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("ONBOARDING_REQUIRED", content);
    }

    [Fact]
    public async Task GetWebsite_ConfirmedContext_ReturnsConnectedWebsite()
    {
        var email = $"cms-website-{Guid.NewGuid()}@test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "KVN Interiors", email);

        var response = await client.GetAsync("/api/v1/website");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var website = await response.Content.ReadFromJsonAsync<WebsiteDto>();
        Assert.NotNull(website);
        Assert.Contains("KVN Interiors", website.Name);
        Assert.Equal("Connected", website.ConnectionStatus);
    }

    [Fact]
    public async Task GetContentOverview_ReturnsWebsiteAndAllSupportedSections()
    {
        var email = $"cms-sections-{Guid.NewGuid()}@test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Prestige Spaces", email);

        var response = await client.GetAsync("/api/v1/website/content");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var overview = await response.Content.ReadFromJsonAsync<WebsiteContentOverviewDto>();
        Assert.NotNull(overview);
        Assert.NotNull(overview.Website);
        Assert.Equal("Connected", overview.Website.ConnectionStatus);
        Assert.NotNull(overview.Sections);
        Assert.True(overview.Sections.Count >= 9);
        Assert.Contains(overview.Sections, s => s.SectionKey == "hero");
        Assert.Contains(overview.Sections, s => s.SectionKey == "about");
        Assert.Contains(overview.Sections, s => s.SectionKey == "services");
        Assert.Contains(overview.Sections, s => s.SectionKey == "why-choose-us");
        Assert.Contains(overview.Sections, s => s.SectionKey == "our-work");
        Assert.Contains(overview.Sections, s => s.SectionKey == "testimonials");
        Assert.Contains(overview.Sections, s => s.SectionKey == "faq");
        Assert.Contains(overview.Sections, s => s.SectionKey == "contact");
        Assert.Contains(overview.Sections, s => s.SectionKey == "footer");
    }

    [Fact]
    public async Task SaveDraft_ValidFields_PersistsDraftWithoutAlteringPublished()
    {
        var email = $"cms-draft-{Guid.NewGuid()}@test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Luxe Living", email);

        // Fetch initial section
        var initResp = await client.GetAsync("/api/v1/website/content/hero");
        Assert.Equal(HttpStatusCode.OK, initResp.StatusCode);
        var initial = await initResp.Content.ReadFromJsonAsync<ContentSectionDetailDto>();
        Assert.NotNull(initial);
        var initialVersion = initial.Version;

        // Save updated draft
        var updatedHero = new
        {
            eyebrow = "CUSTOM HOME INTERIORS",
            headline = "Crafting Timeless Homes.",
            subheadline = "Bespoke modular kitchens and architectural interiors for modern living.",
            primaryCta = "Book Consultation",
            secondaryCta = "View Portfolio"
        };

        var draftPayload = new { fields = updatedHero };
        var putResp = await client.PutAsJsonAsync("/api/v1/website/content/hero/draft", draftPayload);
        Assert.Equal(HttpStatusCode.OK, putResp.StatusCode);

        var savedDetail = await putResp.Content.ReadFromJsonAsync<ContentSectionDetailDto>();
        Assert.NotNull(savedDetail);
        Assert.Equal("Draft", savedDetail.Status);
        Assert.Equal(initialVersion + 1, savedDetail.Version);
        Assert.True(savedDetail.HasUnpublishedChanges);

        // Verify draft fields contain new headline
        var headline = savedDetail.DraftFields.GetProperty("headline").GetString();
        Assert.Equal("Crafting Timeless Homes.", headline);

        // Verify published fields still have previous content or initial content
        if (savedDetail.PublishedFields.HasValue)
        {
            var pubHeadline = savedDetail.PublishedFields.Value.GetProperty("headline").GetString();
            Assert.NotEqual("Crafting Timeless Homes.", pubHeadline);
        }
    }

    [Fact]
    public async Task SaveDraft_UnsupportedField_ReturnsBadRequest()
    {
        var email = $"cms-badfield-{Guid.NewGuid()}@test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Nordic Design", email);

        var badPayload = new
        {
            fields = new
            {
                headline = "Valid Headline",
                arbitraryUnsupportedKey = "Malicious or unsupported content"
            }
        };

        var resp = await client.PutAsJsonAsync("/api/v1/website/content/hero/draft", badPayload);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        var content = await resp.Content.ReadAsStringAsync();
        Assert.Contains("not supported", content);
    }

    [Fact]
    public async Task PublishSection_PromotesDraftToPublished()
    {
        var email = $"cms-publish-{Guid.NewGuid()}@test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Artisan Windows", email);

        // 1. Update draft
        var updatedWhyUs = new
        {
            eyebrow = "WHY CHOOSE ARTISAN",
            heading = "Built with uncompromising quality.",
            description = "Over a decade of German-engineered architectural systems.",
            items = new[]
            {
                new { index = "01", title = "Lifetime Hardware Guarantee", description = "All hinges and handles covered." }
            }
        };

        var putResp = await client.PutAsJsonAsync("/api/v1/website/content/whyUs/draft", new { fields = updatedWhyUs });
        putResp.EnsureSuccessStatusCode();

        // 2. Publish section
        var pubResp = await client.PostAsJsonAsync("/api/v1/website/content/whyUs/publish", new { });
        Assert.Equal(HttpStatusCode.OK, pubResp.StatusCode);

        var published = await pubResp.Content.ReadFromJsonAsync<ContentSectionDetailDto>();
        Assert.NotNull(published);
        Assert.Equal("Published", published.Status);
        Assert.False(published.HasUnpublishedChanges);
        Assert.NotNull(published.PublishedAt);

        // Verify published fields now match updated content
        Assert.NotNull(published.PublishedFields);
        var pubHeading = published.PublishedFields.Value.GetProperty("heading").GetString();
        Assert.Equal("Built with uncompromising quality.", pubHeading);

        // 3. Verify public endpoint returns the published section
        var publicResp = await client.GetAsync("/api/v1/website/published-content");
        Assert.Equal(HttpStatusCode.OK, publicResp.StatusCode);

        var publicData = await publicResp.Content.ReadFromJsonAsync<PublishedWebsiteContentDto>();
        Assert.NotNull(publicData);
        Assert.True(publicData.Sections.ContainsKey("whyUs"));
        var publicHeading = publicData.Sections["whyUs"].GetProperty("heading").GetString();
        Assert.Equal("Built with uncompromising quality.", publicHeading);
    }

    [Fact]
    public async Task TenantIsolation_TenantCannotAccessOrMutateOtherTenantsContent()
    {
        var emailA = $"tenantA-cms-{Guid.NewGuid()}@test.com";
        var clientA = await GetAuthenticatedClientAsync(emailA);
        await SetupAndConfirmBusinessContextAsync(clientA, "Tenant A Interiors", emailA);

        var emailB = $"tenantB-cms-{Guid.NewGuid()}@test.com";
        var clientB = await GetAuthenticatedClientAsync(emailB);
        await SetupAndConfirmBusinessContextAsync(clientB, "Tenant B Interiors", emailB);

        // Update Tenant A draft
        var heroA = new
        {
            eyebrow = "TENANT A EXCLUSIVE",
            headline = "Tenant A Headline",
            subheadline = "Tenant A Subheadline",
            primaryCta = "Contact A",
            secondaryCta = "Explore A"
        };
        var putA = await clientA.PutAsJsonAsync("/api/v1/website/content/hero/draft", new { fields = heroA });
        putA.EnsureSuccessStatusCode();

        // Verify Tenant B's hero is untouched
        var getB = await clientB.GetAsync("/api/v1/website/content/hero");
        getB.EnsureSuccessStatusCode();
        var heroB = await getB.Content.ReadFromJsonAsync<ContentSectionDetailDto>();
        Assert.NotNull(heroB);

        var headlineB = heroB.DraftFields.GetProperty("headline").GetString();
        Assert.NotEqual("Tenant A Headline", headlineB);
    }

    [Fact]
    public async Task PublicWebsiteRuntimeIntegration_SaveDraftDoesNotLeak_PublishUpdatesPublicEndpointImmediately()
    {
        var email = $"cms-runtime-{Guid.NewGuid():N}@test.com";
        var uniqueDomain = $"runtime-{Guid.NewGuid():N}.sparovia.test";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "KVN Interiors Runtime", email, $"https://{uniqueDomain}");

        // 0. Initialize website overview in Admin (as happens on /admin/content)
        var overviewResp = await client.GetAsync("/api/v1/website/content");
        overviewResp.EnsureSuccessStatusCode();
        var overview = await overviewResp.Content.ReadFromJsonAsync<WebsiteContentOverviewDto>();
        Assert.NotNull(overview);
        var domain = overview.Website.Domain;
        Assert.Equal(uniqueDomain, domain);

        // 1. Initial state: verify default published headline
        var initialResp = await client.GetAsync($"/api/v1/website/published-content?domain={domain}");
        initialResp.EnsureSuccessStatusCode();
        var initialData = await initialResp.Content.ReadFromJsonAsync<PublishedWebsiteContentDto>();
        Assert.NotNull(initialData);
        Assert.True(initialData.Sections.ContainsKey("hero"));
        var initialHeadline = initialData.Sections["hero"].GetProperty("headline").GetString();
        Assert.Equal("Transform Your Space.", initialHeadline);

        // 2. Client edits in Admin: Save Draft with new headline
        var draftPayload = new
        {
            eyebrow = "HOME INTERIORS • uPVC WINDOWS",
            headline = "Beautiful Spaces. Built For You.",
            subheadline = "Crafting custom modular living spaces.",
            primaryCta = "Get a Quote",
            secondaryCta = "Explore Our Work"
        };
        var draftResp = await client.PutAsJsonAsync("/api/v1/website/content/hero/draft", new { fields = draftPayload });
        draftResp.EnsureSuccessStatusCode();

        // 3. Draft Isolation: Verify public endpoint still serves the original published headline!
        var unauthenticatedClient = _factory.CreateClient();
        var duringDraftResp = await unauthenticatedClient.GetAsync($"/api/v1/website/published-content?domain={domain}");
        duringDraftResp.EnsureSuccessStatusCode();
        var duringDraftData = await duringDraftResp.Content.ReadFromJsonAsync<PublishedWebsiteContentDto>();
        Assert.NotNull(duringDraftData);
        var stillOldHeadline = duringDraftData.Sections["hero"].GetProperty("headline").GetString();
        Assert.Equal("Transform Your Space.", stillOldHeadline); // Draft is NOT leaked to public!

        // 4. Client clicks Publish in Admin
        var pubResp = await client.PostAsJsonAsync("/api/v1/website/content/hero/publish", new { });
        pubResp.EnsureSuccessStatusCode();

        // 5. Runtime Reflection: Verify public endpoint immediately reflects the newly published headline
        var postPublishResp = await unauthenticatedClient.GetAsync($"/api/v1/website/published-content?domain={domain}");
        postPublishResp.EnsureSuccessStatusCode();
        var postPublishData = await postPublishResp.Content.ReadFromJsonAsync<PublishedWebsiteContentDto>();
        Assert.NotNull(postPublishData);
        var newPublishedHeadline = postPublishData.Sections["hero"].GetProperty("headline").GetString();
        Assert.Equal("Beautiful Spaces. Built For You.", newPublishedHeadline);

        // 6. Also verify authenticated tenant without domain query resolves their own website
        var authDirectResp = await client.GetAsync("/api/v1/website/published-content");
        authDirectResp.EnsureSuccessStatusCode();
        var authDirectData = await authDirectResp.Content.ReadFromJsonAsync<PublishedWebsiteContentDto>();
        Assert.NotNull(authDirectData);
        Assert.Equal("Beautiful Spaces. Built For You.", authDirectData.Sections["hero"].GetProperty("headline").GetString());
    }

    [Fact]
    public async Task ComprehensiveManualVerificationScenario_Hero_About_Services_Faq_Testimonial_Image_AllReflectAtRuntimeImmediately()
    {
        var email = $"cms-comprehensive-{Guid.NewGuid():N}@test.com";
        var uniqueDomain = $"site-{Guid.NewGuid():N}.sparovia.test";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Comprehensive CMS Test Business", email, $"https://{uniqueDomain}");

        // Initialize website
        var overviewResp = await client.GetAsync("/api/v1/website/content");
        overviewResp.EnsureSuccessStatusCode();

        var unauthClient = _factory.CreateClient();

        // TEST 1 — HERO: Headline -> CMS TEST HERO 001
        var heroDraft = new
        {
            eyebrow = "HOME INTERIORS • uPVC WINDOWS",
            headline = "CMS TEST HERO 001",
            subheadline = "Precision crafted residential interiors.",
            primaryCta = "Get a Quote",
            secondaryCta = "Explore Our Work",
            heroImage = "https://images.unsplash.com/photo-cms-test-006"
        };
        var putHero = await client.PutAsJsonAsync("/api/v1/website/content/hero/draft", new { fields = heroDraft });
        putHero.EnsureSuccessStatusCode();
        var pubHero = await client.PostAsJsonAsync("/api/v1/website/content/hero/publish", new { });
        pubHero.EnsureSuccessStatusCode();

        // TEST 2 — ABOUT: Description -> CMS TEST ABOUT 002
        var aboutDraft = new
        {
            badge = "Craftsmanship & Quality",
            title = "Crafting Spaces That Reflect You",
            description = "CMS TEST ABOUT 002",
            pillars = new[] { "Tailored Modular Kitchen & Wardrobe Layouts", "Engineered uPVC Systems" }
        };
        var putAbout = await client.PutAsJsonAsync("/api/v1/website/content/about/draft", new { fields = aboutDraft });
        putAbout.EnsureSuccessStatusCode();
        var pubAbout = await client.PostAsJsonAsync("/api/v1/website/content/about/publish", new { });
        pubAbout.EnsureSuccessStatusCode();

        // TEST 3 — SERVICE: Service Category -> CMS TEST SERVICE 003
        var servicesDraft = new
        {
            eyebrow = "INTERIORS",
            heading = "Designed around the way you live.",
            description = "Every space we craft begins with your comfort.",
            categories = new[]
            {
                new { id = "modular-kitchens", index = "01", name = "CMS TEST SERVICE 003", tagline = "Ergonomic designs.", description = "Custom kitchen finishes." }
            }
        };
        var putServices = await client.PutAsJsonAsync("/api/v1/website/content/services/draft", new { fields = servicesDraft });
        putServices.EnsureSuccessStatusCode();
        var pubServices = await client.PostAsJsonAsync("/api/v1/website/content/services/publish", new { });
        pubServices.EnsureSuccessStatusCode();

        // TEST 4 — FAQ: Answer -> CMS TEST FAQ 004
        var faqDraft = new
        {
            eyebrow = "FREQUENTLY ASKED QUESTIONS",
            heading = "Clear answers to common questions.",
            list = new[]
            {
                new { question = "What solutions do you provide?", answer = "CMS TEST FAQ 004" }
            }
        };
        var putFaq = await client.PutAsJsonAsync("/api/v1/website/content/faq/draft", new { fields = faqDraft });
        putFaq.EnsureSuccessStatusCode();
        var pubFaq = await client.PostAsJsonAsync("/api/v1/website/content/faq/publish", new { });
        pubFaq.EnsureSuccessStatusCode();

        // TEST 5 — TESTIMONIAL: Quote -> CMS TEST TESTIMONIAL 005
        var testimonialsDraft = new
        {
            enabled = true,
            eyebrow = "CLIENT FEEDBACK",
            heading = "Client Experiences",
            list = new[]
            {
                new { quote = "CMS TEST TESTIMONIAL 005", author = "Verified Client", location = "Villa Homeowner" }
            }
        };
        var putTestimonials = await client.PutAsJsonAsync("/api/v1/website/content/testimonials/draft", new { fields = testimonialsDraft });
        putTestimonials.EnsureSuccessStatusCode();
        var pubTestimonials = await client.PostAsJsonAsync("/api/v1/website/content/testimonials/publish", new { });
        pubTestimonials.EnsureSuccessStatusCode();

        // ── VERIFY PUBLIC ENDPOINT (BY DOMAIN) ──
        var publicResp = await unauthClient.GetAsync($"/api/v1/website/published-content?domain={uniqueDomain}");
        publicResp.EnsureSuccessStatusCode();
        var publicData = await publicResp.Content.ReadFromJsonAsync<PublishedWebsiteContentDto>();
        Assert.NotNull(publicData);

        // TEST 1 Verification:
        Assert.Equal("CMS TEST HERO 001", publicData.Sections["hero"].GetProperty("headline").GetString());
        // TEST 6 (Image) Verification:
        Assert.Equal("https://images.unsplash.com/photo-cms-test-006", publicData.Sections["hero"].GetProperty("heroImage").GetString());
        // TEST 2 Verification:
        Assert.Equal("CMS TEST ABOUT 002", publicData.Sections["about"].GetProperty("description").GetString());
        // TEST 3 Verification:
        var firstCategoryName = publicData.Sections["services"].GetProperty("categories")[0].GetProperty("name").GetString();
        Assert.Equal("CMS TEST SERVICE 003", firstCategoryName);
        // TEST 4 Verification:
        var firstFaqAnswer = publicData.Sections["faq"].GetProperty("list")[0].GetProperty("answer").GetString();
        Assert.Equal("CMS TEST FAQ 004", firstFaqAnswer);
        // TEST 5 Verification:
        var firstTestimonialQuote = publicData.Sections["testimonials"].GetProperty("list")[0].GetProperty("quote").GetString();
        Assert.Equal("CMS TEST TESTIMONIAL 005", firstTestimonialQuote);

        // ── VERIFY LOCALHOST RESOLUTION REFLECTS MOST RECENTLY UPDATED WEBSITE ──
        var localhostResp = await unauthClient.GetAsync("/api/v1/website/published-content?domain=localhost");
        localhostResp.EnsureSuccessStatusCode();
        var localhostData = await localhostResp.Content.ReadFromJsonAsync<PublishedWebsiteContentDto>();
        Assert.NotNull(localhostData);
        Assert.Equal("CMS TEST HERO 001", localhostData.Sections["hero"].GetProperty("headline").GetString());
    }

    [Fact]
    public async Task SaveDraft_ScriptTagInjection_ReturnsBadRequest()
    {
        var email = $"cms-xss-{Guid.NewGuid()}@test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Security First", email);

        var maliciousPayload = new
        {
            fields = new
            {
                headline = "Safe Headline",
                subheadline = "<script>alert('xss')</script>"
            }
        };

        var resp = await client.PutAsJsonAsync("/api/v1/website/content/hero/draft", maliciousPayload);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        var content = await resp.Content.ReadAsStringAsync();
        Assert.Contains("HTML scripts and unsafe tags are not allowed", content);
    }

    [Fact]
    public async Task SaveDraft_ExceedsMaxLength_ReturnsBadRequest()
    {
        var email = $"cms-maxlen-{Guid.NewGuid()}@test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Length Limit Studio", email);

        // Hero headline max length is 200
        var tooLongHeadline = new string('A', 201);
        var invalidPayload = new
        {
            fields = new
            {
                headline = tooLongHeadline
            }
        };

        var resp = await client.PutAsJsonAsync("/api/v1/website/content/hero/draft", invalidPayload);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        var content = await resp.Content.ReadAsStringAsync();
        Assert.Contains("exceeds maximum length", content);
    }

    [Fact]
    public async Task Swagger_EndpointReturnsOpenApiJson()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/swagger/v1/swagger.json");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var content = await resp.Content.ReadAsStringAsync();
        Assert.Contains("Sparovia API", content);
        Assert.Contains("/api/v1/website/published-content", content);
    }

    [Fact]
    public async Task BusinessContextWebsiteUpdate_SynchronizesWithWebsiteEntityAndContentOverview()
    {
        var email = $"sync-test-{Guid.NewGuid():N}@test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Original Studio", email, "https://original-domain.com");

        // Initial check: website should match initial business context
        var initWebsiteResp = await client.GetAsync("/api/v1/website");
        initWebsiteResp.EnsureSuccessStatusCode();
        var initWebsite = await initWebsiteResp.Content.ReadFromJsonAsync<WebsiteDto>();
        Assert.NotNull(initWebsite);
        Assert.Equal("Original Studio", initWebsite.Name);
        Assert.Equal("original-domain.com", initWebsite.Domain);

        // Update Business Basics with a new website URL and business name
        var updatedBasics = new BusinessBasicsDto
        {
            BusinessName = "Renovated Architecture Studio",
            BusinessType = "Local Service Business",
            PrimaryCategory = "Architecture & Design",
            BusinessEmail = email,
            BusinessPhone = "+1 555-9876",
            Website = "https://renovated-studio.com"
        };
        var updateResp = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", updatedBasics);
        updateResp.EnsureSuccessStatusCode();

        // Re-confirm business context so admin gating passes
        var confirmResp = await client.PostAsync("/api/v1/onboarding/confirm", null);
        confirmResp.EnsureSuccessStatusCode();

        // Verify /api/v1/website immediately reflects the new website domain and name
        var updatedWebsiteResp = await client.GetAsync("/api/v1/website");
        updatedWebsiteResp.EnsureSuccessStatusCode();
        var updatedWebsite = await updatedWebsiteResp.Content.ReadFromJsonAsync<WebsiteDto>();
        Assert.NotNull(updatedWebsite);
        Assert.Equal("Renovated Architecture Studio", updatedWebsite.Name);
        Assert.Equal("renovated-studio.com", updatedWebsite.Domain);

        // Verify /api/v1/website/content overview immediately reflects the updated domain and name
        var overviewResp = await client.GetAsync("/api/v1/website/content");
        overviewResp.EnsureSuccessStatusCode();
        var overview = await overviewResp.Content.ReadFromJsonAsync<WebsiteContentOverviewDto>();
        Assert.NotNull(overview);
        Assert.Equal("Renovated Architecture Studio", overview.Website.Name);
        Assert.Equal("renovated-studio.com", overview.Website.Domain);
    }

    [Fact]
    public async Task PublishSection_WithMismatchedVersion_ReturnsConflict()
    {
        var email = $"cms-version-mismatch-{Guid.NewGuid():N}@test.com";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Concurrency Studio", email);

        // Fetch initial section version
        var getResp = await client.GetAsync("/api/v1/website/content/hero");
        getResp.EnsureSuccessStatusCode();
        var detail = await getResp.Content.ReadFromJsonAsync<ContentSectionDetailDto>();
        Assert.NotNull(detail);

        // Attempt publish with stale version token (e.g. v999 when current is v1)
        var stalePublishPayload = new { version = 999 };
        var pubResp = await client.PostAsJsonAsync("/api/v1/website/content/hero/publish", stalePublishPayload);
        Assert.Equal(HttpStatusCode.Conflict, pubResp.StatusCode);

        var errContent = await pubResp.Content.ReadAsStringAsync();
        Assert.Contains("VERSION_MISMATCH", errContent);
    }

    [Fact]
    public async Task PublishSection_AtomicFailureSafety_InvalidDraftPreservesExistingLiveContent()
    {
        var email = $"cms-atomic-fail-{Guid.NewGuid():N}@test.com";
        var uniqueDomain = $"atomic-{Guid.NewGuid():N}.sparovia.test";
        var client = await GetAuthenticatedClientAsync(email);
        await SetupAndConfirmBusinessContextAsync(client, "Atomic Safety Studio", email, $"https://{uniqueDomain}");

        // 1. Initialize and verify initial published headline
        var initResp = await client.GetAsync("/api/v1/website/content/hero");
        initResp.EnsureSuccessStatusCode();
        var initSection = await initResp.Content.ReadFromJsonAsync<ContentSectionDetailDto>();
        Assert.NotNull(initSection);
        var originalLiveHeadline = initSection.DraftFields.GetProperty("headline").GetString();
        Assert.Equal("Transform Your Space.", originalLiveHeadline);

        // 2. Simulate a corrupt / invalid draft in the database (e.g. contains an unapproved field or script)
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            var user = db.Users.Single(u => u.Email == email);
            var membership = db.Memberships.Single(m => m.UserId == user.Id);
            var content = db.WebsiteContents.Single(c => c.TenantId == membership.TenantId && c.SectionKey == "hero");

            // Manually set draft to invalid payload that violates schema validation
            content.DraftContentJson = JsonSerializer.Serialize(new
            {
                headline = "Hacked or Corrupted Content",
                unsupportedIllegalField = "Injection attempt",
                scriptTag = "<script>alert('hack')</script>"
            });
            content.Version += 1;
            await db.SaveChangesAsync();
        }

        // 3. Attempt to publish the invalid draft
        var pubResp = await client.PostAsJsonAsync("/api/v1/website/content/hero/publish", new { });
        Assert.Equal(HttpStatusCode.BadRequest, pubResp.StatusCode);
        var errContent = await pubResp.Content.ReadAsStringAsync();
        Assert.Contains("VALIDATION_FAILED", errContent);

        // 4. Verify Atomic Safety: Existing live published content MUST NOT be modified or corrupted!
        var verifyResp = await client.GetAsync("/api/v1/website/content/hero");
        verifyResp.EnsureSuccessStatusCode();
        var afterFailSection = await verifyResp.Content.ReadFromJsonAsync<ContentSectionDetailDto>();
        Assert.NotNull(afterFailSection);
        Assert.NotNull(afterFailSection.PublishedFields);
        var liveHeadline = afterFailSection.PublishedFields.Value.GetProperty("headline").GetString();
        Assert.Equal("Transform Your Space.", liveHeadline); // Intact and working!

        // Also verify public endpoint still serves original working content
        var publicResp = await client.GetAsync($"/api/v1/website/published-content?domain={uniqueDomain}");
        publicResp.EnsureSuccessStatusCode();
        var publicData = await publicResp.Content.ReadFromJsonAsync<PublishedWebsiteContentDto>();
        Assert.NotNull(publicData);
        Assert.Equal("Transform Your Space.", publicData.Sections["hero"].GetProperty("headline").GetString());
    }

    [Fact]
    public async Task TenantIsolation_TenantCannotPublishOtherTenantContent()
    {
        var emailA = $"tenantA-pub-{Guid.NewGuid():N}@test.com";
        var clientA = await GetAuthenticatedClientAsync(emailA);
        await SetupAndConfirmBusinessContextAsync(clientA, "Tenant A Publishing", emailA);

        var emailB = $"tenantB-pub-{Guid.NewGuid():N}@test.com";
        var clientB = await GetAuthenticatedClientAsync(emailB);
        await SetupAndConfirmBusinessContextAsync(clientB, "Tenant B Publishing", emailB);

        // Tenant A updates and publishes their about section
        var aboutA = new
        {
            badge = "Craftsmanship A",
            title = "Spaces by Tenant A",
            description = "Description for Tenant A only.",
            pillars = new[] { "Pillar 1", "Pillar 2" }
        };
        var putA = await clientA.PutAsJsonAsync("/api/v1/website/content/about/draft", new { fields = aboutA });
        putA.EnsureSuccessStatusCode();
        var pubA = await clientA.PostAsJsonAsync("/api/v1/website/content/about/publish", new { });
        pubA.EnsureSuccessStatusCode();

        // Verify Tenant B's about section is completely unaffected
        var getB = await clientB.GetAsync("/api/v1/website/content/about");
        getB.EnsureSuccessStatusCode();
        var detailB = await getB.Content.ReadFromJsonAsync<ContentSectionDetailDto>();
        Assert.NotNull(detailB);
        Assert.NotNull(detailB.PublishedFields);
        var titleB = detailB.PublishedFields.Value.GetProperty("title").GetString();
        Assert.Contains("Tenant B Publishing", titleB);
        Assert.DoesNotContain("Tenant A", titleB);
    }
}

