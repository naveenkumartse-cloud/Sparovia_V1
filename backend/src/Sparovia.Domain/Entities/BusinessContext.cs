namespace Sparovia.Domain.Entities;

public class BusinessContext
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    // Core Business Basics
    public required string BusinessName { get; set; }
    public required string BusinessType { get; set; }
    public required string PrimaryCategory { get; set; }
    public string? BusinessPhone { get; set; }
    public required string BusinessEmail { get; set; }
    public string? Website { get; set; }

    // Location & Customers
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    
    public List<string>? ServiceAreas { get; set; } = new();
    public List<string>? TargetCustomers { get; set; } = new();

    // Business Description
    public string? BusinessDescription { get; set; }
    public string? Differentiators { get; set; }

    // Approved Facts & Claims
    public int? YearsInBusiness { get; set; }
    public List<string>? Certifications { get; set; } = new();
    public List<string>? Awards { get; set; } = new();
    public List<string>? Accreditations { get; set; } = new();
    public List<string>? Warranties { get; set; } = new();
    public List<string>? AuthorizedStatuses { get; set; } = new();
    public List<string>? OtherClaims { get; set; } = new();

    // Confirmation State
    public bool IsConfirmed { get; set; } = false;
    public DateTime? ConfirmedAt { get; set; }
    public Guid? ConfirmedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Tenant Relationship
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    public ICollection<Service> Services { get; set; } = new List<Service>();
}
