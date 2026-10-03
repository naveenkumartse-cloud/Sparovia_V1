using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sparovia.Application.BusinessPresence;
using Sparovia.Infrastructure.Data;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/v1/business-presence")]
[Authorize] // Requires authenticated session
public class BusinessPresenceController : ControllerBase
{
    private readonly IBusinessPresenceService _presenceService;
    private readonly SparoviaDbContext _dbContext;

    public BusinessPresenceController(IBusinessPresenceService presenceService, SparoviaDbContext dbContext)
    {
        _presenceService = presenceService;
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

    private async Task<bool> IsOnboardingCompleteAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        return await _dbContext.BusinessContexts
            .AnyAsync(b => b.TenantId == tenantId && b.IsConfirmed, cancellationToken);
    }

    [HttpGet]
    public async Task<IActionResult> GetPresence(CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        // Server-enforced onboarding gate: Business Context must be confirmed
        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before accessing Business Presence.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var presence = await _presenceService.GetPresenceAsync(tenantId, cancellationToken);
        return Ok(presence);
    }

    [HttpPut]
    public async Task<IActionResult> UpdatePresence([FromBody] UpdateBusinessPresenceRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        // Server-enforced onboarding gate: Business Context must be confirmed
        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before accessing Business Presence.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var result = await _presenceService.UpdatePresenceAsync(tenantId, request, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage });
        }

        return Ok(result.Presence);
    }

    [HttpPost("mark-reviewed")]
    public async Task<IActionResult> MarkAsReviewed(CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        // Server-enforced onboarding gate: Business Context must be confirmed
        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before accessing Business Presence.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var result = await _presenceService.MarkAsReviewedAsync(tenantId, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage });
        }

        return Ok(result.Presence);
    }
}
