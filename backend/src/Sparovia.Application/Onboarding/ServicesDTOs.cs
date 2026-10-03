using System.ComponentModel.DataAnnotations;

namespace Sparovia.Application.Onboarding;

public class ServiceDto
{
    public Guid Id { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string? ServiceDescription { get; set; }
}

public class AddServiceRequest
{
    [Required(ErrorMessage = "Service name is required.")]
    [StringLength(256, ErrorMessage = "Service name cannot exceed 256 characters.")]
    public string ServiceName { get; set; } = string.Empty;

    [StringLength(2000, ErrorMessage = "Service description is too long.")]
    public string? ServiceDescription { get; set; }
}

public class UpdateServiceRequest
{
    [Required(ErrorMessage = "Service name is required.")]
    [StringLength(256, ErrorMessage = "Service name cannot exceed 256 characters.")]
    public string ServiceName { get; set; } = string.Empty;

    [StringLength(2000, ErrorMessage = "Service description is too long.")]
    public string? ServiceDescription { get; set; }
}

public class ServiceResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public ServiceDto? Service { get; set; }
}
