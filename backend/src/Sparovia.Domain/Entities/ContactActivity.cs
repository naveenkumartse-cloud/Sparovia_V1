namespace Sparovia.Domain.Entities;

public class ContactActivity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Tenant boundary - critical isolation key
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    // Associated website if captured from website
    public Guid? WebsiteId { get; set; }
    public Website? Website { get; set; }

    // Channel: "WhatsApp", "Facebook", "Instagram"
    public required string Channel { get; set; }

    // Event type: e.g. "ContactLinkClicked"
    public string EventType { get; set; } = "ContactLinkClicked";

    // Stable template ID if WhatsApp template
    public string? TemplateId { get; set; }

    // Template title for readability
    public string? TemplateTitle { get; set; }

    // Source context e.g. "floating-widget", "contact-section", "footer"
    public string? Source { get; set; }

    // Optional client correlation/deduplication identifier
    public string? CorrelationId { get; set; }

    // Server-enforced UTC timestamp
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
