using Sparovia.Domain.Exceptions;

namespace Sparovia.Domain.Entities;

public class WebsiteContent
{
    public Guid Id { get; private set; }
    public string SectionName { get; private set; } = string.Empty;
    public string SectionType { get; private set; } = string.Empty;
    public string Status { get; private set; } = string.Empty;
    public int ItemsCount { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public Guid BusinessId { get; private set; }
    public Business Business { get; private set; } = null!;

    private WebsiteContent() { }

    public static WebsiteContent Create(Guid businessId, string sectionName, string sectionType, string status, int itemsCount)
    {
        if (businessId == Guid.Empty) throw new DomainException("BusinessId is required.");
        if (string.IsNullOrWhiteSpace(sectionName)) throw new DomainException("SectionName is required.");
        if (string.IsNullOrWhiteSpace(sectionType)) throw new DomainException("SectionType is required.");

        return new WebsiteContent
        {
            Id = Guid.NewGuid(),
            BusinessId = businessId,
            SectionName = sectionName.Trim(),
            SectionType = sectionType.Trim(),
            Status = string.IsNullOrWhiteSpace(status) ? "Active" : status.Trim(),
            ItemsCount = itemsCount,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void Update(string status, int itemsCount)
    {
        Status = string.IsNullOrWhiteSpace(status) ? "Active" : status.Trim();
        ItemsCount = itemsCount;
        UpdatedAt = DateTime.UtcNow;
    }
}
