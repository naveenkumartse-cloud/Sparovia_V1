using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sparovia.Infrastructure.Data;
using Sparovia.Domain.Entities;

namespace Sparovia.API.Controllers;

public record WhatsAppIntegrationDto
{
    public bool Enabled { get; init; }
    public string PhoneNumber { get; init; } = string.Empty;
    public string PrefilledMessage { get; init; } = string.Empty;
    public string Status { get; init; } = "Inactive";
}

public record UpdateWhatsAppIntegrationRequest
{
    public bool Enabled { get; init; }
    public string? PhoneNumber { get; init; }
    public string? PrefilledMessage { get; init; }
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

    [HttpGet("whatsapp")]
    public async Task<IActionResult> GetWhatsAppIntegration(CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var website = await _dbContext.Websites
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.TenantId == tenantId, cancellationToken);

        if (website == null)
        {
            return NotFound(new { Error = "Website not found for tenant." });
        }

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

                return Ok(new WhatsAppIntegrationDto
                {
                    Enabled = enabled,
                    PhoneNumber = phone,
                    PrefilledMessage = msg,
                    Status = status
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
            Status = "Inactive"
        });
    }

    [HttpPut("whatsapp")]
    public async Task<IActionResult> UpdateWhatsAppIntegration([FromBody] UpdateWhatsAppIntegrationRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var website = await _dbContext.Websites
            .FirstOrDefaultAsync(w => w.TenantId == tenantId, cancellationToken);

        if (website == null)
        {
            return NotFound(new { Error = "Website not found for tenant." });
        }

        var cleanedPhone = string.Empty;
        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            cleanedPhone = new string(request.PhoneNumber.Where(char.IsDigit).ToArray());
        }

        if (request.Enabled && string.IsNullOrWhiteSpace(cleanedPhone))
        {
            return BadRequest(new { Error = "A valid WhatsApp phone number is required when enabling WhatsApp integration." });
        }

        if (request.Enabled && cleanedPhone.Length < 10)
        {
            return BadRequest(new { Error = "WhatsApp phone number must contain at least 10 digits." });
        }

        var prefilledMessage = string.IsNullOrWhiteSpace(request.PrefilledMessage)
            ? "Hi, I would like to inquire about interior design services."
            : request.PrefilledMessage.Trim();

        var status = request.Enabled ? "Active" : "Inactive";

        var payload = new
        {
            enabled = request.Enabled,
            phoneNumber = cleanedPhone,
            prefilledMessage = prefilledMessage,
            status = status
        };

        var json = JsonSerializer.Serialize(payload);

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

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new WhatsAppIntegrationDto
        {
            Enabled = request.Enabled,
            PhoneNumber = cleanedPhone,
            PrefilledMessage = prefilledMessage,
            Status = status
        });
    }
}
