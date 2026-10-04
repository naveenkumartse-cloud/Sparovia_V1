using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sparovia.Application.Images;
using Sparovia.Infrastructure.Data;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/v1/website/images")]
public class WebsiteImagesController : ControllerBase
{
    private readonly IWebsiteImageService _imageService;
    private readonly SparoviaDbContext _dbContext;
    private readonly ILogger<WebsiteImagesController> _logger;

    public WebsiteImagesController(
        IWebsiteImageService imageService,
        SparoviaDbContext dbContext,
        ILogger<WebsiteImagesController> logger)
    {
        _imageService = imageService;
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
    public async Task<IActionResult> GetImages(
        [FromQuery] string? usageType,
        [FromQuery] bool includeUnused = false,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Website Images.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        var images = await _imageService.GetImagesAsync(tenantId, usageType, includeUnused, cancellationToken);
        return Ok(new
        {
            data = images,
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetImageById(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var image = await _imageService.GetImageByIdAsync(tenantId, id, cancellationToken);
        if (image == null)
        {
            return NotFound(new { Error = "Image not found." });
        }

        return Ok(new
        {
            data = image,
            requestId = HttpContext.TraceIdentifier
        });
    }

public class UploadImageForm
{
    public IFormFile File { get; set; } = null!;
    public string? UsageType { get; set; }
    public string? Slot { get; set; }
    public string? ProjectWorkName { get; set; }
    public string? Category { get; set; }
    public string? Caption { get; set; }
}

public class ExploreOurWorkForm
{
    public IFormFile File { get; set; } = null!;
    public string? ProjectWorkName { get; set; }
    public string? Category { get; set; }
    public string? Caption { get; set; }
}

public class ReplaceImageForm
{
    public IFormFile File { get; set; } = null!;
}

    [HttpPost]
    [Authorize]
    [RequestSizeLimit(15 * 1024 * 1024)] // 15 MB limit to allow headers
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadImage(
        [FromForm] UploadImageForm form,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before uploading Website Images.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        if (form?.File == null || form.File.Length == 0)
        {
            return BadRequest(new { Error = "An image file is required.", Code = "FILE_REQUIRED" });
        }

        using var stream = form.File.OpenReadStream();
        var result = await _imageService.UploadImageAsync(
            tenantId,
            stream,
            form.File.FileName,
            form.File.ContentType,
            form.UsageType ?? "WebsiteImage",
            form.Slot,
            form.ProjectWorkName,
            form.Category,
            form.Caption,
            TryGetUserId(),
            cancellationToken);

        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            data = result.Image,
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpPost("explore-our-work")]
    [Authorize]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> AddExploreOurWorkImage(
        [FromForm] ExploreOurWorkForm form,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before adding Explore Our Work images.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        if (form?.File == null || form.File.Length == 0)
        {
            return BadRequest(new { Error = "An image file is required.", Code = "FILE_REQUIRED" });
        }

        using var stream = form.File.OpenReadStream();
        var result = await _imageService.UploadImageAsync(
            tenantId,
            stream,
            form.File.FileName,
            form.File.ContentType,
            "ExploreOurWork",
            null,
            form.ProjectWorkName,
            form.Category,
            form.Caption,
            TryGetUserId(),
            cancellationToken);

        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            data = result.Image,
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpPost("{id:guid}/replace")]
    [Authorize]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ReplaceImage(
        Guid id,
        [FromForm] ReplaceImageForm form,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Error = "Onboarding incomplete. Business Context must be confirmed before managing Website Images.",
                Code = "ONBOARDING_REQUIRED",
                RedirectUrl = "/admin/onboarding/business-basics"
            });
        }

        if (form?.File == null || form.File.Length == 0)
        {
            return BadRequest(new { Error = "An image file is required.", Code = "FILE_REQUIRED" });
        }

        using var stream = form.File.OpenReadStream();
        var result = await _imageService.ReplaceImageAsync(
            tenantId,
            id,
            stream,
            form.File.FileName,
            form.File.ContentType,
            TryGetUserId(),
            cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "IMAGE_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(new
        {
            data = result.Image,
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpPut("{id:guid}/metadata")]
    [Authorize]
    public async Task<IActionResult> UpdateMetadata(
        Guid id,
        [FromBody] UpdateImageMetadataRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var result = await _imageService.UpdateMetadataAsync(
            tenantId,
            id,
            request?.ProjectWorkName,
            request?.Category,
            request?.Caption,
            TryGetUserId(),
            cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "IMAGE_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(new
        {
            data = result.Image,
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpGet("{id:guid}/preview")]
    [Authorize]
    public async Task<IActionResult> GetImagePreview(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var preview = await _imageService.GetImagePreviewAsync(tenantId, id, cancellationToken);
        if (preview == null)
        {
            return NotFound(new { Error = "Image not found." });
        }

        return Ok(new
        {
            data = preview,
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize]
    public async Task<IActionResult> ApproveImage(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var result = await _imageService.ApproveImageAsync(tenantId, id, TryGetUserId(), cancellationToken);
        if (!result.Success)
        {
            if (result.ErrorCode == "IMAGE_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(new
        {
            data = result.Image,
            message = "Image approved for website usage.",
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize]
    public async Task<IActionResult> RejectImage(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var result = await _imageService.RejectImageAsync(tenantId, id, "Rejected by user", TryGetUserId(), cancellationToken);
        if (!result.Success)
        {
            if (result.ErrorCode == "IMAGE_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(new
        {
            data = result.Image,
            message = "Image rejected. Original image is preserved.",
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize]
    public async Task<IActionResult> PublishImage(
        Guid id,
        [FromBody] PublishImageRequest? request,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var result = await _imageService.PublishImageAsync(
            tenantId,
            id,
            request?.VariantId,
            TryGetUserId(),
            cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "IMAGE_NOT_FOUND" || result.ErrorCode == "VARIANT_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(new
        {
            data = result.Image,
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> RemoveFromWebsiteUsage(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var result = await _imageService.DeleteImageAsync(
            tenantId,
            id,
            TryGetUserId(),
            cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "IMAGE_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(new
        {
            data = result.Image,
            message = "Image safely removed from active website usage and deleted.",
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpGet("/api/v1/website/categories")]
    [HttpGet("categories")]
    [Authorize]
    public async Task<IActionResult> GetCategories(
        [FromQuery] Guid? websiteId,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var categories = await _imageService.GetWorkCategoriesAsync(tenantId, websiteId, cancellationToken);
        return Ok(new
        {
            data = categories,
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpPost("/api/v1/website/categories")]
    [HttpPost("categories")]
    [Authorize]
    public async Task<IActionResult> CreateCategory(
        [FromBody] CreateWorkCategoryRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        if (string.IsNullOrWhiteSpace(request?.Name))
        {
            return BadRequest(new { Error = "Category name is required.", Code = "CATEGORY_NAME_REQUIRED" });
        }

        try
        {
            var category = await _imageService.CreateWorkCategoryAsync(tenantId, request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new
            {
                data = category,
                message = "Category created successfully.",
                requestId = HttpContext.TraceIdentifier
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Error = ex.Message, Code = "INVALID_CATEGORY_NAME" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message, Code = "UNSAFE_CATEGORY_NAME" });
        }
    }

    [HttpPost("{id:guid}/enhancement/approve")]
    [Authorize]
    public async Task<IActionResult> ApproveEnhancement(
        Guid id,
        [FromBody] ApproveEnhancementRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        if (request == null || request.VariantId == Guid.Empty)
        {
            return BadRequest(new { Error = "Variant ID is required.", Code = "VARIANT_ID_REQUIRED" });
        }

        var result = await _imageService.ApproveEnhancementAsync(
            tenantId,
            id,
            request.VariantId,
            TryGetUserId(),
            cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "VARIANT_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(new
        {
            data = new
            {
                imageId = id,
                approvedVariantId = request.VariantId,
                status = "Approved"
            },
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpPost("{id:guid}/enhancement/reject")]
    [Authorize]
    public async Task<IActionResult> RejectEnhancement(
        Guid id,
        [FromBody] RejectEnhancementRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        if (request == null || request.VariantId == Guid.Empty)
        {
            return BadRequest(new { Error = "Variant ID is required.", Code = "VARIANT_ID_REQUIRED" });
        }

        var result = await _imageService.RejectEnhancementAsync(
            tenantId,
            id,
            request.VariantId,
            TryGetUserId(),
            cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "VARIANT_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(new
        {
            data = new
            {
                imageId = id,
                rejectedVariantId = request.VariantId,
                status = "Rejected"
            },
            message = "Enhancement variant rejected. Original image remains unchanged.",
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpGet("{id:guid}/analysis")]
    [Authorize]
    public async Task<IActionResult> GetImageAnalysis(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        try
        {
            var analysis = await _imageService.AnalyzeImageAsync(tenantId, id, cancellationToken);
            return Ok(new
            {
                data = analysis,
                requestId = HttpContext.TraceIdentifier
            });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { Error = "Image not found.", Code = "IMAGE_NOT_FOUND" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to analyze image {ImageId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { Error = "Failed to analyze image.", Details = ex.Message });
        }
    }

    [HttpPost("{id:guid}/enhance")]
    [Authorize]
    public async Task<IActionResult> EnhanceImage(
        Guid id,
        [FromBody] EnhanceImageRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        if (request == null || string.IsNullOrWhiteSpace(request.Operation))
        {
            return BadRequest(new { Error = "Operation is required.", Code = "OPERATION_REQUIRED" });
        }

        var result = await _imageService.EnhanceImageAsync(
            tenantId,
            id,
            request.Operation,
            TryGetUserId(),
            cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "IMAGE_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            data = result.Variant,
            message = "Image enhancement generated successfully. Original image remains preserved.",
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpPost("{id:guid}/optimize")]
    [Authorize]
    public async Task<IActionResult> OptimizeImage(
        Guid id,
        [FromBody] OptimizeImageRequest? request,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var result = await _imageService.OptimizeImageAsync(
            tenantId,
            id,
            request?.ParentVariantId,
            request?.TargetFormat,
            request?.MaxWidth,
            request?.MaxHeight,
            TryGetUserId(),
            cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode is "IMAGE_NOT_FOUND" or "PARENT_VARIANT_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            data = result.Variant,
            message = "Website optimized variant created successfully. Original image remains unchanged.",
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpGet("{id:guid}/variants/{variantId:guid}/review")]
    [Authorize]
    public async Task<IActionResult> GetVariantReview(
        Guid id,
        Guid variantId,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var review = await _imageService.GetVariantReviewAsync(tenantId, id, variantId, cancellationToken);
        if (review == null)
        {
            return NotFound(new { Error = "Image variant not found or not accessible.", Code = "VARIANT_NOT_FOUND" });
        }

        return Ok(new
        {
            data = review,
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpPost("{id:guid}/variants/{variantId:guid}/review")]
    [Authorize]
    public async Task<IActionResult> ReviewVariant(
        Guid id,
        Guid variantId,
        [FromBody] ReviewImageVariantRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError)) return authError!;

        var result = await _imageService.ReviewVariantAsync(
            tenantId,
            id,
            variantId,
            request.IsApproved,
            request.Reason,
            TryGetUserId(),
            cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "VARIANT_NOT_FOUND")
            {
                return NotFound(new { Error = result.ErrorMessage, Code = result.ErrorCode });
            }
            return BadRequest(new { Error = result.ErrorMessage, Code = result.ErrorCode });
        }

        return Ok(new
        {
            data = result.Variant,
            message = request.IsApproved
                ? "Variant approved for website usage. Original image remains preserved."
                : "Variant rejected. Original image remains preserved.",
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpGet("{id:guid}/file")]
    [AllowAnonymous]
    public async Task<IActionResult> GetImageFile(Guid id, CancellationToken cancellationToken)
    {
        // 1. Try authenticated tenant session
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

        var isPublic = tenantId == null;
        var fileResult = await _imageService.GetImageFileAsync(tenantId, id, null, isPublic, cancellationToken);
        if (fileResult == null)
        {
            return NotFound(new { Error = "Image file not found or not available." });
        }

        Response.Headers.CacheControl = isPublic
            ? "public, max-age=86400, immutable"
            : "private, max-age=3600";

        return File(fileResult.Stream, fileResult.ContentType, fileResult.FileName);
    }

    [HttpGet("{id:guid}/variants/{variantId:guid}/file")]
    [AllowAnonymous]
    public async Task<IActionResult> GetVariantFile(Guid id, Guid variantId, CancellationToken cancellationToken)
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

        var isPublic = tenantId == null;
        var fileResult = await _imageService.GetImageFileAsync(tenantId, id, variantId, isPublic, cancellationToken);
        if (fileResult == null)
        {
            return NotFound(new { Error = "Variant file not found or not available." });
        }

        Response.Headers.CacheControl = isPublic
            ? "public, max-age=86400, immutable"
            : "private, max-age=3600";

        return File(fileResult.Stream, fileResult.ContentType, fileResult.FileName);
    }
}
