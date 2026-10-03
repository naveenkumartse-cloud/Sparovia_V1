using System.ComponentModel.DataAnnotations;

namespace Sparovia.Application.BusinessPresence;

public class VerifiedNapDto
{
    public required string BusinessName { get; set; }
    public required string BusinessType { get; set; }
    public required string PrimaryCategory { get; set; }
    public string? BusinessPhone { get; set; }
    public required string BusinessEmail { get; set; }
    public string? Website { get; set; }

    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public List<string>? ServiceAreas { get; set; } = new();

    public bool IsConfirmed { get; set; }

    // Extended presence context fields (Business Context Source of Truth)
    public string? BusinessDescription { get; set; }
    public List<string>? TargetCustomers { get; set; } = new();
    public string? Differentiators { get; set; }
    public int? YearsInBusiness { get; set; }
    public List<string>? Certifications { get; set; } = new();
    public List<string>? Awards { get; set; } = new();
    public List<string>? Accreditations { get; set; } = new();
    public List<string>? Warranties { get; set; } = new();
    public List<string>? AuthorizedStatuses { get; set; } = new();
    public List<string>? OtherClaims { get; set; } = new();
    public int ServicesCount { get; set; }
    public List<string>? ServiceNames { get; set; } = new();
}

public class BusinessPresenceDto
{
    public string? OperatingHours { get; set; }
    public string? PublicNotice { get; set; }
    public DateTime? LastReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public VerifiedNapDto? VerifiedNap { get; set; }
}

public class UpdateBusinessPresenceRequest
{
    [MaxLength(2000, ErrorMessage = "Operating hours cannot exceed 2000 characters.")]
    public string? OperatingHours { get; set; }

    [MaxLength(1000, ErrorMessage = "Public notice cannot exceed 1000 characters.")]
    public string? PublicNotice { get; set; }
}

public class BusinessPresenceResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public BusinessPresenceDto? Presence { get; set; }
}
