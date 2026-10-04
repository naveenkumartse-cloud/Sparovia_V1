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
}
