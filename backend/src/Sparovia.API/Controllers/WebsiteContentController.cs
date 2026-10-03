using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sparovia.Application.WebsiteContent;
using Sparovia.Infrastructure.Data;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/v1/website")]
public class WebsiteContentController : ControllerBase
{
    private readonly IWebsiteContentService _contentService;
    private readonly SparoviaDbContext _dbContext;

    public WebsiteContentController(IWebsiteContentService contentService, SparoviaDbContext dbContext)
    {
        _contentService = contentService;
        _dbContext = dbContext;
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
    public async Task<IActionResult> GetConnectedWebsite(CancellationToken cancellationToken)
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
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Website Content.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var website = await _contentService.GetOrCreateConnectedWebsiteAsync(tenantId, cancellationToken);
        return Ok(website);
    }

    [HttpGet("content")]
    [Authorize]
    public async Task<IActionResult> GetContentOverview(CancellationToken cancellationToken)
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
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Website Content.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var overview = await _contentService.GetOverviewAsync(tenantId, cancellationToken);
        return Ok(overview);
    }

    [HttpGet("content/{sectionKey}")]
    [Authorize]
    public async Task<IActionResult> GetContentSection(string sectionKey, CancellationToken cancellationToken)
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
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Website Content.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var section = await _contentService.GetSectionAsync(tenantId, sectionKey, cancellationToken);
        if (section == null)
        {
            return NotFound(new { Error = $"Section '{sectionKey}' not found or unsupported." });
        }

        return Ok(section);
    }

    [HttpPut("content/{sectionKey}/draft")]
    [Authorize]
    public async Task<IActionResult> SaveContentDraft(string sectionKey, [FromBody] SaveDraftRequest request, CancellationToken cancellationToken)
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
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Website Content.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var userId = TryGetUserId();
        var result = await _contentService.SaveDraftAsync(tenantId, sectionKey, request.Fields, userId, cancellationToken);

        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(result.Section);
    }

    [HttpGet("content/{sectionKey}/preview")]
    [Authorize]
    public async Task<IActionResult> PreviewContentSection(string sectionKey, CancellationToken cancellationToken)
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
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Website Content.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var section = await _contentService.GetSectionAsync(tenantId, sectionKey, cancellationToken);
        if (section == null)
        {
            return NotFound(new { Error = $"Section '{sectionKey}' not found or unsupported." });
        }

        return Ok(new
        {
            SectionKey = section.SectionKey,
            PreviewFields = section.DraftFields,
            Version = section.Version,
            Status = section.Status
        });
    }

    [HttpPost("content/{sectionKey}/publish")]
    [Authorize]
    public async Task<IActionResult> PublishContentSection(string sectionKey, [FromBody] PublishSectionRequest? request, CancellationToken cancellationToken)
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
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Website Content.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var userId = TryGetUserId();
        var result = await _contentService.PublishSectionAsync(tenantId, sectionKey, request?.Version, userId, cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "VERSION_MISMATCH")
            {
                return Conflict(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            if (result.ErrorCode == "SECTION_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(result.Section);
    }

    [HttpGet("published-content")]
    [AllowAnonymous] // Public website consumption
    public async Task<IActionResult> GetPublishedContent([FromQuery] string? domain, CancellationToken cancellationToken)
    {
        Guid? tenantId = null;
        var authResult = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        if (authResult.Succeeded && authResult.Principal != null)
        {
            var tenantStr = authResult.Principal.FindFirst("TenantId")?.Value;
            if (Guid.TryParse(tenantStr, out var parsedTenantId))
            {
                tenantId = parsedTenantId;
            }
        }
        else if (User.FindFirst("TenantId")?.Value is string tStr && Guid.TryParse(tStr, out var uTenantId))
        {
            tenantId = uTenantId;
        }

        var content = await _contentService.GetPublishedContentAsync(tenantId, domain, cancellationToken);
        if (content == null)
        {
            return NotFound(new { Error = "No published website content found." });
        }

        return Ok(content);
    }
}
