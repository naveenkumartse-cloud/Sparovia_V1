using Sparovia.Domain.Enums;
using Sparovia.Domain.Exceptions;

namespace Sparovia.Domain.Entities;

public class Membership
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public Guid BusinessId { get; private set; }
    public MembershipRole Role { get; private set; }
    public MembershipStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation
    public User User { get; private set; } = null!;
    public Business Business { get; private set; } = null!;

    // EF Core constructor
    private Membership() { }

    public static Membership CreateOwner(Guid userId, Guid businessId)
    {
        if (userId == Guid.Empty)
            throw new DomainException("UserId is required.");
        if (businessId == Guid.Empty)
            throw new DomainException("BusinessId is required.");

        var now = DateTime.UtcNow;
        return new Membership
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BusinessId = businessId,
            Role = MembershipRole.Owner,
            Status = MembershipStatus.Active,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public static Membership CreateStaff(Guid userId, Guid businessId)
    {
        if (userId == Guid.Empty)
            throw new DomainException("UserId is required.");
        if (businessId == Guid.Empty)
            throw new DomainException("BusinessId is required.");

        var now = DateTime.UtcNow;
        return new Membership
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BusinessId = businessId,
            Role = MembershipRole.Staff,
            Status = MembershipStatus.Active,
            CreatedAt = now,
            UpdatedAt = now
        };
    }
}
