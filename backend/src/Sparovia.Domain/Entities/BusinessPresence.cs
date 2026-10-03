namespace Sparovia.Domain.Entities;

public class BusinessPresence
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // 1-to-1 relationship with Tenant
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    // Presence-specific information
    public string? OperatingHours { get; set; }
    public string? PublicNotice { get; set; }

    // Verification & Review audit tracking
    public DateTime? LastReviewedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
