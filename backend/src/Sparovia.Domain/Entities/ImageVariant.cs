namespace Sparovia.Domain.Entities;

public class ImageVariant
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    public Guid ImageId { get; set; }
    public Image? Image { get; set; }

    public Guid? ParentVariantId { get; set; }
    public ImageVariant? ParentVariant { get; set; }

    // "AIEnhanced" | "WebsiteOptimized" | "Responsive"
    public required string VariantType { get; set; }

    // Operation if AI enhanced: "ImproveClarity" | "ImproveSharpness" | "ReduceNoise" | "Upscale" | "ClassicLook" | "ModernLook" | "WebOptimize"
    public string? Operation { get; set; }

    public required string StorageKey { get; set; }
    public required string MimeType { get; set; }
    public long FileSize { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public int Version { get; set; } = 1;

    // "Processing" | "Enhanced" | "Approved" | "Published" | "Rejected" | "Failed"
    public string Status { get; set; } = "Processing";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
