using System.ComponentModel.DataAnnotations;

namespace Sparovia.Application.Onboarding;

public class LocationAndCustomersDto
{
    [StringLength(256, ErrorMessage = "Address Line 1 cannot exceed 256 characters.")]
    public string? AddressLine1 { get; set; }

    [StringLength(256, ErrorMessage = "Address Line 2 cannot exceed 256 characters.")]
    public string? AddressLine2 { get; set; }

    [StringLength(100, ErrorMessage = "City cannot exceed 100 characters.")]
    public string? City { get; set; }

    [StringLength(100, ErrorMessage = "State cannot exceed 100 characters.")]
    public string? State { get; set; }

    [StringLength(50, ErrorMessage = "Postal Code cannot exceed 50 characters.")]
    public string? PostalCode { get; set; }

    [StringLength(100, ErrorMessage = "Country cannot exceed 100 characters.")]
    public string? Country { get; set; }

    public List<string>? ServiceAreas { get; set; }
    
    public List<string>? TargetCustomers { get; set; }
}

public class LocationAndCustomersResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public LocationAndCustomersDto? Data { get; set; }
}
