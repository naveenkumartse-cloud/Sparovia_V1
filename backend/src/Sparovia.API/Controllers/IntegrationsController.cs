using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sparovia.Infrastructure.Data;
using Sparovia.Domain.Entities;

namespace Sparovia.API.Controllers;

public record WhatsAppTemplateDto
{
    public string Id { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string MessageText { get; init; } = string.Empty;
    public int DisplayOrder { get; init; }
    public bool IsActive { get; init; } = true;
}

public record WhatsAppIntegrationDto
{
    public bool Enabled { get; init; }
    public string PhoneNumber { get; init; } = string.Empty;
    public string PrefilledMessage { get; init; } = string.Empty;
    public string Status { get; init; } = "Inactive";
    public List<WhatsAppTemplateDto> Templates { get; init; } = new();
}

public record UpdateWhatsAppIntegrationRequest
{
    public bool Enabled { get; init; }
    public string? PhoneNumber { get; init; }
    public string? PrefilledMessage { get; init; }
    public List<WhatsAppTemplateDto>? Templates { get; init; }
}

public record SocialLinksIntegrationDto
{
    public string FacebookUrl { get; init; } = string.Empty;
    public bool FacebookEnabled { get; init; }
    public string InstagramUrl { get; init; } = string.Empty;
    public bool InstagramEnabled { get; init; }
}

public record UpdateSocialLinksIntegrationRequest
{
    public string? FacebookUrl { get; init; }
    public bool FacebookEnabled { get; init; }
    public string? InstagramUrl { get; init; }
    public bool InstagramEnabled { get; init; }
}

[ApiController]
[Route("api/v1/integrations")]
[Authorize]
public class IntegrationsController : ControllerBase
{
    private readonly SparoviaDbContext _dbContext;
    private readonly ILogger<IntegrationsController> _logger;

