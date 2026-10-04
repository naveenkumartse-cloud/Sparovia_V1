using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Identity;
using Sparovia.Application.Leads;
using Sparovia.Application.Onboarding;
using Sparovia.Domain.Constants;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;

namespace Sparovia.IntegrationTests;

public class LeadManagementTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public LeadManagementTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, Guid TenantId, Guid UserId)> SetupTenantAsync(string email, string businessName, string domain)
    {
        var client = _factory.CreateClient();

        var regReq = new RegisterRequest
        {
            FullName = "Lead Manager",
            Email = email,
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            AcceptedTerms = true
        };
        await client.PostAsJsonAsync("/api/v1/auth/register", regReq);

        Guid tenantId;
        Guid userId;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();
            db.Database.Migrate();
            var user = db.Users.Include(u => u.Memberships).Single(u => u.Email == email);
            user.EmailVerified = true;
            userId = user.Id;
            tenantId = user.Memberships.First().TenantId;

            // Ensure connected website
            var existingWebsite = db.Websites.FirstOrDefault(w => w.TenantId == tenantId);
            if (existingWebsite == null)
            {
                db.Websites.Add(new Website
                {
                    TenantId = tenantId,
                    Name = businessName,
                    Domain = domain,
                    ConnectionStatus = "Connected"
                });
            }
            await db.SaveChangesAsync();
        }

        var loginReq = new SignInRequest
        {
            Email = email,
            Password = "Password123!"
        };
        await client.PostAsJsonAsync("/api/v1/auth/login", loginReq);

        // Confirm Business Context so onboarding gate passes
        var basics = new BusinessBasicsDto
        {
            BusinessName = businessName,
            BusinessType = "Local Service Business",
            PrimaryCategory = "Interiors",
            BusinessEmail = email,
            BusinessPhone = "+91 98765 43210",
            Website = $"https://{domain}"
        };
        var respBasics = await client.PutAsJsonAsync("/api/v1/onboarding/business-basics", basics);
        respBasics.EnsureSuccessStatusCode();

        var location = new LocationAndCustomersDto
        {
            AddressLine1 = "100 Design Studio Way",
            City = "Chennai",
            State = "Tamil Nadu",
            PostalCode = "600001",
            Country = "India",
            ServiceAreas = new List<string> { "Chennai Metro" }
        };
        var respLoc = await client.PutAsJsonAsync("/api/v1/onboarding/location-customers", location);
        respLoc.EnsureSuccessStatusCode();

        var svc = new ServiceDto { ServiceName = "Modular Kitchens", ServiceDescription = "Tailored kitchen design" };
        var respSvc = await client.PostAsJsonAsync("/api/v1/onboarding/services", svc);
        respSvc.EnsureSuccessStatusCode();

        var confirmResp = await client.PostAsync("/api/v1/onboarding/confirm", null);
        confirmResp.EnsureSuccessStatusCode();

        return (client, tenantId, userId);
    }

    [Fact]
    public async Task WebsiteEnquiry_CreatesLead_WithServerControlledTenantAndStatus()
    {
        var unique = Guid.NewGuid().ToString("N")[..8];
        var domain = $"{unique}-decor.com";
        var (client, tenantId, _) = await SetupTenantAsync($"{unique}@example.com", "Decor Studio", domain);

        // 1. Submit public lead
        var publicClient = _factory.CreateClient();
        var leadReq = new PublicWebsiteLeadRequest
        {
            Name = "John Kumar",
            Phone = "+91 98765 43210",
            Email = "john@example.com",
            Service = "Modular Kitchen",
            Message = "Need consultation for 3BHK flat",
            Domain = domain
        };

        var submitResponse = await publicClient.PostAsJsonAsync("/api/v1/leads/public", leadReq);
        Assert.Equal(HttpStatusCode.OK, submitResponse.StatusCode);

        // 2. Fetch tenant leads as authenticated Admin
        var listResponse = await client.GetAsync("/api/v1/leads");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var list = await listResponse.Content.ReadFromJsonAsync<LeadListResponse>();
        Assert.NotNull(list);
        Assert.True(list.TotalCount >= 1);

        var createdLead = list.Items.FirstOrDefault(l => l.Name == "John Kumar");
        Assert.NotNull(createdLead);
        Assert.Equal("+919876543210", createdLead.Phone);
        Assert.Equal("john@example.com", createdLead.Email);
        Assert.Equal(LeadSource.Website, createdLead.Source);
        Assert.Equal(LeadStatus.New, createdLead.Status);
        Assert.Contains("Modular Kitchen", createdLead.Message);
    }

    [Fact]
    public async Task TenantIsolation_TenantACannotAccessOrModifyTenantBLead()
    {
        var uniqueA = Guid.NewGuid().ToString("N")[..8];
        var domainA = $"{uniqueA}-tenant-a.com";
        var (clientA, tenantIdA, _) = await SetupTenantAsync($"{uniqueA}@a.com", "Tenant A Interiors", domainA);

        var uniqueB = Guid.NewGuid().ToString("N")[..8];
        var domainB = $"{uniqueB}-tenant-b.com";
        var (clientB, tenantIdB, _) = await SetupTenantAsync($"{uniqueB}@b.com", "Tenant B Interiors", domainB);

        // Submit lead for Tenant B
        var publicClient = _factory.CreateClient();
        await publicClient.PostAsJsonAsync("/api/v1/leads/public", new PublicWebsiteLeadRequest
        {
            Name = "Customer For B",
            Phone = "9876543210",
            Email = "leadB@example.com",
            Message = "Inquiry for tenant B",
            Domain = domainB
        });

        // Get Tenant B's leads to get leadId
        var listB = await clientB.GetFromJsonAsync<LeadListResponse>("/api/v1/leads");
        var leadB = listB!.Items.First(l => l.Name == "Customer For B");

        // 1. Tenant A attempts to view Tenant B's lead -> 404 Not Found
        var crossGetResp = await clientA.GetAsync($"/api/v1/leads/{leadB.Id}");
        Assert.Equal(HttpStatusCode.NotFound, crossGetResp.StatusCode);

        // 2. Tenant A attempts to update Tenant B's lead status -> 404 Not Found
        var crossStatusResp = await clientA.PatchAsJsonAsync($"/api/v1/leads/{leadB.Id}/status", new UpdateLeadStatusRequest
        {
            Status = LeadStatus.Contacted
        });
        Assert.Equal(HttpStatusCode.NotFound, crossStatusResp.StatusCode);

        // 3. Tenant A attempts to edit Tenant B's lead -> 404 Not Found
        var crossEditResp = await clientA.PutAsJsonAsync($"/api/v1/leads/{leadB.Id}", new UpdateLeadRequest
        {
            Name = "Hacked Name",
            Phone = "9876543210",
            Message = "Hacked message"
        });
        Assert.Equal(HttpStatusCode.NotFound, crossEditResp.StatusCode);

        // 4. Tenant A attempts to delete Tenant B's lead -> 404 Not Found
        var crossDeleteResp = await clientA.DeleteAsync($"/api/v1/leads/{leadB.Id}");
        Assert.Equal(HttpStatusCode.NotFound, crossDeleteResp.StatusCode);

        // 5. Tenant A's lead list must NOT include Tenant B's lead
        var listA = await clientA.GetFromJsonAsync<LeadListResponse>("/api/v1/leads");
        Assert.DoesNotContain(listA!.Items, l => l.Id == leadB.Id);
    }

    [Fact]
    public async Task UnauthenticatedAndPublic_CannotReadOrUpdateLeads()
    {
        var publicClient = _factory.CreateClient();

        // Unauthenticated access to /api/v1/leads must be 401 Unauthorized
        var readResp = await publicClient.GetAsync("/api/v1/leads");
        Assert.Equal(HttpStatusCode.Unauthorized, readResp.StatusCode);

        var updateResp = await publicClient.PatchAsJsonAsync($"/api/v1/leads/{Guid.NewGuid()}/status", new UpdateLeadStatusRequest
        {
            Status = LeadStatus.Contacted
        });
        Assert.Equal(HttpStatusCode.Unauthorized, updateResp.StatusCode);
    }

    [Fact]
    public async Task StatusUpdate_FollowsApprovedTransitionsAndAudits()
    {
        var unique = Guid.NewGuid().ToString("N")[..8];
        var domain = $"{unique}-design.com";
        var (client, _, _) = await SetupTenantAsync($"{unique}@design.com", "Design Pro", domain);

        var publicClient = _factory.CreateClient();
        await publicClient.PostAsJsonAsync("/api/v1/leads/public", new PublicWebsiteLeadRequest
        {
            Name = "Alice Sharma",
            Phone = "9876543210",
            Message = "Need living room design",
            Domain = domain
        });

        var list = await client.GetFromJsonAsync<LeadListResponse>("/api/v1/leads");
        var lead = list!.Items.First(l => l.Name == "Alice Sharma");
        Assert.Equal(LeadStatus.New, lead.Status);

        // 1. Update status to Contacted
        var update1 = await client.PatchAsJsonAsync($"/api/v1/leads/{lead.Id}/status", new UpdateLeadStatusRequest
        {
            Status = LeadStatus.Contacted
        });
        Assert.Equal(HttpStatusCode.OK, update1.StatusCode);
        var updatedLead1 = await update1.Content.ReadFromJsonAsync<LeadDto>();
        Assert.Equal(LeadStatus.Contacted, updatedLead1!.Status);

        // 2. Update status to Qualified
        var update2 = await client.PatchAsJsonAsync($"/api/v1/leads/{lead.Id}/status", new UpdateLeadStatusRequest
        {
            Status = LeadStatus.Qualified
        });
        Assert.Equal(HttpStatusCode.OK, update2.StatusCode);
        var updatedLead2 = await update2.Content.ReadFromJsonAsync<LeadDto>();
        Assert.Equal(LeadStatus.Qualified, updatedLead2!.Status);

        // 3. Update status to Closed
        var update3 = await client.PatchAsJsonAsync($"/api/v1/leads/{lead.Id}/status", new UpdateLeadStatusRequest
        {
            Status = LeadStatus.Closed
        });
        Assert.Equal(HttpStatusCode.OK, update3.StatusCode);
        var updatedLead3 = await update3.Content.ReadFromJsonAsync<LeadDto>();
        Assert.Equal(LeadStatus.Closed, updatedLead3!.Status);

        // 4. Attempt invalid status
        var updateInvalid = await client.PatchAsJsonAsync($"/api/v1/leads/{lead.Id}/status", new UpdateLeadStatusRequest
        {
            Status = "WonDeal" // Unapproved status
        });
        Assert.Equal(HttpStatusCode.BadRequest, updateInvalid.StatusCode);
    }

    [Fact]
    public async Task WhatsAppWebhook_CreatesLeadAndIsIdempotentOnRetry()
    {
        var unique = Guid.NewGuid().ToString("N")[..8];
        var domain = $"{unique}-wa.com";
        var (client, tenantId, _) = await SetupTenantAsync($"{unique}@wa.com", "WA Business", domain);

        var publicClient = _factory.CreateClient();
        var msgId = $"WAMID_{Guid.NewGuid():N}";

        var webhookReq = new WhatsAppLeadWebhookRequest
        {
            CustomerName = "Rajesh Patel",
            Phone = "+91 91234 56789",
            Message = "Looking for wardrobe estimation",
            MessageId = msgId,
            Timestamp = DateTime.UtcNow
        };

        // 1. First webhook event delivery
        var res1 = await publicClient.PostAsJsonAsync($"/api/v1/leads/webhook/whatsapp?tenantId={tenantId}", webhookReq);
        Assert.Equal(HttpStatusCode.OK, res1.StatusCode);

        // 2. Second webhook event delivery with identical MessageId (idempotent retry)
        var res2 = await publicClient.PostAsJsonAsync($"/api/v1/leads/webhook/whatsapp?tenantId={tenantId}", webhookReq);
        Assert.Equal(HttpStatusCode.OK, res2.StatusCode);

        // 3. Verify exactly 1 lead created
        var leads = await client.GetFromJsonAsync<LeadListResponse>($"/api/v1/leads?search={Uri.EscapeDataString("Rajesh Patel")}");
        Assert.NotNull(leads);
        Assert.Equal(1, leads.TotalCount);
        var lead = leads.Items[0];
        Assert.Equal(LeadSource.WhatsApp, lead.Source);
        Assert.Equal(msgId, lead.SourceReference);
        Assert.Equal("+919123456789", lead.Phone);
    }

    [Fact]
    public async Task PublicLeadValidation_RejectsInvalidInput()
    {
        var publicClient = _factory.CreateClient();

        // 1. Missing name
        var res1 = await publicClient.PostAsJsonAsync("/api/v1/leads/public", new PublicWebsiteLeadRequest
        {
            Name = "",
            Phone = "9876543210",
            Message = "Some message"
        });
        Assert.Equal(HttpStatusCode.BadRequest, res1.StatusCode);

        // 2. Invalid phone
        var res2 = await publicClient.PostAsJsonAsync("/api/v1/leads/public", new PublicWebsiteLeadRequest
        {
            Name = "Valid Name",
            Phone = "invalid-phone",
            Message = "Some message"
        });
        Assert.Equal(HttpStatusCode.BadRequest, res2.StatusCode);

        // 3. Invalid email
        var res3 = await publicClient.PostAsJsonAsync("/api/v1/leads/public", new PublicWebsiteLeadRequest
        {
            Name = "Valid Name",
            Phone = "9876543210",
            Email = "not-an-email",
            Message = "Some message"
        });
        Assert.Equal(HttpStatusCode.BadRequest, res3.StatusCode);

        // 4. Missing message
        var res4 = await publicClient.PostAsJsonAsync("/api/v1/leads/public", new PublicWebsiteLeadRequest
        {
            Name = "Valid Name",
            Phone = "9876543210",
            Message = ""
        });
        Assert.Equal(HttpStatusCode.BadRequest, res4.StatusCode);
    }

    [Fact]
    public async Task ManualLeadCrud_CreateEditDelete_FlowSucceeds()
    {
        var unique = Guid.NewGuid().ToString("N")[..8];
        var domain = $"{unique}-manual.com";
        var (client, tenantId, _) = await SetupTenantAsync($"{unique}@manual.com", "Manual Lead Interiors", domain);

        // 1. Manual Create Lead
        var addReq = new CreateLeadRequest
        {
            Name = "Walk-in Client",
            Phone = "+91 98765 11223",
            Email = "walkin@example.com",
            Message = "Walked in to discuss whole home renovation budget",
            Source = LeadSource.Website,
            Status = LeadStatus.New
        };

        var createResp = await client.PostAsJsonAsync("/api/v1/leads", addReq);
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);

        var createdLead = await createResp.Content.ReadFromJsonAsync<LeadDto>();
        Assert.NotNull(createdLead);
        Assert.Equal("Walk-in Client", createdLead.Name);
        Assert.Equal("+919876511223", createdLead.Phone);
        Assert.Equal("walkin@example.com", createdLead.Email);
        Assert.Equal(LeadStatus.New, createdLead.Status);

        // 2. Manual Edit Lead
        var editReq = new UpdateLeadRequest
        {
            Name = "Walk-in Client - VIP",
            Phone = "+91 98765 11223",
            Email = "vip.walkin@example.com",
            Message = "Updated scope: 4BHK luxury interior complete turnkey",
            Status = LeadStatus.Qualified
        };

        var editResp = await client.PutAsJsonAsync($"/api/v1/leads/{createdLead.Id}", editReq);
        Assert.Equal(HttpStatusCode.OK, editResp.StatusCode);

        var updatedLead = await editResp.Content.ReadFromJsonAsync<LeadDto>();
        Assert.NotNull(updatedLead);
        Assert.Equal("Walk-in Client - VIP", updatedLead.Name);
        Assert.Equal("vip.walkin@example.com", updatedLead.Email);
        Assert.Equal(LeadStatus.Qualified, updatedLead.Status);
        Assert.Contains("luxury interior", updatedLead.Message);

        // 3. Get Lead By Id
        var getResp = await client.GetAsync($"/api/v1/leads/{createdLead.Id}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var fetchedLead = await getResp.Content.ReadFromJsonAsync<LeadDto>();
        Assert.NotNull(fetchedLead);
        Assert.Equal("Walk-in Client - VIP", fetchedLead.Name);

        // 4. Delete Lead
        var deleteResp = await client.DeleteAsync($"/api/v1/leads/{createdLead.Id}");
        Assert.Equal(HttpStatusCode.OK, deleteResp.StatusCode);

        // 5. Verify lead is gone
        var getAfterDelete = await client.GetAsync($"/api/v1/leads/{createdLead.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getAfterDelete.StatusCode);
    }
}
