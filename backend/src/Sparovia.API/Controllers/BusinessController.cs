using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sparovia.Application.DTOs.Business;
using Sparovia.Application.Services;

namespace Sparovia.API.Controllers;

[Route("api/businesses")]
[Authorize]
public class BusinessController : BaseApiController
{
    private readonly BusinessService _businessService;
    private readonly IValidator<CreateBusinessRequest> _createValidator;

    public BusinessController(
        BusinessService businessService,
        IValidator<CreateBusinessRequest> createValidator)
    {
        _businessService = businessService;
        _createValidator = createValidator;
    }

    /// <summary>Create a new business. The caller becomes the Owner.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(BusinessResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateBusinessRequest request, CancellationToken ct)
    {
        var validation = await _createValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray());
            return BadRequest(new { status = 400, message = "Validation failed.", errors });
        }

        var userId = GetCurrentUserId();
        var result = await _businessService.CreateBusinessAsync(userId, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Get all businesses the authenticated user belongs to.</summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(IReadOnlyList<BusinessResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMine(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _businessService.GetMyBusinessesAsync(userId, ct);
        return Ok(result);
    }

    /// <summary>Get a specific business. Access is verified through Membership.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BusinessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        // Tenant isolation enforced in BusinessService — userId from JWT, never from body
        var result = await _businessService.GetBusinessAsync(userId, id, ct);
        return Ok(result);
    }
}
