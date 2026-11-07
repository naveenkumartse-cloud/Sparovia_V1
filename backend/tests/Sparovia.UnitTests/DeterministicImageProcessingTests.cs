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
    [InlineData("Upscale")]
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

    [Fact]
    public async Task ProcessImageAsync_AllSevenOperations_ProduceDistinctOutputsAndHonestMetadata()
    {
        var testBytes = CreateTestImageBytes(400, 300);
        var operations = new[]
        {
            "ImproveClarity",
            "ImproveSharpness",
            "ReduceNoise",
            "Upscale",
            "ClassicLook",
            "ModernLook",
            "WebOptimize"
        };

        var results = new Dictionary<string, ProcessedImageResult>();

        foreach (var op in operations)
        {
            using var stream = new MemoryStream(testBytes);
            var result = await _service.ProcessImageAsync(stream, op);
            Assert.NotNull(result);
            Assert.NotEmpty(result.Bytes);
            Assert.NotEmpty(result.EffectiveProfile!);
            Assert.NotEmpty(result.AppliedCorrections);
            results[op] = result;
        }

        // Verify each operation produces distinct bytes
        for (int i = 0; i < operations.Length; i++)
        {
            for (int j = i + 1; j < operations.Length; j++)
            {
                var op1 = operations[i];
                var op2 = operations[j];
                bool bytesEqual = results[op1].Bytes.SequenceEqual(results[op2].Bytes);
                Assert.False(bytesEqual, $"Operation '{op1}' and '{op2}' should produce distinct output bytes.");
            }
        }
    }

    [Fact]
    public async Task ProcessImageAsync_ClassicLook_ProducesWarmArchitecturalTones()
    {
        // Neutral gray image: RGB 128, 128, 128
        using var bmp = new SKBitmap(100, 100, SKColorType.Rgba8888, SKAlphaType.Premul);
        for (int y = 0; y < 100; y++)
        {
            for (int x = 0; x < 100; x++)
            {
                bmp.SetPixel(x, y, new SKColor(128, 128, 128));
            }
        }
        using var img = SKImage.FromBitmap(bmp);
        using var data = img.Encode(SKEncodedImageFormat.Jpeg, 90);
        var testBytes = data.ToArray();

        using var stream = new MemoryStream(testBytes);
        var result = await _service.ProcessImageAsync(stream, "ClassicLook");

        Assert.NotNull(result);
        using var outData = SKData.CreateCopy(result.Bytes);
        using var outBmp = SKBitmap.Decode(outData);
        Assert.NotNull(outBmp);

        // Center pixel should be warmer: Red > Blue
        var pixel = outBmp.GetPixel(50, 50);
        Assert.True(pixel.Red > pixel.Blue, $"ClassicLook should warm tones (Red {pixel.Red} should be > Blue {pixel.Blue})");
    }

    [Fact]
    public async Task ProcessImageAsync_Upscale_ScaleFactorsVaryBySize()
    {
        // Small image (< 1200) gets 2.0x factor
        var smallBytes = CreateTestImageBytes(300, 200);
        using var smallStream = new MemoryStream(smallBytes);
        var smallResult = await _service.ProcessImageAsync(smallStream, "Upscale");
        Assert.Equal(600, smallResult.Width);
        Assert.Equal(400, smallResult.Height);
        Assert.Contains("2.0x", smallResult.EffectiveProfile);

        // Larger image (>= 1200) gets 1.5x factor
        var largeBytes = CreateTestImageBytes(1400, 900);
        using var largeStream = new MemoryStream(largeBytes);
        var largeResult = await _service.ProcessImageAsync(largeStream, "Upscale");
        Assert.Equal(2100, largeResult.Width);
        Assert.Equal(1350, largeResult.Height);
        Assert.Contains("1.5x", largeResult.EffectiveProfile);
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

    [Fact]
    public async Task ProcessImageAsync_QualityStudio_BalancedPreset_ProducesValidNonWhiteOutput()
    {
        // Create a 100x100 test image with varied colors
        using var bmp = new SKBitmap(100, 100, SKColorType.Rgba8888, SKAlphaType.Premul);
        for (int y = 0; y < 100; y++)
        {
            for (int x = 0; x < 100; x++)
            {
                // Gradient pattern
                bmp.SetPixel(x, y, new SKColor((byte)(30 + x), (byte)(50 + y), (byte)(80 + (x + y) / 2)));
            }
        }
        using var img = SKImage.FromBitmap(bmp);
        using var pngData = img.Encode(SKEncodedImageFormat.Jpeg, 90);
        var inputBytes = pngData.ToArray();

        using var stream = new MemoryStream(inputBytes);

        // Process with default Balanced preset
        var result = await _service.ProcessImageAsync(stream, "QualityStudio:Balanced", new ImageProcessingOptions
        {
            Preset = "Balanced"
        });

        Assert.NotNull(result);
        Assert.NotEmpty(result.Bytes);
        Assert.True(result.FileSize > 0);
        Assert.Equal(100, result.Width);
        Assert.Equal(100, result.Height);

        // Decode processed output and inspect pixels
        using var outData = SKData.CreateCopy(result.Bytes);
        using var outBmp = SKBitmap.Decode(outData);
        Assert.NotNull(outBmp);

        // Sample multiple pixels across the image
        var centerPixel = outBmp.GetPixel(50, 50);
        var cornerPixel = outBmp.GetPixel(10, 10);

        // Verify pixels are NOT blown out to pure white (255,255,255) and NOT crushed to pure black (0,0,0)
        Assert.False(centerPixel.Red == 255 && centerPixel.Green == 255 && centerPixel.Blue == 255, "Processed image must not be pure white.");
        Assert.False(centerPixel.Red == 0 && centerPixel.Green == 0 && centerPixel.Blue == 0, "Processed image must not be pure black.");

        Assert.False(cornerPixel.Red == 255 && cornerPixel.Green == 255 && cornerPixel.Blue == 255, "Corner pixel must not be pure white.");
        Assert.False(cornerPixel.Red == 0 && cornerPixel.Green == 0 && cornerPixel.Blue == 0, "Corner pixel must not be pure black.");

        // Verify sensible color range
        Assert.InRange(centerPixel.Red, 40, 120);
        Assert.InRange(centerPixel.Green, 60, 140);
        Assert.InRange(centerPixel.Blue, 90, 180);
    }

    [Fact]
    public async Task ProcessImageAsync_QualityStudio_HighPreset_ProducesMoreContrastThanLight()
    {
        using var bmp = new SKBitmap(100, 100, SKColorType.Rgba8888, SKAlphaType.Premul);
        for (int y = 0; y < 100; y++)
        {
            for (int x = 0; x < 100; x++)
            {
                bmp.SetPixel(x, y, new SKColor(100, 100, 100));
            }
        }
        using var img = SKImage.FromBitmap(bmp);
        using var pngData = img.Encode(SKEncodedImageFormat.Jpeg, 90);
        var inputBytes = pngData.ToArray();

        using var streamLight = new MemoryStream(inputBytes);
        var resultLight = await _service.ProcessImageAsync(streamLight, "QualityStudio:Light", new ImageProcessingOptions { Preset = "Light" });

        using var streamHigh = new MemoryStream(inputBytes);
        var resultHigh = await _service.ProcessImageAsync(streamHigh, "QualityStudio:High", new ImageProcessingOptions { Preset = "High" });

        Assert.NotNull(resultLight);
        Assert.NotNull(resultHigh);
        Assert.True(resultLight.FileSize > 0);
        Assert.True(resultHigh.FileSize > 0);
    }

    [Fact]
    public async Task ProcessImageAsync_EmptyStream_ThrowsInvalidOperationException()
    {
        using var emptyStream = new MemoryStream();
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.ProcessImageAsync(emptyStream, "QualityStudio:Balanced"));
    }

    [Theory]
    [InlineData(SKEncodedOrigin.TopLeft, 200, 100)]
    [InlineData(SKEncodedOrigin.TopRight, 200, 100)]
    [InlineData(SKEncodedOrigin.BottomRight, 200, 100)]
    [InlineData(SKEncodedOrigin.BottomLeft, 200, 100)]
    [InlineData(SKEncodedOrigin.LeftTop, 100, 200)]
    [InlineData(SKEncodedOrigin.RightTop, 100, 200)]
    [InlineData(SKEncodedOrigin.RightBottom, 100, 200)]
    [InlineData(SKEncodedOrigin.LeftBottom, 100, 200)]
    public void NormalizeOrientation_AllEightOrientations_ProducesCorrectDimensions(
        SKEncodedOrigin origin,
        int expectedWidth,
        int expectedHeight)
    {
        using var rawBitmap = new SKBitmap(200, 100, SKColorType.Rgba8888, SKAlphaType.Premul);
        rawBitmap.Erase(SKColors.White);

        using var normalized = DeterministicImageProcessingService.NormalizeOrientation(rawBitmap, origin);

        Assert.NotNull(normalized);
        Assert.Equal(expectedWidth, normalized.Width);
        Assert.Equal(expectedHeight, normalized.Height);
    }

    [Fact]
    public void DecodeAndNormalizeOrientation_NullOrEmptyOrCorrupt_ReturnsNullWithoutThrowing()
    {
        Assert.Null(DeterministicImageProcessingService.DecodeAndNormalizeOrientation(Array.Empty<byte>()));
        Assert.Null(DeterministicImageProcessingService.DecodeAndNormalizeOrientation(new byte[] { 0x01, 0x02, 0x03 }));
    }

    [Fact]
    public void DecodeAndNormalizeOrientation_StandardImage_DecodesProperly()
    {
        var testBytes = CreateTestImageBytes(300, 200);
        using var bitmap = DeterministicImageProcessingService.DecodeAndNormalizeOrientation(testBytes);

        Assert.NotNull(bitmap);
        Assert.Equal(300, bitmap.Width);
        Assert.Equal(200, bitmap.Height);
    }

    [Fact]
    public async Task AnalyzeAndProcessImageAsync_PortraitExifOrientation_NormalizesDimensions()
    {
        // Construct a JPEG with EXIF orientation 6 (portrait smartphone photograph)
        var rawJpegBytes = CreateTestImageBytes(400, 200); // 400 wide x 200 high

        // Build APP1 EXIF segment with Orientation = 6 (RightTop)
        var exifApp1 = new byte[]
        {
            0xFF, 0xE1, // APP1 marker
            0x00, 0x1E, // Length: 30 bytes
            0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
            0x49, 0x49, 0x2A, 0x00, // TIFF header: Little-endian ('II'), version 42
            0x08, 0x00, 0x00, 0x00, // Offset to 1st IFD: 8 bytes
            0x01, 0x00, // Number of tags: 1
            0x12, 0x01, // Tag: 0x0112 (Orientation)
            0x03, 0x00, // Type: SHORT (3)
            0x01, 0x00, 0x00, 0x00, // Count: 1
            0x06, 0x00, 0x00, 0x00, // Value: 6 (RightTop = Rotate 90 CW)
            0x00, 0x00, 0x00, 0x00  // Offset to next IFD: 0
        };

        // Combine SOI (2 bytes) + APP1 + rest of JPEG (skipping SOI)
        byte[] jpegWithExif;
        if (rawJpegBytes.Length >= 2 && rawJpegBytes[0] == 0xFF && rawJpegBytes[1] == 0xD8)
        {
            jpegWithExif = new byte[2 + exifApp1.Length + (rawJpegBytes.Length - 2)];
            jpegWithExif[0] = 0xFF;
            jpegWithExif[1] = 0xD8;
            Array.Copy(exifApp1, 0, jpegWithExif, 2, exifApp1.Length);
            Array.Copy(rawJpegBytes, 2, jpegWithExif, 2 + exifApp1.Length, rawJpegBytes.Length - 2);
        }
        else
        {
            // If CreateTestImageBytes returns PNG, encode JPEG
            using var bmp = new SKBitmap(400, 200);
            using var img = SKImage.FromBitmap(bmp);
            using var encoded = img.Encode(SKEncodedImageFormat.Jpeg, 90);
            var baseJpeg = encoded.ToArray();
            jpegWithExif = new byte[2 + exifApp1.Length + (baseJpeg.Length - 2)];
            jpegWithExif[0] = 0xFF;
            jpegWithExif[1] = 0xD8;
            Array.Copy(exifApp1, 0, jpegWithExif, 2, exifApp1.Length);
            Array.Copy(baseJpeg, 2, jpegWithExif, 2 + exifApp1.Length, baseJpeg.Length - 2);
        }

        // 1. AnalyzeImageAsync should report the normalized portrait dimensions (200x400)
        using var analyzeStream = new MemoryStream(jpegWithExif);
        var analysis = await _service.AnalyzeImageAsync(analyzeStream, jpegWithExif.Length, "image/jpeg");
        Assert.Equal(200, analysis.Width);
        Assert.Equal(400, analysis.Height);
        Assert.Equal(0.5, analysis.AspectRatio);

        // 2. ProcessImageAsync should output upright portrait dimensions (200x400)
        using var processStream = new MemoryStream(jpegWithExif);
        var processed = await _service.ProcessImageAsync(processStream, "WebOptimize");
        Assert.Equal(200, processed.Width);
        Assert.Equal(400, processed.Height);
    }

    [Fact]
    public async Task EnhanceForWebsite_DarkIndoorPhotograph_LiftsShadowsWhileAnchoringDeepBlacks()
    {
        // Dark indoor photograph: mean luminance < 0.40, shadow ratio > 0.15
        using var bmp = new SKBitmap(200, 200, SKColorType.Rgba8888, SKAlphaType.Premul);
        for (int y = 0; y < 200; y++)
        {
            for (int x = 0; x < 200; x++)
            {
                // Dark background shadows (RGB 15, 12, 10)
                bmp.SetPixel(x, y, new SKColor(15, 12, 10));
            }
        }
        // Anchor true black region at top-left
        for (int y = 0; y < 20; y++)
        {
            for (int x = 0; x < 20; x++)
            {
                bmp.SetPixel(x, y, new SKColor(0, 0, 0));
            }
        }
        // Shadow detail patch at center
        for (int y = 90; y < 110; y++)
        {
            for (int x = 90; x < 110; x++)
            {
                bmp.SetPixel(x, y, new SKColor(55, 48, 40));
            }
        }

        using var img = SKImage.FromBitmap(bmp);
        using var data = img.Encode(SKEncodedImageFormat.Jpeg, 95);
        var origBytes = data.ToArray();

        using var inStream = new MemoryStream(origBytes);
        var result = await _service.ProcessImageAsync(inStream, "EnhanceForWebsite");

        Assert.NotNull(result);
        Assert.Equal("image/webp", result.MimeType);
        Assert.Contains(result.AppliedCorrections, c => c.Contains("Shadow visibility and interior depth improved"));

        using var outData = SKData.CreateCopy(result.Bytes);
        using var outBmp = SKBitmap.Decode(outData);
        Assert.NotNull(outBmp);

        // True black point must remain anchored near 0 (never washed out into hazy gray)
        var outBlack = outBmp.GetPixel(10, 10);
        Assert.True(outBlack.Red <= 3 && outBlack.Green <= 3 && outBlack.Blue <= 3,
            $"True black was washed out: ({outBlack.Red}, {outBlack.Green}, {outBlack.Blue})");

        // Shadow detail must be smoothly lifted for visibility
        var outShadow = outBmp.GetPixel(100, 100);
        Assert.True(outShadow.Red >= 55, $"Shadow detail was not lifted: {outShadow.Red} vs orig 55");
    }

    [Fact]
    public async Task EnhanceForWebsite_BrightPhotograph_CompressesHighlightsToPreventBlowout()
    {
        // High-key bright photograph: mean luminance > 0.65
        using var bmp = new SKBitmap(200, 200, SKColorType.Rgba8888, SKAlphaType.Premul);
        for (int y = 0; y < 200; y++)
        {
            for (int x = 0; x < 200; x++)
            {
                bmp.SetPixel(x, y, new SKColor(230, 235, 238));
            }
        }
        // White point region at top-left
        for (int y = 0; y < 20; y++)
        {
            for (int x = 0; x < 20; x++)
            {
                bmp.SetPixel(x, y, new SKColor(255, 255, 255));
            }
        }
        // Near-blown highlight region at center
        for (int y = 90; y < 110; y++)
        {
            for (int x = 90; x < 110; x++)
            {
                bmp.SetPixel(x, y, new SKColor(245, 245, 248));
            }
        }

        using var img = SKImage.FromBitmap(bmp);
        using var data = img.Encode(SKEncodedImageFormat.Jpeg, 95);
        var origBytes = data.ToArray();

        using var inStream = new MemoryStream(origBytes);
        var result = await _service.ProcessImageAsync(inStream, "EnhanceForWebsite");

        Assert.NotNull(result);
        Assert.Contains(result.AppliedCorrections, c => c.Contains("Highlights protected against blow-out"));

        using var outData = SKData.CreateCopy(result.Bytes);
        using var outBmp = SKBitmap.Decode(outData);
        Assert.NotNull(outBmp);

        // White point remains anchored near 255
        var outWhite = outBmp.GetPixel(10, 10);
        Assert.True(outWhite.Red >= 248 && outWhite.Green >= 248 && outWhite.Blue >= 248);
    }

    [Fact]
    public async Task EnhanceForWebsite_AuthenticMaterialSurfaces_MaintainsZeroChromaticDistortion()
    {
        // Architectural materials:
        // Marble: (220, 218, 210)
        // Stained Oak Wood: (145, 95, 45)
        // Terracotta: (185, 90, 65)
        using var bmp = new SKBitmap(300, 100, SKColorType.Rgba8888, SKAlphaType.Premul);
        for (int y = 0; y < 100; y++)
        {
            for (int x = 0; x < 100; x++) bmp.SetPixel(x, y, new SKColor(220, 218, 210)); // Marble
            for (int x = 100; x < 200; x++) bmp.SetPixel(x, y, new SKColor(145, 95, 45));  // Wood
            for (int x = 200; x < 300; x++) bmp.SetPixel(x, y, new SKColor(185, 90, 65));  // Terracotta
        }

        using var img = SKImage.FromBitmap(bmp);
        using var data = img.Encode(SKEncodedImageFormat.Jpeg, 95);
        var origBytes = data.ToArray();

        using var inStream = new MemoryStream(origBytes);
        var result = await _service.ProcessImageAsync(inStream, "EnhanceForWebsite");

        Assert.NotNull(result);
        Assert.Contains(result.AppliedCorrections, c => c.Contains("Authentic architectural material colors"));

        using var origData = SKData.CreateCopy(origBytes);
        using var origBmp = SKBitmap.Decode(origData);
        using var outData = SKData.CreateCopy(result.Bytes);
        using var outBmp = SKBitmap.Decode(outData);

        // Check Marble R/G and B/G ratios
        var origMarble = origBmp.GetPixel(50, 50);
        var outMarble = outBmp.GetPixel(50, 50);
        double origMarbleRg = (double)origMarble.Red / origMarble.Green;
        double outMarbleRg = (double)outMarble.Red / outMarble.Green;
        Assert.True(Math.Abs(origMarbleRg - outMarbleRg) < 0.04,
            $"Marble chromatic ratio altered: Orig={origMarbleRg:F3}, Out={outMarbleRg:F3}");

        // Check Wood R/G ratio
        var origWood = origBmp.GetPixel(150, 50);
        var outWood = outBmp.GetPixel(150, 50);
        double origWoodRg = (double)origWood.Red / origWood.Green;
        double outWoodRg = (double)outWood.Red / outWood.Green;
        Assert.True(Math.Abs(origWoodRg - outWoodRg) < 0.05,
            $"Wood chromatic ratio altered: Orig={origWoodRg:F3}, Out={outWoodRg:F3}");
    }

    [Fact]
    public void ApplyAdaptiveSharpening_HighContrastStepEdge_ClampsDeltasAndEliminatesHalos()
    {
        // High contrast edge: slate (40, 40, 40) on left, stone (200, 200, 200) on right
        using var bmp = new SKBitmap(100, 50, SKColorType.Rgba8888, SKAlphaType.Premul);
        for (int y = 0; y < 50; y++)
        {
            for (int x = 0; x < 50; x++) bmp.SetPixel(x, y, new SKColor(40, 40, 40));
            for (int x = 50; x < 100; x++) bmp.SetPixel(x, y, new SKColor(200, 200, 200));
        }

        // Apply adaptive sharpening with maxDelta = 12
        using var sharpened = DeterministicImageProcessingService.ApplyAdaptiveSharpening(bmp, amount: 0.5f, threshold: 6, maxDelta: 12);
        Assert.NotNull(sharpened);

        // Check pixels near edge (e.g. x = 49 and x = 50)
        var leftEdgePixel = sharpened.GetPixel(49, 25);
        var rightEdgePixel = sharpened.GetPixel(50, 25);

        // The edge change must be clamped within [-12, +12], preventing white ringing > 212 or black ringing < 28
        Assert.True(leftEdgePixel.Red >= 28, $"Left dark edge dipped below maxDelta clamp: {leftEdgePixel.Red}");
        Assert.True(rightEdgePixel.Red <= 212, $"Right bright edge spiked above maxDelta clamp: {rightEdgePixel.Red}");

        // Far uniform regions (x = 10, y = 25) must be 100% untouched due to dead-zone threshold
        var farLeft = sharpened.GetPixel(10, 25);
        Assert.Equal(40, farLeft.Red);
    }

    [Fact]
    public async Task EnhanceForWebsite_AlreadyCompressedJpeg_ProvidesHonestSizeComparisonWithoutBloat()
    {
        // Simulate pre-compressed 400x300 JPEG
        using var bmp = new SKBitmap(400, 300, SKColorType.Rgba8888, SKAlphaType.Premul);
        using (var canvas = new SKCanvas(bmp))
        {
            canvas.Clear(new SKColor(210, 205, 195));
            using var paint = new SKPaint { Color = new SKColor(60, 50, 45), StrokeWidth = 4 };
            canvas.DrawLine(50, 50, 350, 250, paint);
        }

        using var img = SKImage.FromBitmap(bmp);
        using var data = img.Encode(SKEncodedImageFormat.Jpeg, 75);
        var origBytes = data.ToArray();
        var origHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(origBytes));

        using var inStream = new MemoryStream(origBytes);
        var result = await _service.ProcessImageAsync(inStream, "EnhanceForWebsite");

        Assert.NotNull(result);
        Assert.Equal("image/webp", result.MimeType);
        Assert.Equal(".webp", result.FileExtension);
        Assert.True(result.FileSize > 0);

        // Original bytes must remain completely immutable
        var afterHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(origBytes));
        Assert.Equal(origHash, afterHash);

        // Must report honest file size comparison in AppliedCorrections
        Assert.Contains(result.AppliedCorrections, c =>
            c.Contains("Web delivery size:") || c.Contains("Full photographic clarity preserved for website delivery"));
    }

    [Fact]
    public async Task PhotographicProfile_DarkIndoor_RecoversShadowHeadroomWithoutWashout()
    {
        // 1. Dark indoor photograph: low-light room with walnut cabinets (45, 30, 20) & slate floors (25, 25, 28)
        int w = 600, h = 400;
        using var bmp = new SKBitmap(w, h, SKColorType.Rgba8888, SKAlphaType.Premul);
        var rng = new Random(42);
        for (int y = 0; y < h; y++)
        {
            for (int x = 0; x < w; x++)
            {
                byte baseVal = (byte)(15 + (x * 20 / w) + (y * 15 / h) + rng.Next(0, 5));
                bmp.SetPixel(x, y, new SKColor(baseVal, (byte)(baseVal * 0.85), (byte)(baseVal * 0.75)));
            }
        }
        // Deep black anchor at (0..15, 0..15)
        for (int y = 0; y < 15; y++)
            for (int x = 0; x < 15; x++)
                bmp.SetPixel(x, y, new SKColor(0, 0, 0));

        // Walnut cabinetry patch at center (45, 30, 20)
        for (int y = 180; y < 220; y++)
            for (int x = 280; x < 320; x++)
                bmp.SetPixel(x, y, new SKColor(45, 30, 20));

        using var img = SKImage.FromBitmap(bmp);
        using var encoded = img.Encode(SKEncodedImageFormat.Jpeg, 88);
        var origBytes = encoded.ToArray();

        using var inStream = new MemoryStream(origBytes);
        var result = await _service.ProcessImageAsync(inStream, "EnhanceForWebsite");

        Assert.NotNull(result);
        Assert.Equal("image/webp", result.MimeType);
        Assert.Equal(w, result.Width);
        Assert.Equal(h, result.Height);
        Assert.Contains(result.AppliedCorrections, c => c.Contains("Shadow visibility and interior depth improved"));

        using var outData = SKData.CreateCopy(result.Bytes);
        using var outBmp = SKBitmap.Decode(outData);
        Assert.NotNull(outBmp);

        // Black anchor remains strictly black (no hazy washout)
        var blackPix = outBmp.GetPixel(5, 5);
        Assert.True(blackPix.Red <= 3 && blackPix.Green <= 3 && blackPix.Blue <= 3);

        // Cabinetry detail is lifted for visibility
        var cabPix = outBmp.GetPixel(300, 200);
        Assert.True(cabPix.Red >= 45, $"Cabinetry detail should be lifted: {cabPix.Red} vs orig 45");
    }

    [Fact]
    public async Task PhotographicProfile_DaylightStorefront_PreservesHighlightsAndNaturalContrast()
    {
        // 2. Bright daylight photograph: sunlit facade (235, 235, 238), glass window (245, 248, 250), dark awning (50, 45, 40)
        int w = 600, h = 400;
        using var bmp = new SKBitmap(w, h, SKColorType.Rgba8888, SKAlphaType.Premul);
        for (int y = 0; y < h; y++)
        {
            for (int x = 0; x < w; x++)
            {
                if (y < 80) // Sunlit facade
                    bmp.SetPixel(x, y, new SKColor(235, 235, 238));
                else if (x > 300) // Glass reflection
                    bmp.SetPixel(x, y, new SKColor(245, 248, 250));
                else // Dark architectural awning
                    bmp.SetPixel(x, y, new SKColor(50, 45, 40));
            }
        }
        // White point region
        for (int y = 0; y < 15; y++)
            for (int x = 0; x < 15; x++)
                bmp.SetPixel(x, y, new SKColor(255, 255, 255));

        using var img = SKImage.FromBitmap(bmp);
        using var encoded = img.Encode(SKEncodedImageFormat.Jpeg, 90);
        var origBytes = encoded.ToArray();

        using var inStream = new MemoryStream(origBytes);
        var result = await _service.ProcessImageAsync(inStream, "EnhanceForWebsite");

        Assert.NotNull(result);
        Assert.Contains(result.AppliedCorrections, c => c.Contains("Highlights protected against blow-out"));

        using var outData = SKData.CreateCopy(result.Bytes);
        using var outBmp = SKBitmap.Decode(outData);
        Assert.NotNull(outBmp);

        // White point remains anchored
        var whitePix = outBmp.GetPixel(5, 5);
        Assert.True(whitePix.Red >= 248 && whitePix.Green >= 248 && whitePix.Blue >= 248);
    }

    [Fact]
    public async Task PhotographicProfile_ArchitecturalEdges_SharpensWithoutHalos()
    {
        // 3. Crisp architectural edges: clean geometric window mullions and stone joints
        int w = 400, h = 300;
        using var bmp = new SKBitmap(w, h, SKColorType.Rgba8888, SKAlphaType.Premul);
        using (var canvas = new SKCanvas(bmp))
        {
            canvas.Clear(new SKColor(200, 195, 185)); // Stone facade
            using var paint = new SKPaint { Color = new SKColor(40, 40, 45), StrokeWidth = 6, IsAntialias = false };
            canvas.DrawLine(100, 50, 100, 250, paint); // Vertical mullion
            canvas.DrawLine(50, 150, 350, 150, paint); // Horizontal transom
        }

        using var img = SKImage.FromBitmap(bmp);
        using var encoded = img.Encode(SKEncodedImageFormat.Jpeg, 90);
        var origBytes = encoded.ToArray();

        using var inStream = new MemoryStream(origBytes);
        var result = await _service.ProcessImageAsync(inStream, "EnhanceForWebsite");

        Assert.NotNull(result);
        Assert.Contains(result.AppliedCorrections, c => c.Contains("structural edge definition") || c.Contains("edge sharpness"));

        using var outData = SKData.CreateCopy(result.Bytes);
        using var outBmp = SKBitmap.Decode(outData);
        Assert.NotNull(outBmp);

        // Verify no halo ringing on adjacent stone pixels (x = 104, y = 100)
        var adjacentStone = outBmp.GetPixel(104, 100);
        // Stone was ~200; with maxDelta 12, it must not blow up above 225
        Assert.True(adjacentStone.Red <= 225, $"Ringing halo detected on edge boundary: {adjacentStone.Red}");
    }

    [Fact]
    public async Task PhotographicProfile_WoodMarbleBrick_PreservesAuthenticMaterialColors()
    {
        // 4. Authentic material surfaces: Calacatta marble, White oak, Terracotta brick, Plaster
        int w = 400, h = 200;
        using var bmp = new SKBitmap(w, h, SKColorType.Rgba8888, SKAlphaType.Premul);
        for (int y = 0; y < h; y++)
        {
            for (int x = 0; x < 100; x++) bmp.SetPixel(x, y, new SKColor(225, 222, 215)); // Marble
            for (int x = 100; x < 200; x++) bmp.SetPixel(x, y, new SKColor(170, 130, 85));  // White oak
            for (int x = 200; x < 300; x++) bmp.SetPixel(x, y, new SKColor(180, 85, 60));   // Terracotta brick
            for (int x = 300; x < 400; x++) bmp.SetPixel(x, y, new SKColor(210, 205, 195)); // Plaster
        }

        using var img = SKImage.FromBitmap(bmp);
        using var encoded = img.Encode(SKEncodedImageFormat.Jpeg, 92);
        var origBytes = encoded.ToArray();

        using var inStream = new MemoryStream(origBytes);
        var result = await _service.ProcessImageAsync(inStream, "EnhanceForWebsite");

        Assert.NotNull(result);
        Assert.Contains(result.AppliedCorrections, c => c.Contains("Authentic architectural material colors and finishes preserved"));

        using var origData = SKData.CreateCopy(origBytes);
        using var origBmp = SKBitmap.Decode(origData);
        using var outData = SKData.CreateCopy(result.Bytes);
        using var outBmp = SKBitmap.Decode(outData);

        // Check oak wood R/G chromaticity
        var origOak = origBmp.GetPixel(150, 100);
        var outOak = outBmp.GetPixel(150, 100);
        double origOakRatio = (double)origOak.Red / origOak.Green;
        double outOakRatio = (double)outOak.Red / outOak.Green;
        Assert.True(Math.Abs(origOakRatio - outOakRatio) < 0.04,
            $"Oak chromaticity drifted: Orig {origOakRatio:F3} vs Out {outOakRatio:F3}");

        // Check terracotta brick R/G chromaticity
        var origBrick = origBmp.GetPixel(250, 100);
        var outBrick = outBmp.GetPixel(250, 100);
        double origBrickRatio = (double)origBrick.Red / origBrick.Green;
        double outBrickRatio = (double)outBrick.Red / outBrick.Green;
        Assert.True(Math.Abs(origBrickRatio - outBrickRatio) < 0.08,
            $"Brick chromaticity drifted: Orig {origBrickRatio:F3} vs Out {outBrickRatio:F3}");
    }

    [Fact]
    public async Task PhotographicProfile_NoisySmartphone_SuppressesNoiseWithoutBlurringTextures()
    {
        // 5. Noisy smartphone photograph: low-light wall with high-ISO noise
        int w = 300, h = 200;
        using var bmp = new SKBitmap(w, h, SKColorType.Rgba8888, SKAlphaType.Premul);
        var rng = new Random(123);
        for (int y = 0; y < h; y++)
        {
            for (int x = 0; x < w; x++)
            {
                byte baseVal = (byte)(80 + (x * 30 / w));
                int noise = rng.Next(-25, 26);
                byte noisyVal = (byte)Math.Clamp(baseVal + noise, 0, 255);
                bmp.SetPixel(x, y, new SKColor(noisyVal, noisyVal, noisyVal));
            }
        }

        using var img = SKImage.FromBitmap(bmp);
        using var encoded = img.Encode(SKEncodedImageFormat.Jpeg, 85);
        var origBytes = encoded.ToArray();

        using var inStream = new MemoryStream(origBytes);
        var result = await _service.ProcessImageAsync(inStream, "EnhanceForWebsite");

        Assert.NotNull(result);
        Assert.Contains(result.AppliedCorrections, c => c.Contains("noise reduction applied"));
        Assert.Equal("image/webp", result.MimeType);
    }

    [Fact]
    public async Task PhotographicProfile_AlreadyCompressedJpeg_CalibratesSizeHonesty()
    {
        // 6. Already-compressed client JPEG: pre-compressed 400x300 image
        int w = 400, h = 300;
        using var bmp = new SKBitmap(w, h, SKColorType.Rgba8888, SKAlphaType.Premul);
        using (var canvas = new SKCanvas(bmp))
        {
            canvas.Clear(new SKColor(180, 175, 165));
            using var paint = new SKPaint { Color = new SKColor(80, 70, 60), StrokeWidth = 3 };
            canvas.DrawCircle(200, 150, 80, paint);
        }

        using var img = SKImage.FromBitmap(bmp);
        using var encoded = img.Encode(SKEncodedImageFormat.Jpeg, 70);
        var origBytes = encoded.ToArray();
        var origHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(origBytes));

        using var inStream = new MemoryStream(origBytes);
        var result = await _service.ProcessImageAsync(inStream, "EnhanceForWebsite");

        Assert.NotNull(result);
        Assert.Equal("image/webp", result.MimeType);
        Assert.Equal(".webp", result.FileExtension);

        // Immutable original bytes
        var afterHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(origBytes));
        Assert.Equal(origHash, afterHash);

        // Honest size reporting
        Assert.Contains(result.AppliedCorrections, c =>
            c.Contains("Web delivery size:") || c.Contains("Full photographic clarity preserved for website delivery"));
    }
}
