namespace Sparovia.Domain.Entities;

public class WebsiteContent
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    public Guid WebsiteId { get; set; }
    public Website? Website { get; set; }

    public required string SectionKey { get; set; }

    // Structured JSON content for draft and published versions
    public required string DraftContentJson { get; set; }
    public string? PublishedContentJson { get; set; }

    public string Status { get; set; } = "Draft"; // "Draft", "Published"
    public int Version { get; set; } = 1;

    public Guid? CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }
}
