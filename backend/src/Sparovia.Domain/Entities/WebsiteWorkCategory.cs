namespace Sparovia.Domain.Entities;

public class WebsiteWorkCategory
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    public Guid WebsiteId { get; set; }
    public Website? Website { get; set; }

    public required string Name { get; set; }
    public required string Slug { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
