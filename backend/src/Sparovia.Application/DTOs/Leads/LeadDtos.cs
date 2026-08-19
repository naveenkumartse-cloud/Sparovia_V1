using System.ComponentModel.DataAnnotations;

namespace Sparovia.Application.DTOs.Leads;

public class LeadDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateLeadRequest
{
    [Required]
    public string FullName { get; set; } = string.Empty;
    
    public string? Email { get; set; }
    
    [Required]
    public string Phone { get; set; } = string.Empty;
    
    public string? Source { get; set; }
    public string? Notes { get; set; }
}

public class UpdateLeadStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}