    public IntegrationsController(SparoviaDbContext dbContext, ILogger<IntegrationsController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    private bool TryGetTenantId(out Guid tenantId, out IActionResult? failureResult)
    {
        var tenantIdStr = User.FindFirst("TenantId")?.Value;
        if (!Guid.TryParse(tenantIdStr, out tenantId))
        {
            failureResult = Unauthorized(new { Error = "Tenant context not found in session." });
            return false;
        }

        failureResult = null;
        return true;
    }

    private async Task<Website> GetOrCreateWebsiteAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var website = await _dbContext.Websites
            .FirstOrDefaultAsync(w => w.TenantId == tenantId, cancellationToken);

        if (website == null)
        {
            var businessContext = await _dbContext.BusinessContexts
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

            var name = !string.IsNullOrWhiteSpace(businessContext?.BusinessName)
                ? businessContext.BusinessName
                : "Sparovia Website";

            var domain = !string.IsNullOrWhiteSpace(businessContext?.Website)
                ? businessContext.Website.Replace("https://", "").Replace("http://", "").TrimEnd('/')
                : "sparovia-site.local";

            website = new Website
            {
                TenantId = tenantId,
                Name = name,
                Domain = domain,
                ConnectionStatus = "Connected",
                TemplateId = "modern-craft",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.Websites.Add(website);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return website;
    }

    public static List<WhatsAppTemplateDto> GetDefaultTemplates()
    {
        return new List<WhatsAppTemplateDto>
        {
            new WhatsAppTemplateDto
            {
                Id = "template-1",
                Title = "General Enquiry",
                MessageText = "Hi, I would like to inquire about interior design services for my space.",
                DisplayOrder = 1,
                IsActive = true
            },
            new WhatsAppTemplateDto
            {
                Id = "template-2",
                Title = "Design Consultation",
                MessageText = "Hello, I am interested in scheduling a personalized design consultation.",
                DisplayOrder = 2,
                IsActive = true
            },
            new WhatsAppTemplateDto
            {
                Id = "template-3",
                Title = "Request a Quote",
                MessageText = "Hi, I have floorplans ready and would like to request an estimate for interior work.",
                DisplayOrder = 3,
                IsActive = true
            }
        };
    }

    private static bool IsValidHttpUrl(string? url, out string normalizedUrl, out string? errorMessage)
    {
        normalizedUrl = string.Empty;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(url))
        {
            return true;
        }

        var trimmed = url.Trim();
        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
        {
            errorMessage = "URL must be a valid absolute URL (e.g. https://facebook.com/yourpage).";
            return false;
        }

        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
        {
            errorMessage = "Only HTTP and HTTPS URLs are allowed. Unsafe schemes (such as javascript: or data:) are rejected.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(uri.Host))
        {
            errorMessage = "URL must include a valid host domain.";
            return false;
        }

        normalizedUrl = uri.AbsoluteUri;
        return true;
    }

    [HttpGet("whatsapp")]
    public async Task<IActionResult> GetWhatsAppIntegration(CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var website = await GetOrCreateWebsiteAsync(tenantId, cancellationToken);

        var content = await _dbContext.WebsiteContents
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.WebsiteId == website.Id && c.SectionKey == "whatsapp", cancellationToken);

        if (content != null && !string.IsNullOrWhiteSpace(content.PublishedContentJson ?? content.DraftContentJson))
        {
            try
            {
                var json = content.PublishedContentJson ?? content.DraftContentJson!;
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                var enabled = root.TryGetProperty("enabled", out var eProp) && eProp.GetBoolean();
                var phone = root.TryGetProperty("phoneNumber", out var pProp) ? pProp.GetString() ?? "" : "";
                var msg = root.TryGetProperty("prefilledMessage", out var mProp) ? mProp.GetString() ?? "" : "";
                var status = root.TryGetProperty("status", out var sProp) ? sProp.GetString() ?? (enabled ? "Active" : "Inactive") : (enabled ? "Active" : "Inactive");

                var templates = new List<WhatsAppTemplateDto>();
                if (root.TryGetProperty("templates", out var tProp) && tProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in tProp.EnumerateArray())
                    {
                        var id = item.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? Guid.NewGuid().ToString() : Guid.NewGuid().ToString();
                        var title = item.TryGetProperty("title", out var titleProp) ? titleProp.GetString() ?? "" : "";
                        var text = item.TryGetProperty("messageText", out var textProp) ? textProp.GetString() ?? "" : "";
                        var order = item.TryGetProperty("displayOrder", out var orderProp) && orderProp.TryGetInt32(out var oVal) ? oVal : templates.Count + 1;
                        var active = !item.TryGetProperty("isActive", out var activeProp) || activeProp.GetBoolean();

                        if (!string.IsNullOrWhiteSpace(title) || !string.IsNullOrWhiteSpace(text))
                        {
                            templates.Add(new WhatsAppTemplateDto
                            {
                                Id = id,
                                Title = title,
                                MessageText = text,
                                DisplayOrder = order,
                                IsActive = active
                            });
                        }
                    }
                }

                if (templates.Count == 0)
                {
                    templates = GetDefaultTemplates();
                }

                return Ok(new WhatsAppIntegrationDto
                {
                    Enabled = enabled,
                    PhoneNumber = phone,
                    PrefilledMessage = msg,
                    Status = status,
                    Templates = templates.OrderBy(t => t.DisplayOrder).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse WhatsApp integration content json for website {WebsiteId}", website.Id);
            }
        }

        // Fallback to BusinessContext phone if available
        var businessContext = await _dbContext.BusinessContexts
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        var defaultPhone = businessContext?.BusinessPhone ?? "";

        return Ok(new WhatsAppIntegrationDto
        {
            Enabled = false,
            PhoneNumber = defaultPhone,
            PrefilledMessage = "Hi, I would like to inquire about interior design services.",
            Status = "Inactive",
            Templates = GetDefaultTemplates()
        });
    }

    [HttpPut("whatsapp")]
    public async Task<IActionResult> UpdateWhatsAppIntegration([FromBody] UpdateWhatsAppIntegrationRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var website = await GetOrCreateWebsiteAsync(tenantId, cancellationToken);

        var cleanedPhone = string.Empty;
        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            cleanedPhone = new string(request.PhoneNumber.Where(char.IsDigit).ToArray());
        }

        if (request.Enabled && string.IsNullOrWhiteSpace(cleanedPhone))
        {
            return BadRequest(new { Error = "A valid WhatsApp phone number is required when enabling WhatsApp integration." });
        }

        if (request.Enabled)
        {
            if (cleanedPhone.Length == 10)
            {
                cleanedPhone = "91" + cleanedPhone;
            }

            if (cleanedPhone.Length < 10 || cleanedPhone.Length > 15)
            {
                return BadRequest(new { Error = "WhatsApp phone number must contain 10 to 15 digits including country code." });
            }
        }

        var prefilledMessage = string.IsNullOrWhiteSpace(request.PrefilledMessage)
            ? "Hi, I would like to inquire about interior design services."
            : request.PrefilledMessage.Trim();

        var templates = new List<WhatsAppTemplateDto>();
        if (request.Templates != null && request.Templates.Count > 0)
        {
            if (request.Templates.Count > 4)
            {
                return BadRequest(new { Error = "A maximum of 4 WhatsApp templates are supported." });
            }

            for (int i = 0; i < request.Templates.Count; i++)
            {
                var t = request.Templates[i];
                if (string.IsNullOrWhiteSpace(t.Title))
                {
                    return BadRequest(new { Error = $"Template #{i + 1} must have a non-empty title." });
                }
                if (t.Title.Trim().Length > 100)
                {
                    return BadRequest(new { Error = $"Template #{i + 1} title cannot exceed 100 characters." });
                }
                if (string.IsNullOrWhiteSpace(t.MessageText))
                {
                    return BadRequest(new { Error = $"Template #{i + 1} must have message text." });
                }
                if (t.MessageText.Trim().Length > 1000)
                {
                    return BadRequest(new { Error = $"Template #{i + 1} message cannot exceed 1000 characters." });
                }

                templates.Add(new WhatsAppTemplateDto
                {
                    Id = string.IsNullOrWhiteSpace(t.Id) ? Guid.NewGuid().ToString() : t.Id.Trim(),
                    Title = t.Title.Trim(),
                    MessageText = t.MessageText.Trim(),
                    DisplayOrder = t.DisplayOrder > 0 ? t.DisplayOrder : i + 1,
                    IsActive = t.IsActive
                });
            }

            templates = templates.OrderBy(t => t.DisplayOrder).ToList();
        }
        else
        {
            templates = GetDefaultTemplates();
        }

        if (request.Enabled && !templates.Any(t => t.IsActive))
        {
            return BadRequest(new { Error = "At least one template must be active when WhatsApp integration is enabled." });
        }

        var status = request.Enabled ? "Active" : "Inactive";

        var payload = new
        {
            enabled = request.Enabled,
            phoneNumber = cleanedPhone,
            prefilledMessage = prefilledMessage,
            status = status,
            templates = templates
        };

        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        var content = await _dbContext.WebsiteContents
            .FirstOrDefaultAsync(c => c.WebsiteId == website.Id && c.SectionKey == "whatsapp", cancellationToken);

        var now = DateTime.UtcNow;
        if (content == null)
        {
            content = new WebsiteContent
            {
                TenantId = tenantId,
                WebsiteId = website.Id,
                SectionKey = "whatsapp",
                DraftContentJson = json,
                PublishedContentJson = json,
                Status = "Published",
                Version = 1,
                CreatedAt = now,
                UpdatedAt = now,
                PublishedAt = now
            };
            _dbContext.WebsiteContents.Add(content);
        }
        else
        {
            content.DraftContentJson = json;
            content.PublishedContentJson = json;
            content.Status = "Published";
            content.Version += 1;
            content.UpdatedAt = now;
            content.PublishedAt = now;
        }

        website.UpdatedAt = now;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new WhatsAppIntegrationDto
        {
            Enabled = request.Enabled,
            PhoneNumber = cleanedPhone,
            PrefilledMessage = prefilledMessage,
            Status = status,
            Templates = templates
        });
    }

