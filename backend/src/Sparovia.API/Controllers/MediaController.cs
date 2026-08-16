using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sparovia.Application.DTOs.Media;
using Sparovia.Application.Services;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/businesses/{businessId:guid}/media")]
[Authorize]
public class MediaController : ControllerBase
{
    private readonly MediaService _mediaService;

    public MediaController(MediaService mediaService)
    {
        _mediaService = mediaService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadMedia(Guid businessId, [FromForm] IFormFile file, [FromForm] string category, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0) return BadRequest("File is empty.");

        var request = new UploadMediaRequest
        {
            FileStream = file.OpenReadStream(),
            FileName = file.FileName,
            Category = category ?? "Uncategorized"
        };

        var media = await _mediaService.UploadMediaAsync(businessId, request, cancellationToken);
        return CreatedAtAction(nameof(GetMedia), new { businessId }, media);
    }

    [HttpGet]
    public async Task<IActionResult> GetMedia(Guid businessId, CancellationToken cancellationToken)
    {
        var mediaList = await _mediaService.GetMediaAsync(businessId, cancellationToken);
        return Ok(mediaList);
    }
}
