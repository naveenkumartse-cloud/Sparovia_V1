using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sparovia.Application.Onboarding;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize] // Requires authenticated session
public class OnboardingController : ControllerBase
{
    private readonly IOnboardingService _onboardingService;

    public OnboardingController(IOnboardingService onboardingService)
    {
        _onboardingService = onboardingService;
    }

    private Guid GetTenantId()
    {
        var tenantIdStr = User.FindFirst("TenantId")?.Value;
        if (Guid.TryParse(tenantIdStr, out var tenantId))
        {
            return tenantId;
        }
        throw new UnauthorizedAccessException("Tenant context not found in session.");
    }

    [HttpGet("business-basics")]
    public async Task<IActionResult> GetBusinessBasics(CancellationToken cancellationToken)
    {
        var tenantId = GetTenantId();
        var basics = await _onboardingService.GetBusinessBasicsAsync(tenantId, cancellationToken);
        
        if (basics == null)
        {
            return NoContent();
        }
        return Ok(basics);
    }

    [HttpPut("business-basics")]
    public async Task<IActionResult> SaveBusinessBasics([FromBody] BusinessBasicsDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var tenantId = GetTenantId();
        var result = await _onboardingService.SaveBusinessBasicsAsync(tenantId, dto, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage });
        }

        return Ok(new { Message = "Business basics saved successfully." });
    }

    [HttpGet("services")]
    public async Task<IActionResult> GetServices(CancellationToken cancellationToken)
    {
        var tenantIdStr = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdStr) || !Guid.TryParse(tenantIdStr, out var tenantId))
        {
            return Unauthorized();
        }

        var services = await _onboardingService.GetServicesAsync(tenantId, cancellationToken);
        return Ok(services);
    }

    [HttpPost("services")]
    public async Task<IActionResult> AddService([FromBody] AddServiceRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var tenantIdStr = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdStr) || !Guid.TryParse(tenantIdStr, out var tenantId))
        {
            return Unauthorized();
        }

        var result = await _onboardingService.AddServiceAsync(tenantId, request, cancellationToken);
        if (!result.Success) return BadRequest(new { Error = result.ErrorMessage });

        return Ok(result.Service);
    }

    [HttpPut("services/{id}")]
    public async Task<IActionResult> UpdateService(Guid id, [FromBody] UpdateServiceRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var tenantIdStr = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdStr) || !Guid.TryParse(tenantIdStr, out var tenantId))
        {
            return Unauthorized();
        }

        var result = await _onboardingService.UpdateServiceAsync(tenantId, id, request, cancellationToken);
        if (!result.Success) return BadRequest(new { Error = result.ErrorMessage });

        return Ok(result.Service);
    }

    [HttpDelete("services/{id}")]
    public async Task<IActionResult> DeleteService(Guid id, CancellationToken cancellationToken)
    {
        var tenantIdStr = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdStr) || !Guid.TryParse(tenantIdStr, out var tenantId))
        {
            return Unauthorized();
        }

        var result = await _onboardingService.DeleteServiceAsync(tenantId, id, cancellationToken);
        if (!result.Success) return BadRequest(new { Error = result.ErrorMessage });

        return Ok(new { Message = "Service removed successfully." });
    }

    [HttpGet("location-customers")]
    public async Task<IActionResult> GetLocationAndCustomers(CancellationToken cancellationToken)
    {
        var tenantId = GetTenantId();
        var data = await _onboardingService.GetLocationAndCustomersAsync(tenantId, cancellationToken);
        
        if (data == null)
        {
            return NoContent();
        }
        return Ok(data);
    }

    [HttpPut("location-customers")]
    public async Task<IActionResult> SaveLocationAndCustomers([FromBody] LocationAndCustomersDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var tenantId = GetTenantId();
        var result = await _onboardingService.SaveLocationAndCustomersAsync(tenantId, dto, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage });
        }

        return Ok(new { Message = "Location and customers saved successfully." });
    }

    [HttpGet("business-description")]
    public async Task<IActionResult> GetBusinessDescription(CancellationToken cancellationToken)
    {
        var tenantId = GetTenantId();
        var data = await _onboardingService.GetBusinessDescriptionAsync(tenantId, cancellationToken);
        
        if (data == null)
        {
            return NoContent();
        }
        return Ok(data);
    }

    [HttpPut("business-description")]
    public async Task<IActionResult> SaveBusinessDescription([FromBody] BusinessDescriptionDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var tenantId = GetTenantId();
        var result = await _onboardingService.SaveBusinessDescriptionAsync(tenantId, dto, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage });
        }

        return Ok(new { Message = "Business description saved successfully." });
    }

    [HttpGet("approved-facts")]
    public async Task<IActionResult> GetApprovedFacts(CancellationToken cancellationToken)
    {
        var tenantId = GetTenantId();
        var data = await _onboardingService.GetApprovedFactsAsync(tenantId, cancellationToken);
        
        if (data == null)
        {
            return NoContent();
        }
        return Ok(data);
    }

    [HttpPut("approved-facts")]
    public async Task<IActionResult> SaveApprovedFacts([FromBody] ApprovedFactsDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var tenantId = GetTenantId();
        var result = await _onboardingService.SaveApprovedFactsAsync(tenantId, dto, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage });
        }

        return Ok(new { Message = "Approved facts saved successfully." });
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetBusinessContextSummary(CancellationToken cancellationToken)
    {
        var tenantId = GetTenantId();
        var data = await _onboardingService.GetBusinessContextSummaryAsync(tenantId, cancellationToken);
        
        if (data == null)
        {
            return NotFound(new { Error = "Business context not found." });
        }
        return Ok(data);
    }

    [HttpPost("confirm")]
    public async Task<IActionResult> ConfirmBusinessContext(CancellationToken cancellationToken)
    {
        var tenantId = GetTenantId();
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var result = await _onboardingService.ConfirmBusinessContextAsync(tenantId, userId, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage });
        }

        return Ok(new { Message = "Business context confirmed successfully." });
    }
}