    [HttpGet("social")]
    public async Task<IActionResult> GetSocialLinksIntegration(CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var website = await GetOrCreateWebsiteAsync(tenantId, cancellationToken);

        var content = await _dbContext.WebsiteContents
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.WebsiteId == website.Id && c.SectionKey == "social", cancellationToken);

        if (content != null && !string.IsNullOrWhiteSpace(content.PublishedContentJson ?? content.DraftContentJson))
        {
            try
            {
                var json = content.PublishedContentJson ?? content.DraftContentJson!;
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                var fbUrl = root.TryGetProperty("facebookUrl", out var fbUrlProp) ? fbUrlProp.GetString() ?? "" : "";
                var fbEnabled = root.TryGetProperty("facebookEnabled", out var fbEnProp) && fbEnProp.GetBoolean();
                var igUrl = root.TryGetProperty("instagramUrl", out var igUrlProp) ? igUrlProp.GetString() ?? "" : "";
                var igEnabled = root.TryGetProperty("instagramEnabled", out var igEnProp) && igEnProp.GetBoolean();

                return Ok(new SocialLinksIntegrationDto
                {
                    FacebookUrl = fbUrl,
                    FacebookEnabled = fbEnabled,
                    InstagramUrl = igUrl,
                    InstagramEnabled = igEnabled
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse Social integration content json for website {WebsiteId}", website.Id);
            }
        }

        return Ok(new SocialLinksIntegrationDto
        {
            FacebookUrl = "",
            FacebookEnabled = false,
            InstagramUrl = "",
            InstagramEnabled = false
        });
    }

    [HttpPut("social")]
    public async Task<IActionResult> UpdateSocialLinksIntegration([FromBody] UpdateSocialLinksIntegrationRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var website = await GetOrCreateWebsiteAsync(tenantId, cancellationToken);

        if (!IsValidHttpUrl(request.FacebookUrl, out var normFbUrl, out var fbError))
        {
            return BadRequest(new { Error = $"Facebook URL error: {fbError}" });
        }

        if (!IsValidHttpUrl(request.InstagramUrl, out var normIgUrl, out var igError))
        {
            return BadRequest(new { Error = $"Instagram URL error: {igError}" });
        }

        if (request.FacebookEnabled && string.IsNullOrWhiteSpace(normFbUrl))
        {
            return BadRequest(new { Error = "Facebook URL is required when Facebook link is enabled." });
        }

        if (request.InstagramEnabled && string.IsNullOrWhiteSpace(normIgUrl))
        {
            return BadRequest(new { Error = "Instagram URL is required when Instagram link is enabled." });
        }

        var payload = new
        {
            facebookUrl = normFbUrl,
            facebookEnabled = request.FacebookEnabled && !string.IsNullOrWhiteSpace(normFbUrl),
            instagramUrl = normIgUrl,
            instagramEnabled = request.InstagramEnabled && !string.IsNullOrWhiteSpace(normIgUrl)
        };

        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        var content = await _dbContext.WebsiteContents
            .FirstOrDefaultAsync(c => c.WebsiteId == website.Id && c.SectionKey == "social", cancellationToken);

        var now = DateTime.UtcNow;
        if (content == null)
        {
            content = new WebsiteContent
            {
                TenantId = tenantId,
                WebsiteId = website.Id,
                SectionKey = "social",
                DraftContentJson = json,
                PublishedContentJson = json,
                Status = "Published",
                Version = 1,
                CreatedAt = now,
                UpdatedAt = now,
                PublishedAt = now
            };
            _dbContext.WebsiteContents.Add(content);
        }
        else
        {
            content.DraftContentJson = json;
            content.PublishedContentJson = json;
            content.Status = "Published";
            content.Version += 1;
            content.UpdatedAt = now;
            content.PublishedAt = now;
        }

        website.UpdatedAt = now;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new SocialLinksIntegrationDto
        {
            FacebookUrl = normFbUrl,
            FacebookEnabled = request.FacebookEnabled && !string.IsNullOrWhiteSpace(normFbUrl),
            InstagramUrl = normIgUrl,
            InstagramEnabled = request.InstagramEnabled && !string.IsNullOrWhiteSpace(normIgUrl)
        });
    }
}
