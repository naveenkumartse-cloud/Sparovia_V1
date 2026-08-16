using Microsoft.AspNetCore.Mvc;
using Sparovia.Application.DTOs.Leads;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Application.Services;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/public/businesses/{slug}/leads")]
public class PublicLeadsController : ControllerBase
{
    private readonly LeadService _leadService;
    private readonly IBusinessRepository _businessRepository;

    public PublicLeadsController(LeadService leadService, IBusinessRepository businessRepository)
    {
        _leadService = leadService;
        _businessRepository = businessRepository;
    }

    [HttpPost]
    public async Task<IActionResult> CreateLead(string slug, [FromBody] CreateLeadRequest request, CancellationToken cancellationToken)
    {
        // Find the business by slug
        var business = await _businessRepository.GetBySlugAsync(slug, cancellationToken);
        if (business == null || !business.IsActive)
        {
            return NotFound(new { message = "Business not found or inactive." });
        }

        var lead = await _leadService.CreateLeadAsync(business.Id, request, cancellationToken);
        
        // Return 201 Created. We don't expose the full GET route since this is public.
        return StatusCode(201, new { message = "Lead submitted successfully." });
    }
}
