namespace Sparovia.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public required string NormalizedEmail { get; set; }
    public required string PasswordHash { get; set; }
    public string? PhoneNumber { get; set; }
    public string? PhoneNumberNormalized { get; set; }
    public bool PhoneVerified { get; set; } = false;
    public DateTime? PhoneVerifiedAt { get; set; }
    public bool EmailVerified { get; set; } = false;
    public string? VerificationTokenHash { get; set; }
    public DateTime? VerificationTokenExpiresAt { get; set; }
    public string? ResetTokenHash { get; set; }
    public DateTime? ResetTokenExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
}
