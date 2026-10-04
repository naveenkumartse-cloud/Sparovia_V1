namespace Sparovia.Domain.Entities;

public class Website
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // 1-to-1 relationship with Tenant in Pilot V1
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    public required string Name { get; set; }
    public required string Domain { get; set; }
    public string ConnectionStatus { get; set; } = "Connected";
    public string TemplateId { get; set; } = "kvn-interiors-v1";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<WebsiteContent> Contents { get; set; } = new List<WebsiteContent>();
    public ICollection<Image> Images { get; set; } = new List<Image>();
    public ICollection<Lead> Leads { get; set; } = new List<Lead>();
}
