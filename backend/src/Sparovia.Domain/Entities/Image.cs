namespace Sparovia.Domain.Entities;

public class Image
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Exactly one tenant owns the image
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    // Associated connected website
    public Guid WebsiteId { get; set; }
    public Website? Website { get; set; }

    // Server-controlled storage key (never client-specified)
    public required string StorageKey { get; set; }

    public string? OriginalFileName { get; set; }
    public required string MimeType { get; set; }
    public long FileSize { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }

    // UsageType: "WebsiteImage" | "ExploreOurWork"
    public required string UsageType { get; set; }

    // Optional slot mapping for controlled website layout: "heroImage", "primaryImage", "secondaryImage", "serviceImage"
    public string? Slot { get; set; }

    // Explore Our Work metadata
    public string? ProjectWorkName { get; set; }
    public string? Category { get; set; }
    public string? Caption { get; set; }

    // Lifecycle status: "Uploaded" | "Validated" | "Approved" | "Published" | "Unused" | "Rejected"
    public string Status { get; set; } = "Uploaded";

    // Safe website usage flag (removal from website usage unsets this without destroying original asset)
    public bool IsActiveWebsiteUsage { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Derived variants (AI enhanced, optimized, etc.)
    public ICollection<ImageVariant> Variants { get; set; } = new List<ImageVariant>();
}
