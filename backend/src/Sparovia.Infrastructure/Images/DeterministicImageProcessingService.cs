using Microsoft.Extensions.Logging;
using SkiaSharp;
using Sparovia.Application.Images;

namespace Sparovia.Infrastructure.Images;

public class DeterministicImageProcessingService : IImageProcessingService
{
    private readonly ILogger<DeterministicImageProcessingService> _logger;

    public DeterministicImageProcessingService(ILogger<DeterministicImageProcessingService> logger)
    {
        _logger = logger;
    }

    public async Task<ImageAnalysisResult> AnalyzeImageAsync(
        Stream imageStream,
        long fileSize,
        string? originalFormat = null,
        CancellationToken cancellationToken = default)
    {
        byte[] imageBytes;
        if (imageStream is MemoryStream ms)
        {
            imageBytes = ms.ToArray();
        }
        else
        {
            using var mem = new MemoryStream();
            if (imageStream.CanSeek) imageStream.Position = 0;
            await imageStream.CopyToAsync(mem, cancellationToken);
            imageBytes = mem.ToArray();
        }

        SKBitmap? bitmap = null;
        try
        {
            using var data = SKData.CreateCopy(imageBytes);
            if (data != null && data.Size > 0)
            {
                bitmap = SKBitmap.Decode(data);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to decode image data via SkiaSharp. Using fallback canvas for analysis.");
        }

        bitmap ??= new SKBitmap(800, 600, SKColorType.Rgba8888, SKAlphaType.Premul);

        using (bitmap)
        {
            var width = bitmap.Width;
            var height = bitmap.Height;
            var aspectRatio = Math.Round((double)width / Math.Max(1, height), 2);
            var isLargeEnough = width >= 1200 && height >= 800;

            // Downsample for fast statistical luminance/contrast/sharpness analysis
            var maxSampleDim = 256;
            var sampleW = width;
            var sampleH = height;
            if (width > maxSampleDim || height > maxSampleDim)
            {
                if (width >= height)
                {
                    sampleW = maxSampleDim;
                    sampleH = Math.Max(1, (int)Math.Round((double)height * maxSampleDim / width));
                }
                else
                {
                    sampleH = maxSampleDim;
                    sampleW = Math.Max(1, (int)Math.Round((double)width * maxSampleDim / height));
                }
            }

            using var sampleBitmap = new SKBitmap(sampleW, sampleH, SKColorType.Rgba8888, SKAlphaType.Premul);
            using (var canvas = new SKCanvas(sampleBitmap))
            {
                using var paint = new SKPaint
                {
                    FilterQuality = SKFilterQuality.Medium,
                    IsAntialias = true
                };
                var destRect = new SKRect(0, 0, sampleW, sampleH);
                canvas.DrawBitmap(bitmap, destRect, paint);
            }

            // Compute luminance matrix safely from color pixels
            var totalPixels = sampleW * sampleH;
            var lumMatrix = new double[sampleW, sampleH];
            double sumLum = 0;

            for (var y = 0; y < sampleH; y++)
            {
                for (var x = 0; x < sampleW; x++)
                {
                    var color = sampleBitmap.GetPixel(x, y);
                    // Rec. 709 luminance
                    var lum = (0.2126 * color.Red + 0.7152 * color.Green + 0.0722 * color.Blue) / 255.0;
                    lumMatrix[x, y] = lum;
                    sumLum += lum;
                }
            }

            var meanLum = sumLum / Math.Max(1, totalPixels);

            // Compute standard deviation (contrast)
            double varianceSum = 0;
            for (var y = 0; y < sampleH; y++)
            {
                for (var x = 0; x < sampleW; x++)
                {
                    var diff = lumMatrix[x, y] - meanLum;
                    varianceSum += diff * diff;
                }
            }
            var contrast = Math.Round(Math.Sqrt(varianceSum / Math.Max(1, totalPixels)), 4);

            // Compute discrete Laplacian variance for sharpness / edge strength
            double laplacianSum = 0;
            double laplacianSqSum = 0;
            var interiorCount = 0;

            for (var y = 1; y < sampleH - 1; y++)
            {
                for (var x = 1; x < sampleW - 1; x++)
                {
                    var lap = 4.0 * lumMatrix[x, y]
                              - lumMatrix[x - 1, y]
                              - lumMatrix[x + 1, y]
                              - lumMatrix[x, y - 1]
                              - lumMatrix[x, y + 1];

                    laplacianSum += lap;
                    laplacianSqSum += lap * lap;
                    interiorCount++;
                }
            }

            var meanLap = interiorCount > 0 ? laplacianSum / interiorCount : 0;
            var sharpnessVariance = interiorCount > 0
                ? Math.Max(0, (laplacianSqSum / interiorCount) - (meanLap * meanLap))
                : 0.0;
            var sharpness = Math.Round(sharpnessVariance, 5);

            // Estimate high-frequency noise in smooth patches
            double noiseDiffSum = 0;
            var smoothPatchCount = 0;
            for (var y = 1; y < sampleH - 1; y += 2)
            {
                for (var x = 1; x < sampleW - 1; x += 2)
                {
                    var localMean = (lumMatrix[x - 1, y] + lumMatrix[x + 1, y] + lumMatrix[x, y - 1] + lumMatrix[x, y + 1]) / 4.0;
                    var localDiff = Math.Abs(lumMatrix[x, y] - localMean);
                    if (localDiff < 0.08) // Uniform flat area
                    {
                        noiseDiffSum += localDiff;
                        smoothPatchCount++;
                    }
                }
            }
            var noiseLevel = smoothPatchCount > 0 ? Math.Round(noiseDiffSum / smoothPatchCount, 4) : 0.01;

            // Determine format display string
            var formatDisplay = !string.IsNullOrWhiteSpace(originalFormat)
                ? originalFormat.ToUpperInvariant().Replace("IMAGE/", "")
                : "IMAGE";
            if (formatDisplay.Contains("JPEG") || formatDisplay.Contains("JPG")) formatDisplay = "JPEG";
            else if (formatDisplay.Contains("PNG")) formatDisplay = "PNG";
            else if (formatDisplay.Contains("WEBP")) formatDisplay = "WEBP";

            // Deterministic Recommendation based on actual measured image properties
            string recommendedOp;
            string recommendedReason;

            if (width < 1000 || height < 700)
            {
                recommendedOp = "Upscale";
                recommendedReason = "This image has a relatively low resolution for large website displays.";
            }
            else if (fileSize > 1_800_000 || (width >= 1600 && fileSize > 1_200_000))
            {
                recommendedOp = "WebOptimize";
                recommendedReason = "This image is suitable for the website, but its file size can be reduced for faster loading.";
            }
            else if (contrast < 0.16)
            {
                recommendedOp = "ImproveClarity";
                recommendedReason = "This image has subtle contrast and may benefit from balanced tonal and clarity refinement.";
            }
            else if (sharpness < 0.007)
            {
                recommendedOp = "ImproveSharpness";
                recommendedReason = "This image appears slightly soft and may benefit from mild sharpening.";
            }
            else if (noiseLevel > 0.035)
            {
                recommendedOp = "ReduceNoise";
                recommendedReason = "This image shows noticeable grain or noise in uniform areas.";
            }
            else
            {
                recommendedOp = "WebOptimize";
                recommendedReason = "This image is ready for website delivery with optimized WebP compression.";
            }

            return new ImageAnalysisResult
            {
                Width = width,
                Height = height,
                FileSize = fileSize,
                Format = formatDisplay,
                AspectRatio = aspectRatio,
                Brightness = Math.Round(meanLum, 3),
                Contrast = contrast,
                Sharpness = sharpness,
                NoiseLevel = noiseLevel,
                IsLargeEnough = isLargeEnough,
                RecommendedOperation = recommendedOp,
                RecommendationReason = recommendedReason
            };
        }
    }

    public async Task<ProcessedImageResult> ProcessImageAsync(
        Stream imageStream,
        string operation,
        ImageProcessingOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        byte[] imageBytes;
        if (imageStream is MemoryStream ms)
        {
            imageBytes = ms.ToArray();
        }
        else
        {
            using var mem = new MemoryStream();
            if (imageStream.CanSeek) imageStream.Position = 0;
            await imageStream.CopyToAsync(mem, cancellationToken);
            imageBytes = mem.ToArray();
        }

        SKBitmap? sourceBitmap = null;
        try
        {
            using var data = SKData.CreateCopy(imageBytes);
            if (data != null && data.Size > 0)
            {
                sourceBitmap = SKBitmap.Decode(data);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to decode input bytes with SkiaSharp. Using fallback canvas for processing.");
        }

        if (sourceBitmap == null)
        {
            var fallbackW = options?.MaxWidth ?? 1200;
            var fallbackH = options?.MaxHeight ?? (int)Math.Round(fallbackW * 9.0 / 16.0);
            sourceBitmap = new SKBitmap(fallbackW, fallbackH, SKColorType.Rgba8888, SKAlphaType.Premul);
        }

        using (sourceBitmap)
        {
            var normOp = operation?.Trim() ?? "WebOptimize";
            SKBitmap workingBitmap = sourceBitmap;
            bool ownsWorkingBitmap = false;

            try
            {
                if (normOp.StartsWith("QualityStudio", StringComparison.OrdinalIgnoreCase) ||
                    options?.Preset != null ||
                    options?.Brightness != null ||
                    options?.Contrast != null ||
                    options?.Sharpness != null ||
                    options?.NoiseReduction != null ||
                    options?.Saturation != null)
                {
                    // 1. Resolve preset (Default: Balanced)
                    var preset = options?.Preset;
                    if (string.IsNullOrWhiteSpace(preset) && normOp.Contains(':'))
                    {
                        preset = normOp.Substring(normOp.IndexOf(':') + 1).Trim();
                    }
                    if (string.IsNullOrWhiteSpace(preset))
                    {
                        preset = "Balanced";
                    }

                    // Default values for standard deterministic presets
                    int defaultBrightness = 4;
                    int defaultContrast = 10;
                    int defaultSharpness = 35;
                    int defaultNoiseReduction = 20;
                    int defaultSaturation = 6;

                    if (string.Equals(preset, "Light", StringComparison.OrdinalIgnoreCase))
                    {
                        defaultBrightness = 2;
                        defaultContrast = 5;
                        defaultSharpness = 15;
                        defaultNoiseReduction = 10;
                        defaultSaturation = 2;
                    }
                    else if (string.Equals(preset, "High", StringComparison.OrdinalIgnoreCase))
                    {
                        defaultBrightness = 6;
                        defaultContrast = 16;
                        defaultSharpness = 60;
                        defaultNoiseReduction = 35;
                        defaultSaturation = 10;
                    }

                    // Safe clamping on fine-tune overrides (-50 to +50 for tone/color, 0 to 100 for filters)
                    int brightness = Math.Clamp(options?.Brightness ?? defaultBrightness, -50, 50);
                    int contrast = Math.Clamp(options?.Contrast ?? defaultContrast, -50, 50);
                    int sharpness = Math.Clamp(options?.Sharpness ?? defaultSharpness, 0, 100);
                    int noiseReduction = Math.Clamp(options?.NoiseReduction ?? defaultNoiseReduction, 0, 100);
                    int saturation = Math.Clamp(options?.Saturation ?? defaultSaturation, -50, 50);

                    // Step A: Noise reduction (gentle Gaussian smoothing preserving textures)
                    if (noiseReduction > 0)
                    {
                        var sigma = Math.Min(1.2f, (noiseReduction / 100f) * 1.0f);
                        var blurred = ApplyBlur(workingBitmap, sigma);
                        if (ownsWorkingBitmap) workingBitmap.Dispose();
                        workingBitmap = blurred;
                        ownsWorkingBitmap = true;
                    }

                    // Step B: Controlled sharpening (unsharp mask with clamped amount to prevent edge halos)
                    if (sharpness > 0)
                    {
                        var amount = Math.Min(0.75f, (sharpness / 100f) * 0.75f);
                        var sharpened = ApplySharpening(workingBitmap, amount);
                        if (ownsWorkingBitmap) workingBitmap.Dispose();
                        workingBitmap = sharpened;
                        ownsWorkingBitmap = true;
                    }

                    // Step C: Brightness, Contrast, Saturation adjustments via Rec. 709 ColorMatrix
                    var cScale = 1.0f + (contrast / 100f);
                    var bOffset = (brightness / 100f) * 128f;
                    var sScale = 1.0f + (saturation / 100f);

                    var colorAdjusted = ApplyColorAdjustments(workingBitmap, cScale, bOffset, sScale);
                    if (ownsWorkingBitmap) workingBitmap.Dispose();
                    workingBitmap = colorAdjusted;
                    ownsWorkingBitmap = true;
                }
                else if (string.Equals(normOp, "ImproveClarity", StringComparison.OrdinalIgnoreCase))
                {
                    // Controlled contrast (+10%), mild brightness (+2%), restrained saturation (+4%), mild sharpening
                    var processed = ApplyColorAdjustments(workingBitmap, contrast: 1.10f, brightnessOffset: 5f, saturation: 1.04f);
                    var sharpened = ApplySharpening(processed, amount: 0.35f);
                    processed.Dispose();
                    workingBitmap = sharpened;
                    ownsWorkingBitmap = true;
                }
                else if (string.Equals(normOp, "ImproveSharpness", StringComparison.OrdinalIgnoreCase))
                {
                    // Controlled sharpening without edge halos or artifact creation
                    var sharpened = ApplySharpening(workingBitmap, amount: 0.65f);
                    workingBitmap = sharpened;
                    ownsWorkingBitmap = true;
                }
                else if (string.Equals(normOp, "ReduceNoise", StringComparison.OrdinalIgnoreCase))
                {
                    // Conservative smoothing preserving architectural details, wood grain and textures
                    var smoothed = ApplyBlur(workingBitmap, sigma: 0.6f);
                    var contrastAdjusted = ApplyColorAdjustments(smoothed, contrast: 1.03f, brightnessOffset: 0f, saturation: 1.0f);
                    smoothed.Dispose();
                    workingBitmap = contrastAdjusted;
                    ownsWorkingBitmap = true;
                }
                else if (string.Equals(normOp, "Upscale", StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(normOp, "UpscaleResolution", StringComparison.OrdinalIgnoreCase))
                {
                    // High-quality deterministic interpolation using high filter quality
                    var factor = (workingBitmap.Width < 800 || workingBitmap.Height < 600) ? 2.0 : 1.5;
                    var targetW = (int)Math.Min(2560, Math.Round(workingBitmap.Width * factor));
                    var targetH = (int)Math.Round((double)workingBitmap.Height * targetW / workingBitmap.Width);

                    var resampled = ResizeBitmap(workingBitmap, targetW, targetH);
                    var refined = ApplySharpening(resampled, amount: 0.25f);
                    resampled.Dispose();
                    workingBitmap = refined;
                    ownsWorkingBitmap = true;
                }
                else if (string.Equals(normOp, "ClassicLook", StringComparison.OrdinalIgnoreCase))
                {
                    // Subtle organic tone mapping, natural warmth and restrained saturation
                    var processed = ApplyColorAdjustments(workingBitmap, contrast: 1.06f, brightnessOffset: 2f, saturation: 0.95f);
                    workingBitmap = processed;
                    ownsWorkingBitmap = true;
                }
                else if (string.Equals(normOp, "ModernLook", StringComparison.OrdinalIgnoreCase))
                {
                    // Contemporary architectural contrast and crisp clarity
                    var processed = ApplyColorAdjustments(workingBitmap, contrast: 1.12f, brightnessOffset: 4f, saturation: 1.06f);
                    var sharpened = ApplySharpening(processed, amount: 0.3f);
                    processed.Dispose();
                    workingBitmap = sharpened;
                    ownsWorkingBitmap = true;
                }
                else if (string.Equals(normOp, "WebOptimize", StringComparison.OrdinalIgnoreCase))
                {
                    var maxW = options?.MaxWidth ?? 1600;
                    if (workingBitmap.Width > maxW)
                    {
                        var targetH = (int)Math.Round((double)workingBitmap.Height * maxW / workingBitmap.Width);
                        var resized = ResizeBitmap(workingBitmap, maxW, targetH);
                        workingBitmap = resized;
                        ownsWorkingBitmap = true;
                    }
                }
                else
                {
                    _logger.LogWarning("Unrecognized image enhancement operation '{Operation}'. Applying balanced optimization.", operation);
                    var processed = ApplyColorAdjustments(workingBitmap, contrast: 1.05f, brightnessOffset: 0f, saturation: 1.0f);
                    workingBitmap = processed;
                    ownsWorkingBitmap = true;
                }

                // If WebOptimize options specified max dimensions on top of another operation
                if (options?.MaxWidth.HasValue == true && workingBitmap.Width > options.MaxWidth.Value)
                {
                    var maxW = options.MaxWidth.Value;
                    var targetH = (int)Math.Round((double)workingBitmap.Height * maxW / workingBitmap.Width);
                    var resized = ResizeBitmap(workingBitmap, maxW, targetH);
                    if (ownsWorkingBitmap) workingBitmap.Dispose();
                    workingBitmap = resized;
                    ownsWorkingBitmap = true;
                }

                // Export as WebP for optimal web delivery and fast loading
                var targetFormat = options?.TargetFormat?.ToLowerInvariant() ?? "webp";
                SKEncodedImageFormat encodeFormat;
                string mimeType;
                string ext;

                if (targetFormat is "jpeg" or "jpg")
                {
                    encodeFormat = SKEncodedImageFormat.Jpeg;
                    mimeType = "image/jpeg";
                    ext = ".jpg";
                }
                else if (targetFormat is "png")
                {
                    encodeFormat = SKEncodedImageFormat.Png;
                    mimeType = "image/png";
                    ext = ".png";
                }
                else
                {
                    encodeFormat = SKEncodedImageFormat.Webp;
                    mimeType = "image/webp";
                    ext = ".webp";
                }

                var quality = options?.Quality ?? (encodeFormat == SKEncodedImageFormat.Webp ? 82 : 85);
                using var image = SKImage.FromBitmap(workingBitmap);
                using var data = image.Encode(encodeFormat, quality);

                var bytes = data.ToArray();

                return new ProcessedImageResult
                {
                    Bytes = bytes,
                    MimeType = mimeType,
                    FileExtension = ext,
                    Width = workingBitmap.Width,
                    Height = workingBitmap.Height,
                    FileSize = bytes.Length
                };
            }
            finally
            {
                if (ownsWorkingBitmap && workingBitmap != null && !ReferenceEquals(workingBitmap, sourceBitmap))
                {
                    workingBitmap.Dispose();
                }
            }
        }
    }

    private static SKBitmap ResizeBitmap(SKBitmap source, int width, int height)
    {
        var dest = new SKBitmap(width, height, source.ColorType, source.AlphaType);
        using var canvas = new SKCanvas(dest);
        using var paint = new SKPaint
        {
            FilterQuality = SKFilterQuality.High,
            IsAntialias = true
        };
        var destRect = new SKRect(0, 0, width, height);
        canvas.DrawBitmap(source, destRect, paint);
        return dest;
    }

    private static SKBitmap ApplyBlur(SKBitmap source, float sigma)
    {
        var dest = new SKBitmap(source.Width, source.Height, source.ColorType, source.AlphaType);
        using var canvas = new SKCanvas(dest);
        using var paint = new SKPaint
        {
            ImageFilter = SKImageFilter.CreateBlur(sigma, sigma),
            IsAntialias = true
        };
        canvas.DrawBitmap(source, 0, 0, paint);
        return dest;
    }

    private static SKBitmap ApplySharpening(SKBitmap source, float amount)
    {
        // Unsharp mask via 3x3 convolution kernel:
        // center = 1 + 4*a, neighbors = -a
        var center = 1.0f + 4.0f * amount;
        var edge = -amount;
        var kernel = new float[]
        {
             0,    edge,    0,
            edge, center,  edge,
             0,    edge,    0
        };

        var dest = new SKBitmap(source.Width, source.Height, source.ColorType, source.AlphaType);
        using var canvas = new SKCanvas(dest);
        using var paint = new SKPaint
        {
            ImageFilter = SKImageFilter.CreateMatrixConvolution(
                new SKSizeI(3, 3),
                kernel,
                gain: 1.0f,
                bias: 0f,
                kernelOffset: new SKPointI(1, 1),
                tileMode: SKShaderTileMode.Clamp,
                convolveAlpha: false),
            IsAntialias = true
        };
        canvas.DrawBitmap(source, 0, 0, paint);
        return dest;
    }

    private static SKBitmap ApplyColorAdjustments(SKBitmap source, float contrast, float brightnessOffset, float saturation)
    {
        // Construct 4x5 ColorFilter matrix combining contrast, saturation, and brightness offset
        var c = contrast;
        var offset = 128f * (1f - c) + brightnessOffset;

        // Saturation weights (Rec 709)
        var s = saturation;
        var sr = (1f - s) * 0.2126f;
        var sg = (1f - s) * 0.7152f;
        var sb = (1f - s) * 0.0722f;

        // Multiply contrast scale into the saturation matrix
        var colorMatrix = new float[]
        {
            (sr + s) * c, sg * c,        sb * c,        0, offset,
            sr * c,       (sg + s) * c,  sb * c,        0, offset,
            sr * c,       sg * c,        (sb + s) * c,  0, offset,
            0,            0,             0,             1, 0
        };

        var dest = new SKBitmap(source.Width, source.Height, source.ColorType, source.AlphaType);
        using var canvas = new SKCanvas(dest);
        using var paint = new SKPaint
        {
            ColorFilter = SKColorFilter.CreateColorMatrix(colorMatrix),
            IsAntialias = true
        };
        canvas.DrawBitmap(source, 0, 0, paint);
        return dest;
    }
}
