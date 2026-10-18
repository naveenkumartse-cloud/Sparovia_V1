namespace Sparovia.Domain.Entities;

public class LeadFollowUp
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Critical tenant isolation key
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    // Associated Lead
    public Guid LeadId { get; set; }
    public Lead? Lead { get; set; }

    // Interaction timestamp
    public DateTime FollowedUpAt { get; set; } = DateTime.UtcNow;

    // Contact method: Call, WhatsApp, Email, Meeting, Other
    public string Method { get; set; } = "Call";

    // Detailed conversation notes
    public string Notes { get; set; } = string.Empty;

    // Optional next action and scheduled follow-up
    public string? NextAction { get; set; }
    public DateTime? NextFollowUpAt { get; set; }

    // Operational audit identifiers
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
