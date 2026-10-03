namespace Sparovia.Domain.Entities;

public class Service
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public required string ServiceName { get; set; }
    public string? ServiceDescription { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Relationship
    public Guid BusinessContextId { get; set; }
    public BusinessContext? BusinessContext { get; set; }
}
