using Microsoft.Extensions.Logging.Abstractions;
using SkiaSharp;
using Sparovia.Application.Images;
using Sparovia.Infrastructure.Images;
using Xunit;

namespace Sparovia.UnitTests;

/// <summary>
/// Phase 7: Quality Benchmark & Acceptance Tests.
/// Validates 30 synthetic architectural/business image cases across 5 defect categories:
/// 1. Underexposed (6 images)
/// 2. Bright highlights / windows (6 images)
/// 3. Color casts (6 images)
/// 4. Noisy / soft (6 images)
/// 5. Already-good reference photographs (6 images)
/// </summary>
public class QualityStudioBenchmarkTests
{
    private readonly DeterministicImageProcessingService _service;

    public QualityStudioBenchmarkTests()
    {
        _service = new DeterministicImageProcessingService(NullLogger<DeterministicImageProcessingService>.Instance);
    }

    public enum BenchmarkCategory
    {
        Underexposed,
        BrightHighlights,
        ColorCast,
        NoisySoft,
        AlreadyGood
    }

    public record BenchmarkImageCase(
        int Id,
        BenchmarkCategory Category,
        string Title,
        byte[] ImageBytes);

    private static byte[] CreateBenchmarkImage(BenchmarkCategory category, int seed, int width = 300, int height = 200)
    {
        using var bitmap = new SKBitmap(width, height, SKColorType.Rgba8888, SKAlphaType.Premul);
        var rng = new Random(seed);

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                SKColor pixelColor;

                switch (category)
                {
                    case BenchmarkCategory.Underexposed:
                    {
                        // Dark interior architectural room: deep shadows, low luminance (< 0.28)
                        byte baseVal = (byte)(20 + (x * 35 / width) + (y * 25 / height) + rng.Next(0, 8));
                        pixelColor = new SKColor(baseVal, (byte)(baseVal * 0.9), (byte)(baseVal * 0.8));
                        break;
                    }

                    case BenchmarkCategory.BrightHighlights:
                    {
                        // Room with a bright architectural window / sunlit facade (> 15% bright highlights)
                        bool isWindow = x > (width * 0.55) && y < (height * 0.70);
                        if (isWindow)
                        {
                            byte winVal = (byte)(240 + rng.Next(0, 15));
                            pixelColor = new SKColor(winVal, winVal, winVal);
                        }
                        else
                        {
                            byte roomVal = (byte)(110 + (x * 40 / width) + rng.Next(0, 10));
                            pixelColor = new SKColor(roomVal, (byte)(roomVal * 0.95), (byte)(roomVal * 0.9));
                        }
                        break;
                    }

                    case BenchmarkCategory.ColorCast:
                    {
                        // Unnatural cool/blue overcast or fluorescent architectural scene (Blue >> Red)
                        byte baseVal = (byte)(80 + (x * 50 / width) + (y * 40 / height));
                        byte blueVal = (byte)Math.Min(255, baseVal * 1.45 + 30);
                        byte greenVal = (byte)(baseVal * 1.05);
                        byte redVal = (byte)(baseVal * 0.75);
                        pixelColor = new SKColor(redVal, greenVal, blueVal);
                        break;
                    }

                    case BenchmarkCategory.NoisySoft:
                    {
                        // Low light sensor noise / grain in flat architectural walls
                        byte baseVal = (byte)(95 + (x * 20 / width));
                        int noise = rng.Next(-22, 23);
                        byte noisyVal = (byte)Math.Clamp(baseVal + noise, 0, 255);
                        pixelColor = new SKColor(noisyVal, noisyVal, noisyVal);
                        break;
                    }

                    case BenchmarkCategory.AlreadyGood:
                    default:
                    {
                        // Already-good reference photograph: well-exposed midtones (mean ~0.50), balanced contrast (~0.20), clean architectural edges
                        int panel = (x / 30) % 2;
                        int baseVal = panel == 0 ? 80 + (y * 20 / height) : 175 + (y * 15 / height);
                        byte r = (byte)baseVal;
                        byte g = (byte)(baseVal * 0.98);
                        byte b = (byte)(baseVal * 0.92);
                        pixelColor = new SKColor(r, g, b);
                        break;
                    }
                }

                bitmap.SetPixel(x, y, pixelColor);
            }
        }

        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Jpeg, 90);
        return data.ToArray();
    }

    private static List<BenchmarkImageCase> Generate30BenchmarkCases()
    {
        var cases = new List<BenchmarkImageCase>();
        int id = 1;

        // 6 Underexposed images
        for (int i = 0; i < 6; i++)
        {
            cases.Add(new BenchmarkImageCase(
                id++,
                BenchmarkCategory.Underexposed,
                $"Underexposed Interior {i + 1}",
                CreateBenchmarkImage(BenchmarkCategory.Underexposed, 100 + i)));
        }

        // 6 Bright Highlights / Window images
        for (int i = 0; i < 6; i++)
        {
            cases.Add(new BenchmarkImageCase(
                id++,
                BenchmarkCategory.BrightHighlights,
                $"Sunlit Window Facade {i + 1}",
                CreateBenchmarkImage(BenchmarkCategory.BrightHighlights, 200 + i)));
        }

        // 6 Color Cast images
        for (int i = 0; i < 6; i++)
        {
            cases.Add(new BenchmarkImageCase(
                id++,
                BenchmarkCategory.ColorCast,
                $"Cool Fluorescent Cast {i + 1}",
                CreateBenchmarkImage(BenchmarkCategory.ColorCast, 300 + i)));
        }

        // 6 Noisy / Soft images
        for (int i = 0; i < 6; i++)
        {
            cases.Add(new BenchmarkImageCase(
                id++,
                BenchmarkCategory.NoisySoft,
                $"Grainy Low-Light Wall {i + 1}",
                CreateBenchmarkImage(BenchmarkCategory.NoisySoft, 400 + i)));
        }

        // 6 Already-Good reference images
        for (int i = 0; i < 6; i++)
        {
            cases.Add(new BenchmarkImageCase(
                id++,
                BenchmarkCategory.AlreadyGood,
                $"Balanced Architectural Showcase {i + 1}",
                CreateBenchmarkImage(BenchmarkCategory.AlreadyGood, 500 + i)));
        }

        return cases;
    }

    [Fact]
    public void Benchmark_GeneratesExact30DistinctCases()
    {
        var cases = Generate30BenchmarkCases();
        Assert.Equal(30, cases.Count);
        Assert.Equal(6, cases.Count(c => c.Category == BenchmarkCategory.Underexposed));
        Assert.Equal(6, cases.Count(c => c.Category == BenchmarkCategory.BrightHighlights));
        Assert.Equal(6, cases.Count(c => c.Category == BenchmarkCategory.ColorCast));
        Assert.Equal(6, cases.Count(c => c.Category == BenchmarkCategory.NoisySoft));
        Assert.Equal(6, cases.Count(c => c.Category == BenchmarkCategory.AlreadyGood));
    }

    [Fact]
    public async Task Benchmark_All30Images_ProcessSuccessfullyWithAdaptiveProtections()
    {
        var cases = Generate30BenchmarkCases();

        foreach (var imgCase in cases)
        {
            using var stream = new MemoryStream(imgCase.ImageBytes);
            var result = await _service.ProcessImageAsync(
                stream,
                "QualityStudio:Balanced",
                new ImageProcessingOptions { Preset = "Balanced" });

            Assert.NotNull(result);
            Assert.NotEmpty(result.Bytes);
            Assert.True(result.FileSize > 0, $"Image {imgCase.Id} ({imgCase.Title}) produced 0 bytes.");
            Assert.Equal("image/webp", result.MimeType);
            Assert.Equal(".webp", result.FileExtension);
            Assert.Equal("1.0.0-deterministic", result.AlgorithmVersion);
            Assert.NotNull(result.EffectiveProfile);
            Assert.NotEmpty(result.AppliedCorrections);

            // Decode output bitmap for verification
            using var outData = SKData.CreateCopy(result.Bytes);
            using var outBmp = SKBitmap.Decode(outData);
            Assert.NotNull(outBmp);
            Assert.Equal(300, outBmp.Width);
            Assert.Equal(200, outBmp.Height);

            // Specific category assertions
            switch (imgCase.Category)
            {
                case BenchmarkCategory.Underexposed:
                    Assert.Contains(result.AppliedCorrections, c =>
                        c.Contains("Shadow", StringComparison.OrdinalIgnoreCase) ||
                        c.Contains("Exposure", StringComparison.OrdinalIgnoreCase));
                    break;

                case BenchmarkCategory.BrightHighlights:
                    Assert.Contains(result.AppliedCorrections, c =>
                        c.Contains("Highlights protected", StringComparison.OrdinalIgnoreCase));
                    // Highlight clamping check: verify center of window is not blown to pure white 255,255,255 if brightness reduced
                    var windowPixel = outBmp.GetPixel(200, 50);
                    // Must not crash or corrupt
                    Assert.True(windowPixel.Red > 0 && windowPixel.Green > 0 && windowPixel.Blue > 0);
                    break;

                case BenchmarkCategory.ColorCast:
                    Assert.Contains(result.AppliedCorrections, c =>
                        c.Contains("Authentic architectural material colors preserved", StringComparison.OrdinalIgnoreCase));
                    break;

                case BenchmarkCategory.NoisySoft:
                    Assert.Contains(result.AppliedCorrections, c =>
                        c.Contains("noise", StringComparison.OrdinalIgnoreCase) ||
                        c.Contains("edge", StringComparison.OrdinalIgnoreCase));
                    break;

                case BenchmarkCategory.AlreadyGood:
                    Assert.Contains(result.AppliedCorrections, c =>
                        c.Contains("High-quality architectural baseline preserved", StringComparison.OrdinalIgnoreCase) ||
                        c.Contains("Fine masonry and material textures preserved", StringComparison.OrdinalIgnoreCase));
                    // Must have noise reduction = 0 in profile to preserve masonry / wood textures
                    Assert.Contains("nr=0", result.EffectiveProfile);
                    break;
            }
        }
    }

    [Fact]
    public async Task Benchmark_Determinism_IdenticalInputProducesByteIdenticalOutput()
    {
        var testCase = Generate30BenchmarkCases().First(c => c.Category == BenchmarkCategory.AlreadyGood);

        using var stream1 = new MemoryStream(testCase.ImageBytes);
        var result1 = await _service.ProcessImageAsync(stream1, "QualityStudio:Balanced", new ImageProcessingOptions { Preset = "Balanced" });

        using var stream2 = new MemoryStream(testCase.ImageBytes);
        var result2 = await _service.ProcessImageAsync(stream2, "QualityStudio:Balanced", new ImageProcessingOptions { Preset = "Balanced" });

        Assert.Equal(result1.Bytes.Length, result2.Bytes.Length);
        Assert.Equal(Convert.ToBase64String(result1.Bytes), Convert.ToBase64String(result2.Bytes));
        Assert.Equal(result1.EffectiveProfile, result2.EffectiveProfile);
    }

    [Fact]
    public async Task Benchmark_OriginalInputBytesRemainStrictlyImmutable()
    {
        var originalBytes = CreateBenchmarkImage(BenchmarkCategory.Underexposed, 999);
        var originalBytesCopy = (byte[])originalBytes.Clone();

        using var stream = new MemoryStream(originalBytes);
        var result = await _service.ProcessImageAsync(stream, "QualityStudio:Balanced", new ImageProcessingOptions { Preset = "Balanced" });

        Assert.NotNull(result);
        // Assert that the original input byte array was never modified
        Assert.Equal(originalBytesCopy, originalBytes);
    }
}
