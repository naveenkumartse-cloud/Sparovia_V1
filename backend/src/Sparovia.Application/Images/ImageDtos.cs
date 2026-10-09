namespace Sparovia.Application.Images;

public class ImageDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid WebsiteId { get; set; }
    public string? OriginalFileName { get; set; }
    public required string MimeType { get; set; }
    public long FileSize { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public required string UsageType { get; set; }
    public string? Slot { get; set; }
    public string? ProjectWorkName { get; set; }
    public string? Category { get; set; }
    public string? Caption { get; set; }
    public string Status { get; set; } = "Uploaded";
    public bool IsActiveWebsiteUsage { get; set; } = true;
    public string PreviewUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ImageVariantDto> Variants { get; set; } = new();
}

public class ImageVariantDto
{
    public Guid Id { get; set; }
    public Guid ImageId { get; set; }
    public Guid? ParentVariantId { get; set; }
    public required string VariantType { get; set; }
    public string? Operation { get; set; }
    public required string MimeType { get; set; }
    public long FileSize { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public int Version { get; set; } = 1;
    public string Status { get; set; } = "Processing";
    public string PreviewUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ImagePreviewDto
{
    public Guid Id { get; set; }
    public required string UsageType { get; set; }
    public string? Slot { get; set; }
    public string Status { get; set; } = "Uploaded";
    public int Width { get; set; }
    public int Height { get; set; }
    public long FileSize { get; set; }
    public required string MimeType { get; set; }
    public string? OriginalFileName { get; set; }
    public string? ProjectWorkName { get; set; }
    public string? Category { get; set; }
    public string? Caption { get; set; }
    public string PreviewUrl { get; set; } = string.Empty;
    public ImageVariantDto? ActiveVariant { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateImageMetadataRequest
{
    public string? ProjectWorkName { get; set; }
    public string? Category { get; set; }
    public string? Caption { get; set; }
}

public class WorkCategoryDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid WebsiteId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public int ImageCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateWorkCategoryRequest
{
    public required string Name { get; set; }
    public Guid? WebsiteId { get; set; }
}

public class UpdateWorkCategoryRequest
{
    public required string Name { get; set; }
    public int? DisplayOrder { get; set; }
}

public class PublishImageRequest
{
    public Guid? VariantId { get; set; }
}

public class ApproveEnhancementRequest
{
    public Guid VariantId { get; set; }
}

public class RejectEnhancementRequest
{
    public Guid VariantId { get; set; }
}

public class EnhanceImageRequest
{
    public required string Operation { get; set; }
}

public class QualityStudioProcessRequest
{
    /// <summary>
    /// Preset: "Light" | "Balanced" (default) | "High" | "Custom"
    /// </summary>
    public string Preset { get; set; } = "Balanced";

    /// <summary>
    /// Brightness adjustment: -50% to +50%
    /// </summary>
    public int? Brightness { get; set; }

    /// <summary>
    /// Contrast adjustment: -50% to +50%
    /// </summary>
    public int? Contrast { get; set; }

    /// <summary>
    /// Sharpness adjustment: 0% to 100%
    /// </summary>
    public int? Sharpness { get; set; }

    /// <summary>
    /// Noise reduction adjustment: 0% to 100%
    /// </summary>
    public int? NoiseReduction { get; set; }

    /// <summary>
    /// Saturation adjustment: -50% to +50%
    /// </summary>
    public int? Saturation { get; set; }
}

public class OptimizeImageRequest
{
    public Guid? ParentVariantId { get; set; }
    public string? TargetFormat { get; set; } = "webp";
    public int? MaxWidth { get; set; } = 1200;
    public int? MaxHeight { get; set; }
}

public class ReviewImageVariantRequest
{
    public bool IsApproved { get; set; }
    public string? Reason { get; set; }
}

public class ImageOperationResult
{
    public bool Success { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public ImageDto? Image { get; set; }
    public ImageVariantDto? Variant { get; set; }
}

public class ImageFileStreamResult
{
    public required Stream Stream { get; set; }
    public required string ContentType { get; set; }
    public string? FileName { get; set; }
}

public class VariantReviewDto
{
    public Guid ImageId { get; set; }
    public Guid VariantId { get; set; }
    public string Operation { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool CanApprove { get; set; }
    public bool CanReject { get; set; }
    public ImageBeforeReviewDto Before { get; set; } = new();
    public ImageAfterReviewDto After { get; set; } = new();
}

public class ImageBeforeReviewDto
{
    public Guid Id { get; set; }
    public string? OriginalFileName { get; set; }
    public string PreviewUrl { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public long FileSize { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public string Label { get; set; } = "Original Client Photograph";
}

public class ImageAfterReviewDto
{
    public Guid Id { get; set; }
    public string PreviewUrl { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public long FileSize { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Operation { get; set; } = string.Empty;
    public string Label { get; set; } = "Enhanced Variant";
}

public class ImageAnalysisResult
{
    public int Width { get; set; }
    public int Height { get; set; }
    public long FileSize { get; set; }
    public string Format { get; set; } = string.Empty;
    public double AspectRatio { get; set; }
    public double Brightness { get; set; }
    public double Contrast { get; set; }
    public double Sharpness { get; set; }
    public double NoiseLevel { get; set; }
    public bool IsLargeEnough { get; set; }
    public string RecommendedOperation { get; set; } = "ImproveSharpness";
    public string RecommendationReason { get; set; } = string.Empty;
}

public class ProcessedImageResult
{
    public required byte[] Bytes { get; set; }
    public required string MimeType { get; set; }
    public required string FileExtension { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public long FileSize { get; set; }
}

public class BulkImageActionRequest
{
    public List<Guid> ImageIds { get; set; } = new();
}

public class BulkImageOperationResult
{
    public bool Success { get; set; }
    public int AffectedCount { get; set; }
    public List<Guid> SucceededIds { get; set; } = new();
    public List<Guid> FailedIds { get; set; } = new();
    public string? Message { get; set; }
}
