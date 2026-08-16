using System.ComponentModel.DataAnnotations;

namespace Sparovia.Application.DTOs.Media;

public class MediaAssetDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
}

public class UploadMediaRequest
{
    [Required]
    public Stream FileStream { get; set; } = null!;

    [Required]
    public string FileName { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;
}
