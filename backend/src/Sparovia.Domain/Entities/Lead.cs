using Sparovia.Domain.Exceptions;

namespace Sparovia.Domain.Entities;

public class Lead
{
    public Guid Id { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string Source { get; private set; } = string.Empty;
    public string Status { get; private set; } = string.Empty;
    public string? Notes { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public Guid BusinessId { get; private set; }
    public Business Business { get; private set; } = null!;

    private Lead() { }

    public static Lead Create(Guid businessId, string fullName, string email, string phone, string source, string? notes)
    {
        if (businessId == Guid.Empty) throw new DomainException("BusinessId is required.");
        if (string.IsNullOrWhiteSpace(fullName)) throw new DomainException("Full name is required.");
        if (string.IsNullOrWhiteSpace(phone)) throw new DomainException("Phone is required.");

        var now = DateTime.UtcNow;
        return new Lead
        {
            Id = Guid.NewGuid(),
            BusinessId = businessId,
            FullName = fullName.Trim(),
            Email = email?.Trim() ?? "N/A",
            Phone = phone.Trim(),
            Source = string.IsNullOrWhiteSpace(source) ? "Manual" : source.Trim(),
            Status = "New",
            Notes = notes?.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public void UpdateStatus(string status)
    {
        if (string.IsNullOrWhiteSpace(status)) throw new DomainException("Status is required.");
        Status = status.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
}
