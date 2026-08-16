using Sparovia.Domain.Exceptions;

namespace Sparovia.Domain.Entities;

public class User
{
    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    public ICollection<Membership> Memberships { get; private set; } = new List<Membership>();

    // EF Core constructor
    private User() { }

    public static User Create(string email, string passwordHash, string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException("Email is required.");
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException("Password hash is required.");
        if (string.IsNullOrWhiteSpace(firstName))
            throw new DomainException("First name is required.");
        if (string.IsNullOrWhiteSpace(lastName))
            throw new DomainException("Last name is required.");

        var now = DateTime.UtcNow;
        return new User
        {
            Id = Guid.NewGuid(),
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
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
