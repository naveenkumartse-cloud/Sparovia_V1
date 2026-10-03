namespace Sparovia.Domain.Entities;

public class AIRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Tenant ownership (mandatory)
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    // User who initiated the request (optional)
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    // Operation classification (e.g. ImproveWording, MakeMoreProfessional, etc.)
    public required string OperationType { get; set; }

    // Target resource (e.g. WebsiteContent, ImageVariant)
    public required string ResourceType { get; set; }
    public Guid ResourceId { get; set; }

    // Lifecycle status: Processing, Succeeded, Failed, Rejected
    public string Status { get; set; } = "Processing";

    // Review status: PendingReview, Accepted, Rejected, EditedBeforeAcceptance
    public string ReviewStatus { get; set; } = "PendingReview";

    // Result output and original baseline
    public string? OutputText { get; set; }
    public string? OriginalText { get; set; }

    // Human Review tracking
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public User? ReviewedByUser { get; set; }

    // Optimistic concurrency / Stale draft protection
    public int? TargetResourceVersion { get; set; }

    // Section and Field target metadata for Content AI
    public string? TargetSectionKey { get; set; }
    public string? TargetFieldKey { get; set; }

    // Internal metadata references (not exposed to client as configuration)
    public string? ProviderReference { get; set; }
    public string? ModelReference { get; set; }
    public string? ContextVersion { get; set; }

    // Failure / Error info
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
