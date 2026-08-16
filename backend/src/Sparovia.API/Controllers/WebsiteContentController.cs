using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sparovia.Application.Services;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/businesses/{businessId:guid}/website-content")]
[Authorize]
public class WebsiteContentController : ControllerBase
{
    private readonly WebsiteContentService _websiteContentService;

    public WebsiteContentController(WebsiteContentService websiteContentService)
    {
        _websiteContentService = websiteContentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetContent(Guid businessId, CancellationToken cancellationToken)
    {
        var content = await _websiteContentService.GetContentAsync(businessId, cancellationToken);
        return Ok(content);
    }
}
