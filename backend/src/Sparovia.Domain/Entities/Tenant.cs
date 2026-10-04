namespace Sparovia.Domain.Entities;

public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
    public BusinessContext? BusinessContext { get; set; }
    public BusinessPresence? BusinessPresence { get; set; }
    public Website? Website { get; set; }
    public ICollection<WebsiteContent> WebsiteContents { get; set; } = new List<WebsiteContent>();
    public ICollection<AIRequest> AIRequests { get; set; } = new List<AIRequest>();
    public TenantAIConfiguration? AIConfiguration { get; set; }
    public ICollection<Image> Images { get; set; } = new List<Image>();
    public ICollection<Lead> Leads { get; set; } = new List<Lead>();
}
