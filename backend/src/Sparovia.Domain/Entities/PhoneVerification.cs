namespace Sparovia.Domain.Entities;

public class PhoneVerification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public required string PhoneNumber { get; set; }
    public required string PhoneNumberNormalized { get; set; }
    public required string OtpHash { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? VerifiedAt { get; set; }
    public int AttemptCount { get; set; } = 0;
    public DateTime? ConsumedAt { get; set; }
    public string? RequestId { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Verified, Expired, ExceededAttempts, Superseded
}
