using Sparovia.Domain.Enums;
using Sparovia.Domain.Exceptions;

namespace Sparovia.Domain.Entities;

public class Business
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Industry { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    
    // Onboarding & Business Understanding Context
    public bool IsOnboardingComplete { get; private set; }
    public string? TargetAudience { get; private set; }
    public string? ValueProposition { get; private set; }
    
    // Business Profile Contact
    public string? ContactEmail { get; private set; }
    public string? ContactPhone { get; private set; }
    public string? Address { get; private set; }
    
    // Digital Presence
    public bool? HasGoogleBusinessProfile { get; private set; }
    public string? GoogleBusinessProfileStatus { get; private set; }

    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    public ICollection<Membership> Memberships { get; private set; } = new List<Membership>();

    // EF Core constructor
    private Business() { }

    public static Business Create(string name, string slug, string industry, string? description = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Business name is required.");
        if (string.IsNullOrWhiteSpace(slug))
            throw new DomainException("Business slug is required.");
        if (string.IsNullOrWhiteSpace(industry))
            throw new DomainException("Industry is required.");

        var now = DateTime.UtcNow;
        return new Business
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            Industry = industry.Trim(),
            Description = description?.Trim(),
            IsOnboardingComplete = false,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public void UpdateInfo(
        string name, 
        string industry, 
        string? description = null,
        bool? isOnboardingComplete = null,
        string? targetAudience = null,
        string? valueProposition = null,
        string? contactEmail = null,
        string? contactPhone = null,
        string? address = null,
        bool? hasGoogleBusinessProfile = null,
        string? googleBusinessProfileStatus = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Business name is required.");
        if (string.IsNullOrWhiteSpace(industry))
            throw new DomainException("Industry is required.");

        Name = name.Trim();
        Industry = industry.Trim();
        Description = description?.Trim();
        
        if (isOnboardingComplete.HasValue)
            IsOnboardingComplete = isOnboardingComplete.Value;
            
        if (targetAudience != null) TargetAudience = targetAudience.Trim();
        if (valueProposition != null) ValueProposition = valueProposition.Trim();
        if (contactEmail != null) ContactEmail = contactEmail.Trim();
        if (contactPhone != null) ContactPhone = contactPhone.Trim();
        if (address != null) Address = address.Trim();
        
        if (hasGoogleBusinessProfile.HasValue) 
            HasGoogleBusinessProfile = hasGoogleBusinessProfile.Value;
            
        if (googleBusinessProfileStatus != null) 
            GoogleBusinessProfileStatus = googleBusinessProfileStatus.Trim();

        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
}
