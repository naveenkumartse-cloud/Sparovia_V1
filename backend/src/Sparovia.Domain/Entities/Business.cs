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
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
}
