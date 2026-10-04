using Sparovia.Domain.Constants;

namespace Sparovia.Domain.Entities;

public class Lead
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Exactly one tenant owns the lead - critical isolation key
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    // Associated website if captured from website
    public Guid? WebsiteId { get; set; }
    public Website? Website { get; set; }

    // Contact Information
    public required string Name { get; set; }
    public required string Phone { get; set; }
    public string? Email { get; set; }
    public string? Message { get; set; }

    // Area of Interest (Tenant Work Category)
    public string? AreaOfInterest { get; set; }
    public Guid? AreaOfInterestCategoryId { get; set; }
    public WebsiteWorkCategory? AreaOfInterestCategory { get; set; }

    // Metadata & Classification
    public string Source { get; set; } = LeadSource.Website; // "Website" | "WhatsApp"
    public string Status { get; set; } = LeadStatus.New;     // "New" | "Contacted" | "Closed"
    
    // External / WhatsApp reference for idempotency and traceability
    public string? SourceReference { get; set; }

    // Timestamps
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Operational audit identifiers
    public Guid? UpdatedByUserId { get; set; }
    public User? UpdatedByUser { get; set; }
}
