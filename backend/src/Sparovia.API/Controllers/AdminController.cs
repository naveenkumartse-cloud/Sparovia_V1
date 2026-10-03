using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sparovia.Infrastructure.Data;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize] // Requires authenticated session
public class AdminController : ControllerBase
{
    private readonly SparoviaDbContext _dbContext;

    public AdminController(SparoviaDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        // Safe access: tenant boundary is resolved server-side from claims
        var tenantIdStr = User.FindFirst("TenantId")?.Value;
        if (!Guid.TryParse(tenantIdStr, out var tenantId))
        {
            return Unauthorized(new { Error = "Tenant context not found in session." });
        }

        // Server-enforced onboarding gate: Business Context must be confirmed
        var isConfirmed = await _dbContext.BusinessContexts
            .AnyAsync(b => b.TenantId == tenantId && b.IsConfirmed, cancellationToken);

        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before accessing the Admin Dashboard.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }
        
        return Ok(new
        {
            Message = "Welcome to the protected Admin area.",
            TenantContext = tenantIdStr
        });
    }
}
