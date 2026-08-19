using Sparovia.Domain.Exceptions;

namespace Sparovia.Domain.Entities;

public class MediaAsset
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty;
    public string Url { get; private set; } = string.Empty;
    public DateTime UploadedAt { get; private set; }

    public Guid BusinessId { get; private set; }
    public Business Business { get; private set; } = null!;

    private MediaAsset() { }

    public static MediaAsset Create(Guid businessId, string title, string category, string url)
    {
        if (businessId == Guid.Empty) throw new DomainException("BusinessId is required.");
        if (string.IsNullOrWhiteSpace(title)) throw new DomainException("Title is required.");
        if (string.IsNullOrWhiteSpace(category)) throw new DomainException("Category is required.");
        if (string.IsNullOrWhiteSpace(url)) throw new DomainException("URL is required.");

        return new MediaAsset
        {
            Id = Guid.NewGuid(),
            BusinessId = businessId,
            Title = title.Trim(),
            Category = category.Trim(),
            Url = url.Trim(),
            UploadedAt = DateTime.UtcNow
        };
    }
}
