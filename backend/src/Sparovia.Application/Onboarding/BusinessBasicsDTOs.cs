using System.ComponentModel.DataAnnotations;

namespace Sparovia.Application.Onboarding;

public class BusinessBasicsDto
{
    [Required(ErrorMessage = "Business name is required.")]
    [StringLength(256, ErrorMessage = "Business name cannot exceed 256 characters.")]
    public required string BusinessName { get; set; }

    [Required(ErrorMessage = "Business type is required.")]
    [StringLength(100)]
    public required string BusinessType { get; set; }

    [Required(ErrorMessage = "Primary business category is required.")]
    [StringLength(100)]
    public required string PrimaryCategory { get; set; }

    [StringLength(30)]
    [Phone(ErrorMessage = "Enter a valid phone number.")]
    public string? BusinessPhone { get; set; }

    [Required(ErrorMessage = "Enter a valid business email address.")]
    [EmailAddress(ErrorMessage = "Enter a valid business email address.")]
    [StringLength(256)]
    public required string BusinessEmail { get; set; }

    [StringLength(256)]
    [Url(ErrorMessage = "Enter a valid website address. Ensure it starts with http:// or https://")]
    public string? Website { get; set; }
}

public class BusinessBasicsResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}
