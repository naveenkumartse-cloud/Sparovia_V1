using System.ComponentModel.DataAnnotations;

namespace Sparovia.Application.Onboarding;

public class ApprovedFactsDto
{
    [Range(0, 500, ErrorMessage = "Years in business must be a positive number.")]
    public int? YearsInBusiness { get; set; }

    public List<string>? Certifications { get; set; }
    public List<string>? Awards { get; set; }
    public List<string>? Accreditations { get; set; }
    public List<string>? Warranties { get; set; }
    public List<string>? AuthorizedStatuses { get; set; }
    public List<string>? OtherClaims { get; set; }
}

public class ApprovedFactsResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public ApprovedFactsDto? Data { get; set; }
}
