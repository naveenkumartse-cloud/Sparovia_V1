using Microsoft.Extensions.Logging.Abstractions;
using SkiaSharp;
using Sparovia.Application.Images;
using Sparovia.Infrastructure.Images;
using Xunit;

namespace Sparovia.UnitTests;

public class DeterministicImageProcessingTests
{
    private readonly DeterministicImageProcessingService _service;

    public DeterministicImageProcessingTests()
    {
        _service = new DeterministicImageProcessingService(NullLogger<DeterministicImageProcessingService>.Instance);
    }

    private static byte[] CreateTestImageBytes(int width, int height)
    {
        using var bitmap = new SKBitmap(width, height, SKColorType.Rgba8888, SKAlphaType.Premul);
        // Draw a test gradient pattern so sharpness/contrast can be calculated
        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                byte val = (byte)((x * 255 / Math.Max(1, width) + y * 255 / Math.Max(1, height)) / 2);
                bitmap.SetPixel(x, y, new SKColor(val, val, val));
            }
        }
        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);
        return data.ToArray();
    }

    [Fact]
    public async Task AnalyzeImageAsync_ReturnsExpectedAnalysisAndMetrics()
    {
        var testBytes = CreateTestImageBytes(800, 600);
        using var stream = new MemoryStream(testBytes);

        var result = await _service.AnalyzeImageAsync(stream, testBytes.Length, "image/png");

        Assert.NotNull(result);
        Assert.Equal(800, result.Width);
        Assert.Equal(600, result.Height);
        Assert.Equal(1.33, result.AspectRatio);
        Assert.Equal(testBytes.Length, result.FileSize);
        Assert.Equal("PNG", result.Format);
        Assert.False(result.IsLargeEnough); // width < 1200
        Assert.NotEmpty(result.RecommendedOperation);
        Assert.NotEmpty(result.RecommendationReason);
    }

    [Theory]
    [InlineData("ImproveClarity")]
    [InlineData("ImproveSharpness")]
    [InlineData("ReduceNoise")]
    [InlineData("ClassicLook")]
    [InlineData("ModernLook")]
    [InlineData("WebOptimize")]
    public async Task ProcessImageAsync_StandardOperations_ReturnValidProcessedResult(string operation)
    {
        var testBytes = CreateTestImageBytes(400, 300);
        using var stream = new MemoryStream(testBytes);

        var result = await _service.ProcessImageAsync(stream, operation);

        Assert.NotNull(result);
        Assert.NotEmpty(result.Bytes);
        Assert.True(result.FileSize > 0);
        Assert.True(result.Width > 0);
        Assert.True(result.Height > 0);
    }

    [Fact]
    public async Task ProcessImageAsync_Upscale_IncreasesResolution()
    {
        var testBytes = CreateTestImageBytes(200, 150);
        using var stream = new MemoryStream(testBytes);

        var result = await _service.ProcessImageAsync(stream, "Upscale");

        Assert.NotNull(result);
        Assert.Equal(400, result.Width);
        Assert.Equal(300, result.Height);
    }

    [Fact]
    public async Task ProcessImageAsync_WebOptimize_ConvertsToWebp()
    {
        var testBytes = CreateTestImageBytes(1400, 1000);
        using var stream = new MemoryStream(testBytes);

        var result = await _service.ProcessImageAsync(stream, "WebOptimize", new ImageProcessingOptions
        {
            MaxWidth = 1200,
            TargetFormat = "webp",
            Quality = 82
        });

        Assert.NotNull(result);
        Assert.Equal("image/webp", result.MimeType);
        Assert.Equal(".webp", result.FileExtension);
        Assert.Equal(1200, result.Width);
        Assert.True(result.Bytes.Length > 0);
    }

    [Theory]
    [InlineData("Balanced")]
    [InlineData("Light")]
    [InlineData("High")]
    public async Task ProcessImageAsync_QualityStudioPresets_ReturnValidProcessedResult(string preset)
    {
        var testBytes = CreateTestImageBytes(400, 300);
        using var stream = new MemoryStream(testBytes);

        var result = await _service.ProcessImageAsync(stream, $"QualityStudio:{preset}", new ImageProcessingOptions
        {
            Preset = preset
        });

        Assert.NotNull(result);
        Assert.NotEmpty(result.Bytes);
        Assert.True(result.FileSize > 0);
        Assert.Equal(400, result.Width);
        Assert.Equal(300, result.Height);
    }

    [Fact]
    public async Task ProcessImageAsync_QualityStudioDefaultPresetIsBalanced()
    {
        var testBytes = CreateTestImageBytes(400, 300);
        using var stream = new MemoryStream(testBytes);

        // No preset specified, should default to Balanced
        var result = await _service.ProcessImageAsync(stream, "QualityStudio", new ImageProcessingOptions());

        Assert.NotNull(result);
        Assert.NotEmpty(result.Bytes);
        Assert.True(result.FileSize > 0);
        Assert.Equal(400, result.Width);
        Assert.Equal(300, result.Height);
    }

    [Fact]
    public async Task ProcessImageAsync_QualityStudioCustomSliders_ClampsAndProcessesCorrectly()
    {
        var testBytes = CreateTestImageBytes(400, 300);
        using var stream = new MemoryStream(testBytes);

        // Pass out-of-bound slider values: Brightness = 120 (max 50), Contrast = -90 (min -50), Sharpness = 200 (max 100), NoiseReduction = -50 (min 0)
        var result = await _service.ProcessImageAsync(stream, "QualityStudio:Custom", new ImageProcessingOptions
        {
            Preset = "Custom",
            Brightness = 120,
            Contrast = -90,
            Sharpness = 200,
            NoiseReduction = -50,
            Saturation = 90
        });

        Assert.NotNull(result);
        Assert.NotEmpty(result.Bytes);
        Assert.True(result.FileSize > 0);
        Assert.Equal(400, result.Width);
        Assert.Equal(300, result.Height);
    }
}
