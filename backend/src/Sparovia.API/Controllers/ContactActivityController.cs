using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Sparovia.Application.ContactActivity;
using Sparovia.Infrastructure.Data;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/v1/contact-activity")]
public class ContactActivityController : ControllerBase
{
    private readonly IContactActivityService _activityService;
    private readonly SparoviaDbContext _dbContext;
    private readonly ILogger<ContactActivityController> _logger;

    public ContactActivityController(
        IContactActivityService activityService,
        SparoviaDbContext dbContext,
        ILogger<ContactActivityController> logger)
    {
        _activityService = activityService;
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

    private async Task<bool> IsOnboardingCompleteAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        return await _dbContext.BusinessContexts
            .AnyAsync(b => b.TenantId == tenantId && b.IsConfirmed, cancellationToken);
    }

    [HttpPost("public")]
    [AllowAnonymous]
    [EnableRateLimiting("PublicLeadIntake")]
    public async Task<IActionResult> TrackPublicContactActivity(
        [FromBody] RecordContactActivityRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return BadRequest(new { Error = "Invalid activity request." });
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

        var domain = request.Domain;
        if (string.IsNullOrWhiteSpace(domain))
        {
            domain = Request.Headers.Host.ToString();
        }

        var result = await _activityService.RecordContactActivityAsync(tenantId, domain, request, cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "TENANT_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(new
        {
            Success = true,
            EventId = result.EventId
        });
    }

    [HttpGet("summary")]
    [Authorize]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetActivitySummary(CancellationToken cancellationToken)
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
                Error = "Onboarding incomplete. Business Context must be confirmed before viewing activity.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var summary = await _activityService.GetActivitySummaryAsync(tenantId, cancellationToken);
        return Ok(summary);
    }

    [HttpGet]
    [Authorize]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetActivities(
        [FromQuery] ContactActivityQueryParameters query,
        CancellationToken cancellationToken)
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
                Error = "Onboarding incomplete. Business Context must be confirmed before viewing activity.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var activities = await _activityService.GetActivitiesAsync(tenantId, query, cancellationToken);
        return Ok(activities);
    }
}
