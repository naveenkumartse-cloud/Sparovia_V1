namespace Sparovia.Domain.Entities;

public class Membership
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public required string Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
