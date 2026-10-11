using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.API.Controllers;
using Sparovia.Application.ContactActivity;
using Sparovia.Application.Identity;
using Sparovia.Application.Leads;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;
using Xunit;

namespace Sparovia.IntegrationTests;

public class WhatsAppSocialContactActivityTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public WhatsAppSocialContactActivityTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, Guid TenantId, Guid WebsiteId)> SetupTenantAsync(string email, string businessName, string domain)
    {
        var client = _factory.CreateClient();

        var regReq = new RegisterRequest
        {
            FullName = "Owner Test",
            Email = email,
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            AcceptedTerms = true
        };
        await client.PostAsJsonAsync("/api/v1/auth/register", regReq);

        Guid tenantId;
        Guid websiteId;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            db.Database.Migrate();
            var user = db.Users.Include(u => u.Memberships).Single(u => u.Email == email);
            user.EmailVerified = true;
            tenantId = user.Memberships.First().TenantId;

            var existingWebsite = db.Websites.FirstOrDefault(w => w.TenantId == tenantId);
            if (existingWebsite == null)
            {
                var website = new Website
                {
                    TenantId = tenantId,
                    Name = businessName,
                    Domain = domain,
                    ConnectionStatus = "Connected"
                };
                db.Websites.Add(website);
                db.SaveChanges();
                websiteId = website.Id;
            }
            else
            {
                websiteId = existingWebsite.Id;
            }

            var existingContext = db.BusinessContexts.FirstOrDefault(bc => bc.TenantId == tenantId);
            if (existingContext == null)
            {
                db.BusinessContexts.Add(new BusinessContext
                {
                    TenantId = tenantId,
                    BusinessName = businessName,
                    BusinessType = "Interior Design",
                    PrimaryCategory = "Residential",
                    BusinessEmail = email,
                    BusinessPhone = "+919876543210",
                    IsConfirmed = true,
                    ConfirmedAt = DateTime.UtcNow
                });
            }
            else
            {
                existingContext.IsConfirmed = true;
                existingContext.ConfirmedAt = DateTime.UtcNow;
            }

            db.SaveChanges();
        }

        // Login to obtain authentication cookie
        var loginReq = new SignInRequest
        {
            Email = email,
            Password = "Password123!"
        };
        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", loginReq);
        loginRes.EnsureSuccessStatusCode();

        return (client, tenantId, websiteId);
    }

    [Fact]
    public async Task WhatsAppTemplates_AdminCanCreateEditReorderAndSaveTemplates()
    {
        var email = $"wa-admin-{Guid.NewGuid():N}@test.sparovia.com";
        var (client, tenantId, _) = await SetupTenantAsync(email, "Luxury Living", "luxuryliving.com");

        // 1. Initial GET should provide 3 default client-authored templates
        var initialRes = await client.GetAsync("/api/v1/integrations/whatsapp");
        Assert.Equal(HttpStatusCode.OK, initialRes.StatusCode);
        var initialDto = await initialRes.Content.ReadFromJsonAsync<WhatsAppIntegrationDto>();
        Assert.NotNull(initialDto);
        Assert.False(initialDto.Enabled);
        Assert.NotEmpty(initialDto.Templates);
        Assert.True(initialDto.Templates.Count >= 3);

        // 2. Admin creates and reorders 3 custom client-authored templates
        var saveReq = new UpdateWhatsAppIntegrationRequest
        {
            Enabled = true,
            PhoneNumber = "9876543210",
            PrefilledMessage = "General inquiry about services",
            Templates = new List<WhatsAppTemplateDto>
            {
                new WhatsAppTemplateDto
                {
                    Id = "tpl-1",
                    Title = "Kitchen Estimate",
                    MessageText = "Hi, I would like an estimate for custom kitchen modular work.",
                    DisplayOrder = 1,
                    IsActive = true
                },
                new WhatsAppTemplateDto
                {
                    Id = "tpl-2",
                    Title = "Villa Consultation",
                    MessageText = "Hello, please schedule a villa consultation for our residence.",
                    DisplayOrder = 2,
                    IsActive = true
                },
                new WhatsAppTemplateDto
                {
                    Id = "tpl-3",
                    Title = "Wardrobe Catalogue",
                    MessageText = "Hi, can you share the catalogue for bespoke wardrobes?",
                    DisplayOrder = 3,
                    IsActive = false
                }
            }
        };

        var putRes = await client.PutAsJsonAsync("/api/v1/integrations/whatsapp", saveReq);
        Assert.Equal(HttpStatusCode.OK, putRes.StatusCode);
        var updatedDto = await putRes.Content.ReadFromJsonAsync<WhatsAppIntegrationDto>();
        Assert.NotNull(updatedDto);
        Assert.True(updatedDto.Enabled);
        Assert.Equal("919876543210", updatedDto.PhoneNumber);
        Assert.Equal(3, updatedDto.Templates.Count);
        Assert.Equal("Kitchen Estimate", updatedDto.Templates[0].Title);
        Assert.False(updatedDto.Templates[2].IsActive);

        // 3. GET retrieves saved templates in correct order
        var getRes = await client.GetAsync("/api/v1/integrations/whatsapp");
        Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);
        var reloadedDto = await getRes.Content.ReadFromJsonAsync<WhatsAppIntegrationDto>();
        Assert.NotNull(reloadedDto);
        Assert.Equal(3, reloadedDto.Templates.Count);
        Assert.Equal("Villa Consultation", reloadedDto.Templates[1].Title);
    }

    [Fact]
    public async Task WhatsAppTemplates_ValidationEnforcesMax4AndFieldLimits()
    {
        var email = $"wa-val-{Guid.NewGuid():N}@test.sparovia.com";
        var (client, _, _) = await SetupTenantAsync(email, "Validation Living", "validationliving.com");

        // Attempting to save more than 4 templates rejected
        var excessReq = new UpdateWhatsAppIntegrationRequest
        {
            Enabled = true,
            PhoneNumber = "9876543210",
            Templates = Enumerable.Range(1, 5).Select(i => new WhatsAppTemplateDto
            {
                Id = $"t-{i}",
                Title = $"Title {i}",
                MessageText = $"Message {i}",
                DisplayOrder = i,
                IsActive = true
            }).ToList()
        };
        var excessRes = await client.PutAsJsonAsync("/api/v1/integrations/whatsapp", excessReq);
        Assert.Equal(HttpStatusCode.BadRequest, excessRes.StatusCode);

        // Attempting empty title rejected
        var emptyTitleReq = new UpdateWhatsAppIntegrationRequest
        {
            Enabled = true,
            PhoneNumber = "9876543210",
            Templates = new List<WhatsAppTemplateDto>
            {
                new WhatsAppTemplateDto { Title = "   ", MessageText = "Valid text", IsActive = true }
            }
        };
        var emptyTitleRes = await client.PutAsJsonAsync("/api/v1/integrations/whatsapp", emptyTitleReq);
        Assert.Equal(HttpStatusCode.BadRequest, emptyTitleRes.StatusCode);

        // Attempting title > 100 characters rejected
        var longTitleReq = new UpdateWhatsAppIntegrationRequest
        {
            Enabled = true,
            PhoneNumber = "9876543210",
            Templates = new List<WhatsAppTemplateDto>
            {
                new WhatsAppTemplateDto { Title = new string('A', 101), MessageText = "Valid text", IsActive = true }
            }
        };
        var longTitleRes = await client.PutAsJsonAsync("/api/v1/integrations/whatsapp", longTitleReq);
        Assert.Equal(HttpStatusCode.BadRequest, longTitleRes.StatusCode);

        // Attempting message > 1000 characters rejected
        var longMsgReq = new UpdateWhatsAppIntegrationRequest
        {
            Enabled = true,
            PhoneNumber = "9876543210",
            Templates = new List<WhatsAppTemplateDto>
            {
                new WhatsAppTemplateDto { Title = "Valid", MessageText = new string('B', 1001), IsActive = true }
            }
        };
        var longMsgRes = await client.PutAsJsonAsync("/api/v1/integrations/whatsapp", longMsgReq);
        Assert.Equal(HttpStatusCode.BadRequest, longMsgRes.StatusCode);

        // Enabled with no active templates rejected
        var noActiveReq = new UpdateWhatsAppIntegrationRequest
        {
            Enabled = true,
            PhoneNumber = "9876543210",
            Templates = new List<WhatsAppTemplateDto>
            {
                new WhatsAppTemplateDto { Title = "Inactive 1", MessageText = "Text 1", IsActive = false }
            }
        };
        var noActiveRes = await client.PutAsJsonAsync("/api/v1/integrations/whatsapp", noActiveReq);
        Assert.Equal(HttpStatusCode.BadRequest, noActiveRes.StatusCode);
    }

    [Fact]
    public async Task SocialLinks_AdminCanConfigureWithSchemeValidation()
    {
        var email = $"social-{Guid.NewGuid():N}@test.sparovia.com";
        var (client, _, _) = await SetupTenantAsync(email, "Social Living", "socialliving.com");

        // 1. Initial GET returns empty defaults
        var getRes = await client.GetAsync("/api/v1/integrations/social");
        Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);
        var initialDto = await getRes.Content.ReadFromJsonAsync<SocialLinksIntegrationDto>();
        Assert.NotNull(initialDto);
        Assert.False(initialDto.FacebookEnabled);
        Assert.False(initialDto.InstagramEnabled);

        // 2. Reject unsafe schemes (javascript:)
        var unsafeReq = new UpdateSocialLinksIntegrationRequest
        {
            FacebookUrl = "javascript:alert('xss')",
            FacebookEnabled = true
        };
        var unsafeRes = await client.PutAsJsonAsync("/api/v1/integrations/social", unsafeReq);
        Assert.Equal(HttpStatusCode.BadRequest, unsafeRes.StatusCode);

        // 3. Reject unsafe schemes (data:)
        var dataSchemeReq = new UpdateSocialLinksIntegrationRequest
        {
            InstagramUrl = "data:text/html,<script>alert(1)</script>",
            InstagramEnabled = true
        };
        var dataSchemeRes = await client.PutAsJsonAsync("/api/v1/integrations/social", dataSchemeReq);
        Assert.Equal(HttpStatusCode.BadRequest, dataSchemeRes.StatusCode);

        // 4. Accept valid HTTPS social URLs
        var validReq = new UpdateSocialLinksIntegrationRequest
        {
            FacebookUrl = "https://facebook.com/socialliving",
            FacebookEnabled = true,
            InstagramUrl = "https://instagram.com/socialliving",
            InstagramEnabled = true
        };
        var validRes = await client.PutAsJsonAsync("/api/v1/integrations/social", validReq);
        Assert.Equal(HttpStatusCode.OK, validRes.StatusCode);
        var validDto = await validRes.Content.ReadFromJsonAsync<SocialLinksIntegrationDto>();
        Assert.NotNull(validDto);
        Assert.True(validDto.FacebookEnabled);
        Assert.Equal("https://facebook.com/socialliving", validDto.FacebookUrl);
        Assert.True(validDto.InstagramEnabled);
        Assert.Equal("https://instagram.com/socialliving", validDto.InstagramUrl);
    }

    [Fact]
    public async Task ContactActivity_TracksClicksWithoutCreatingOrIncrementingLeads()
    {
        var email = $"activity-{Guid.NewGuid():N}@test.sparovia.com";
        var domain = $"activity-{Guid.NewGuid():N}.com";
        var (client, tenantId, websiteId) = await SetupTenantAsync(email, "Activity Living", domain);

        var publicClient = _factory.CreateClient();
        publicClient.DefaultRequestHeaders.Host = domain;

        // 1. Initially 0 leads
        var initialLeadsRes = await client.GetAsync("/api/v1/leads?pageSize=10");
        Assert.Equal(HttpStatusCode.OK, initialLeadsRes.StatusCode);
        var initialLeads = await initialLeadsRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, initialLeads.GetProperty("totalCount").GetInt32());

        // 2. Track WhatsApp click
        var waReq = new RecordContactActivityRequest
        {
            Channel = "WhatsApp",
            EventType = "ContactLinkClicked",
            TemplateId = "tpl-kitchen",
            TemplateTitle = "Kitchen Estimate",
            Source = "SocialControl",
            CorrelationId = Guid.NewGuid().ToString()
        };
        var waRes = await publicClient.PostAsJsonAsync("/api/v1/contact-activity/public", waReq);
        Assert.Equal(HttpStatusCode.OK, waRes.StatusCode);

        // 3. Track Facebook click
        var fbReq = new RecordContactActivityRequest
        {
            Channel = "Facebook",
            EventType = "ContactLinkClicked",
            Source = "SocialControl",
            CorrelationId = Guid.NewGuid().ToString()
        };
        var fbRes = await publicClient.PostAsJsonAsync("/api/v1/contact-activity/public", fbReq);
        Assert.Equal(HttpStatusCode.OK, fbRes.StatusCode);

        // 4. Track Instagram click
        var igReq = new RecordContactActivityRequest
        {
            Channel = "Instagram",
            EventType = "ContactLinkClicked",
            Source = "Footer",
            CorrelationId = Guid.NewGuid().ToString()
        };
        var igRes = await publicClient.PostAsJsonAsync("/api/v1/contact-activity/public", igReq);
        Assert.Equal(HttpStatusCode.OK, igRes.StatusCode);

        // 5. Verify Contact Activity Summary in Admin
        var summaryRes = await client.GetAsync("/api/v1/contact-activity/summary");
        Assert.Equal(HttpStatusCode.OK, summaryRes.StatusCode);
        var summaryDto = await summaryRes.Content.ReadFromJsonAsync<ContactActivitySummaryDto>();
        Assert.NotNull(summaryDto);
        Assert.Equal(3, summaryDto.TotalClicks);
        Assert.Equal(1, summaryDto.WhatsAppClicks);
        Assert.Equal(1, summaryDto.FacebookClicks);
        Assert.Equal(1, summaryDto.InstagramClicks);

        // 6. Verify Contact Activity List filtered by channel
        var waListRes = await client.GetAsync("/api/v1/contact-activity?channel=WhatsApp");
        Assert.Equal(HttpStatusCode.OK, waListRes.StatusCode);
        var waList = await waListRes.Content.ReadFromJsonAsync<ContactActivityListResponse>();
        Assert.NotNull(waList);
        Assert.Equal(1, waList.TotalCount);
        Assert.Equal("Kitchen Estimate", waList.Items[0].TemplateTitle);

        // 7. CRITICAL: Verify Leads count is STILL ZERO. Outbound clicks must never create Leads!
        var leadsAfterClicksRes = await client.GetAsync("/api/v1/leads?pageSize=10");
        Assert.Equal(HttpStatusCode.OK, leadsAfterClicksRes.StatusCode);
        var leadsAfterClicks = await leadsAfterClicksRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, leadsAfterClicks.GetProperty("totalCount").GetInt32());

        // 8. Submit an actual form submission and verify it DOES create a genuine Lead
        var formReq = new PublicWebsiteLeadRequest
        {
            Name = "Priya Sharma",
            Phone = "+91 98765 43210",
            Email = "priya@example.com",
            Message = "Full 3BHK modular interiors",
            Domain = domain
        };
        var formRes = await publicClient.PostAsJsonAsync("/api/v1/leads/public", formReq);
        Assert.Equal(HttpStatusCode.OK, formRes.StatusCode);

        // Verify that only the form submission created a Lead (totalCount == 1)
        var leadsAfterFormRes = await client.GetAsync("/api/v1/leads?pageSize=10");
        var leadsAfterForm = await leadsAfterFormRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, leadsAfterForm.GetProperty("totalCount").GetInt32());
    }

    [Fact]
    public async Task ContactActivity_EnforcesTenantIsolation()
    {
        var domainA = $"tenant-a-{Guid.NewGuid():N}.com";
        var domainB = $"tenant-b-{Guid.NewGuid():N}.com";

        var (clientA, _, _) = await SetupTenantAsync($"tenant-a-{Guid.NewGuid():N}@test.sparovia.com", "Tenant A", domainA);
        var (clientB, _, _) = await SetupTenantAsync($"tenant-b-{Guid.NewGuid():N}@test.sparovia.com", "Tenant B", domainB);

        var publicA = _factory.CreateClient();
        publicA.DefaultRequestHeaders.Host = domainA;

        var publicB = _factory.CreateClient();
        publicB.DefaultRequestHeaders.Host = domainB;

        // Record 2 clicks for Tenant A
        await publicA.PostAsJsonAsync("/api/v1/contact-activity/public", new RecordContactActivityRequest { Channel = "WhatsApp" });
        await publicA.PostAsJsonAsync("/api/v1/contact-activity/public", new RecordContactActivityRequest { Channel = "Facebook" });

        // Record 1 click for Tenant B
        await publicB.PostAsJsonAsync("/api/v1/contact-activity/public", new RecordContactActivityRequest { Channel = "Instagram" });

        // Verify Tenant A sees exactly 2 clicks
        var summaryA = await clientA.GetFromJsonAsync<ContactActivitySummaryDto>("/api/v1/contact-activity/summary");
        Assert.NotNull(summaryA);
        Assert.Equal(2, summaryA.TotalClicks);
        Assert.Equal(1, summaryA.WhatsAppClicks);
        Assert.Equal(1, summaryA.FacebookClicks);
        Assert.Equal(0, summaryA.InstagramClicks);

        // Verify Tenant B sees exactly 1 click
        var summaryB = await clientB.GetFromJsonAsync<ContactActivitySummaryDto>("/api/v1/contact-activity/summary");
        Assert.NotNull(summaryB);
        Assert.Equal(1, summaryB.TotalClicks);
        Assert.Equal(0, summaryB.WhatsAppClicks);
        Assert.Equal(0, summaryB.FacebookClicks);
        Assert.Equal(1, summaryB.InstagramClicks);
    }

    [Fact]
    public async Task AdminToggleSettings_ControlPublicWebsiteVisibilityPipeline()
    {
        var email = $"toggle-{Guid.NewGuid():N}@test.sparovia.com";
        var domain = $"toggle-{Guid.NewGuid():N}.com";
        var (client, tenantId, websiteId) = await SetupTenantAsync(email, "Toggle Interiors", domain);

        var publicClient = _factory.CreateClient();
        publicClient.DefaultRequestHeaders.Host = domain;

        // 1. Initially WhatsApp and Social are disabled
        var initContentRes = await publicClient.GetAsync($"/api/v1/website/published-content?domain={domain}");
        Assert.Equal(HttpStatusCode.OK, initContentRes.StatusCode);
        var initContent = await initContentRes.Content.ReadFromJsonAsync<JsonElement>();
        var initSections = initContent.GetProperty("sections");
        var initWa = initSections.GetProperty("whatsapp");
        Assert.False(initWa.GetProperty("enabled").GetBoolean());
        var initSocial = initSections.GetProperty("social");
        Assert.False(initSocial.GetProperty("facebookEnabled").GetBoolean());
        Assert.False(initSocial.GetProperty("instagramEnabled").GetBoolean());

        // 2. Enable WhatsApp with phone and templates
        var waReq = new UpdateWhatsAppIntegrationRequest
        {
            Enabled = true,
            PhoneNumber = "9876543210",
            PrefilledMessage = "Need consultation",
            Templates = new List<WhatsAppTemplateDto>
            {
                new WhatsAppTemplateDto { Id = "t-1", Title = "Kitchen", MessageText = "Kitchen info", DisplayOrder = 1, IsActive = true },
                new WhatsAppTemplateDto { Id = "t-2", Title = "Living", MessageText = "Living info", DisplayOrder = 2, IsActive = false }
            }
        };
        var waSaveRes = await client.PutAsJsonAsync("/api/v1/integrations/whatsapp", waReq);
        Assert.Equal(HttpStatusCode.OK, waSaveRes.StatusCode);

        // 3. Enable Facebook only, keep Instagram disabled
        var socialReq = new UpdateSocialLinksIntegrationRequest
        {
            FacebookUrl = "https://facebook.com/toggleinteriors",
            FacebookEnabled = true,
            InstagramUrl = "",
            InstagramEnabled = false
        };
        var socialSaveRes = await client.PutAsJsonAsync("/api/v1/integrations/social", socialReq);
        Assert.Equal(HttpStatusCode.OK, socialSaveRes.StatusCode);

        // 4. Verify public published content reflects enabled WhatsApp and Facebook, but disabled Instagram
        var pubRes1 = await publicClient.GetAsync($"/api/v1/website/published-content?domain={domain}");
        Assert.Equal(HttpStatusCode.OK, pubRes1.StatusCode);
        var pubContent1 = await pubRes1.Content.ReadFromJsonAsync<JsonElement>();
        var sections1 = pubContent1.GetProperty("sections");
        var wa1 = sections1.GetProperty("whatsapp");
        Assert.True(wa1.GetProperty("enabled").GetBoolean());
        Assert.Equal("919876543210", wa1.GetProperty("phoneNumber").GetString());

        var social1 = sections1.GetProperty("social");
        Assert.True(social1.GetProperty("facebookEnabled").GetBoolean());
        Assert.Equal("https://facebook.com/toggleinteriors", social1.GetProperty("facebookUrl").GetString());
        Assert.False(social1.GetProperty("instagramEnabled").GetBoolean());

        // 5. Admin explicitly disables WhatsApp and Facebook
        var waDisableReq = new UpdateWhatsAppIntegrationRequest
        {
            Enabled = false,
            PhoneNumber = "9876543210",
            Templates = new List<WhatsAppTemplateDto>
            {
                new WhatsAppTemplateDto { Id = "t-1", Title = "Kitchen", MessageText = "Kitchen info", DisplayOrder = 1, IsActive = true }
            }
        };
        var waDisableRes = await client.PutAsJsonAsync("/api/v1/integrations/whatsapp", waDisableReq);
        Assert.Equal(HttpStatusCode.OK, waDisableRes.StatusCode);

        var socialDisableReq = new UpdateSocialLinksIntegrationRequest
        {
            FacebookUrl = "https://facebook.com/toggleinteriors",
            FacebookEnabled = false,
            InstagramUrl = "",
            InstagramEnabled = false
        };
        var socialDisableRes = await client.PutAsJsonAsync("/api/v1/integrations/social", socialDisableReq);
        Assert.Equal(HttpStatusCode.OK, socialDisableRes.StatusCode);

        // 6. Verify public published content strictly reflects disabled status
        var pubRes2 = await publicClient.GetAsync($"/api/v1/website/published-content?domain={domain}");
        Assert.Equal(HttpStatusCode.OK, pubRes2.StatusCode);
        var pubContent2 = await pubRes2.Content.ReadFromJsonAsync<JsonElement>();
        var sections2 = pubContent2.GetProperty("sections");
        var wa2 = sections2.GetProperty("whatsapp");
        Assert.False(wa2.GetProperty("enabled").GetBoolean());
        var social2 = sections2.GetProperty("social");
        Assert.False(social2.GetProperty("facebookEnabled").GetBoolean());
        Assert.False(social2.GetProperty("instagramEnabled").GetBoolean());
    }
}
