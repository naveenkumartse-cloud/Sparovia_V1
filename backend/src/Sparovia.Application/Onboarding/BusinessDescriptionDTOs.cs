using System.ComponentModel.DataAnnotations;

namespace Sparovia.Application.Onboarding;

public class BusinessDescriptionDto
{
    [StringLength(4000, ErrorMessage = "Business Description cannot exceed 4000 characters.")]
    public string? BusinessDescription { get; set; }

    [StringLength(4000, ErrorMessage = "Differentiators cannot exceed 4000 characters.")]
    public string? Differentiators { get; set; }
}

public class BusinessDescriptionResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public BusinessDescriptionDto? Data { get; set; }
}
