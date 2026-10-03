using System;
using System.Collections.Generic;

namespace Sparovia.Application.Onboarding;

public class BusinessContextSummaryDto
{
    public bool IsConfirmed { get; set; }
    
    // Business Basics
    public string? BusinessName { get; set; }
    public string? BusinessType { get; set; }
    public string? PrimaryCategory { get; set; }
    public string? BusinessPhone { get; set; }
    public string? BusinessEmail { get; set; }
    public string? Website { get; set; }

    // Services
    public List<ServiceDto>? Services { get; set; }

    // Location & Customers
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public List<string>? ServiceAreas { get; set; }
    public List<string>? TargetCustomers { get; set; }

    // Business Description
    public string? BusinessDescription { get; set; }
    public string? Differentiators { get; set; }

    // Approved Facts & Claims
    public int? YearsInBusiness { get; set; }
    public List<string>? Certifications { get; set; }
    public List<string>? Awards { get; set; }
    public List<string>? Accreditations { get; set; }
    public List<string>? Warranties { get; set; }
    public List<string>? AuthorizedStatuses { get; set; }
    public List<string>? OtherClaims { get; set; }
}

public class ConfirmationResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}
