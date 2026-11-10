using SkiaSharp;
using Sparovia.Application.Images;

namespace Sparovia.Infrastructure.Images;

public interface ILocalAiRestorationService
{
    bool IsAvailable { get; }
    string ModelName { get; }
    string ModelLicence { get; }
    string ModelProvenance { get; }
    Task<SKBitmap?> TryRestoreAsync(SKBitmap source, ImageAnalysisResult analysis, CancellationToken cancellationToken = default);
}
