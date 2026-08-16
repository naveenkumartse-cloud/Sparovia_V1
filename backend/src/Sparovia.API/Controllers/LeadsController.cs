using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sparovia.Application.DTOs.Leads;
using Sparovia.Application.Services;
using System.Security.Claims;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/businesses/{businessId:guid}/leads")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly LeadService _leadService;

    public LeadsController(LeadService leadService)
    {
        _leadService = leadService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateLead(Guid businessId, [FromBody] CreateLeadRequest request, CancellationToken cancellationToken)
    {
        // Note: In a real scenario, we might want to allow public lead creation without [Authorize]
        // or using an API key if this is submitted from the public website.
        // For the admin panel manually adding leads, it requires authorization.
        var lead = await _leadService.CreateLeadAsync(businessId, request, cancellationToken);
        return CreatedAtAction(nameof(GetLeads), new { businessId }, lead);
    }

    [HttpGet]
    public async Task<IActionResult> GetLeads(Guid businessId, CancellationToken cancellationToken)
    {
        var leads = await _leadService.GetLeadsAsync(businessId, cancellationToken);
        return Ok(leads);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateLeadStatus(Guid businessId, Guid id, [FromBody] UpdateLeadStatusRequest request, CancellationToken cancellationToken)
    {
        var lead = await _leadService.UpdateLeadStatusAsync(id, businessId, request, cancellationToken);
        return Ok(lead);
    }
}
