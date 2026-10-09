namespace Sparovia.Application.Images;

public interface IImageProcessingService
{
    Task<ImageAnalysisResult> AnalyzeImageAsync(Stream imageStream, long fileSize, string? originalFormat = null, CancellationToken cancellationToken = default);
    Task<ProcessedImageResult> ProcessImageAsync(Stream imageStream, string operation, ImageProcessingOptions? options = null, CancellationToken cancellationToken = default);
}

public class ImageProcessingOptions
{
    public int? MaxWidth { get; set; }
    public int? MaxHeight { get; set; }
    public string? TargetFormat { get; set; }
    public int? Quality { get; set; }

    // Quality Studio Fine-tune controls
    public string? Preset { get; set; }
    public int? Brightness { get; set; }
    public int? Contrast { get; set; }
    public int? Sharpness { get; set; }
    public int? NoiseReduction { get; set; }
    public int? Saturation { get; set; }
}
