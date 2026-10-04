using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Sparovia.Application.Leads;
using Sparovia.Infrastructure.Data;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/v1/leads")]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _leadService;
    private readonly SparoviaDbContext _dbContext;
    private readonly ILogger<LeadsController> _logger;

    public LeadsController(ILeadService leadService, SparoviaDbContext dbContext, ILogger<LeadsController> logger)
    {
        _leadService = leadService;
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

    private Guid? TryGetUserId()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdStr, out var userId) ? userId : null;
    }

    private async Task<bool> IsOnboardingCompleteAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        return await _dbContext.BusinessContexts
            .AnyAsync(b => b.TenantId == tenantId && b.IsConfirmed, cancellationToken);
    }

    [HttpGet]
    [Authorize]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetLeads([FromQuery] LeadQueryParameters parameters, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Leads.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var result = await _leadService.GetLeadsAsync(tenantId, parameters, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetLeadById(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Leads.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var lead = await _leadService.GetLeadByIdAsync(tenantId, id, cancellationToken);
        if (lead == null)
        {
            // Do not reveal whether lead exists under another tenant - return standard 404
            return NotFound(new { Error = "Lead not found." });
        }

        return Ok(lead);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateLead([FromBody] CreateLeadRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Leads.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var userId = TryGetUserId();
        var result = await _leadService.CreateManualLeadAsync(tenantId, request, userId, cancellationToken);

        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return CreatedAtAction(nameof(GetLeadById), new { id = result.Lead!.Id }, result.Lead);
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateLead(Guid id, [FromBody] UpdateLeadRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Leads.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var userId = TryGetUserId();
        var result = await _leadService.UpdateLeadAsync(tenantId, id, request, userId, cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(result.Lead);
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteLead(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Leads.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var userId = TryGetUserId();
        var result = await _leadService.DeleteLeadAsync(tenantId, id, userId, cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(new { Success = true, Message = "Lead deleted successfully." });
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateLeadStatus(Guid id, [FromBody] UpdateLeadStatusRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Leads.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var userId = TryGetUserId();
        var result = await _leadService.UpdateLeadStatusAsync(tenantId, id, request?.Status ?? string.Empty, userId, cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(result.Lead);
    }

    [HttpPost("public")]
    [AllowAnonymous]
    [EnableRateLimiting("PublicLeadIntake")]
    public async Task<IActionResult> SubmitPublicWebsiteLead([FromBody] PublicWebsiteLeadRequest request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return BadRequest(new { Error = "Invalid lead request." });
        }

        Guid? tenantId = null;

        // Check if caller provides authenticated session (e.g. previewing own site)
        var authResult = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        if (authResult.Succeeded && authResult.Principal != null)
        {
            var tenantStr = authResult.Principal.FindFirst("TenantId")?.Value;
            if (Guid.TryParse(tenantStr, out var parsedTenantId))
            {
                tenantId = parsedTenantId;
            }
        }

        // Domain fallback from header or request
        var domain = request.Domain;
        if (string.IsNullOrWhiteSpace(domain))
        {
            domain = Request.Headers.Host.ToString();
        }

        var result = await _leadService.CreateWebsiteLeadAsync(tenantId, domain, request, cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "TENANT_NOT_FOUND")
            {
                return NotFound(new { Error = "Business website not found.", Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        // Return minimal safe response - never expose internal tenant ID or sensitive server metadata
        return Ok(new
        {
            Success = true,
            Message = "Inquiry submitted successfully."
        });
    }

    [HttpPost("webhook/whatsapp")]
    [AllowAnonymous]
    [EnableRateLimiting("PublicLeadIntake")]
    public async Task<IActionResult> ProcessWhatsAppWebhook(
        [FromQuery] Guid tenantId,
        [FromHeader(Name = "X-WhatsApp-Token")] string? webhookToken,
        [FromBody] WhatsAppLeadWebhookRequest request,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
        {
            return BadRequest(new { Error = "Valid tenant identifier is required.", Code = "INVALID_TENANT" });
        }

        if (request == null)
        {
            return BadRequest(new { Error = "Invalid webhook payload.", Code = "INVALID_PAYLOAD" });
        }

        var result = await _leadService.ProcessWhatsAppWebhookAsync(tenantId, request, cancellationToken);
        if (!result.Success)
        {
            if (result.ErrorCode == "TENANT_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(new { Success = true, LeadId = result.Lead?.Id });
    }
}
