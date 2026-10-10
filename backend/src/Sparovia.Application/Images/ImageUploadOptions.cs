namespace Sparovia.Application.Images;

public class ImageUploadOptions
{
    public const string SectionName = "ImageUpload";

    /// <summary>
    /// Maximum allowed file size in bytes (defaults to 10 MB).
    /// </summary>
    public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024; // 10 MB

    /// <summary>
    /// Minimum allowed image width in pixels.
    /// </summary>
    public int MinWidth { get; set; } = 100;

    /// <summary>
    /// Minimum allowed image height in pixels.
    /// </summary>
    public int MinHeight { get; set; } = 100;

    /// <summary>
    /// Maximum allowed image width in pixels.
    /// </summary>
    public int MaxWidth { get; set; } = 10000;

    /// <summary>
    /// Maximum allowed image height in pixels.
    /// </summary>
    public int MaxHeight { get; set; } = 10000;

    /// <summary>
    /// Maximum allowed total pixel count (Width * Height) to prevent decompression bombs.
    /// Defaults to 25,000,000 pixels (25 MP) per Sparovia V1 specifications.
    /// </summary>
    public long MaxPixelCount { get; set; } = 25_000_000;

    /// <summary>
    /// Maximum number of images allowed per batch upload.
    /// </summary>
    public int MaxBatchSize { get; set; } = 10;

    /// <summary>
    /// Allowed file extensions (must include leading dot).
    /// </summary>
    public List<string> AllowedExtensions { get; set; } = new()
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    /// <summary>
    /// Allowed MIME content types.
    /// </summary>
    public List<string> AllowedMimeTypes { get; set; } = new()
    {
        "image/jpeg", "image/png", "image/webp"
    };
}
