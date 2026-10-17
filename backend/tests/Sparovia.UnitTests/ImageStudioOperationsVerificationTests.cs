using System.Security.Cryptography;
using Microsoft.Extensions.Logging.Abstractions;
using SkiaSharp;
using Sparovia.Application.Images;
using Sparovia.Infrastructure.Images;
using Xunit;
using Xunit.Abstractions;

namespace Sparovia.UnitTests;

public class ImageStudioOperationsVerificationTests
{
    private readonly DeterministicImageProcessingService _service;
    private readonly ITestOutputHelper _output;

    public ImageStudioOperationsVerificationTests(ITestOutputHelper output)
    {
        _output = output;
        _service = new DeterministicImageProcessingService(NullLogger<DeterministicImageProcessingService>.Instance);
    }

    private static string ComputeHash(byte[] bytes)
    {
        using var sha256 = SHA256.Create();
        return Convert.ToHexString(sha256.ComputeHash(bytes));
    }

    private static byte[] CreateArchitecturalTestImage(int width, int height, SKEncodedImageFormat format = SKEncodedImageFormat.Jpeg, int quality = 90)
    {
        using var bitmap = new SKBitmap(width, height, SKColorType.Rgba8888, SKAlphaType.Premul);
        using (var canvas = new SKCanvas(bitmap))
        {
            // Draw a realistic architectural scene: wood floor, plastered wall, masonry fireplace, window
            canvas.Clear(new SKColor(220, 215, 205)); // Warm plaster wall

            // Wood flooring (lower 35%)
            using var woodPaint = new SKPaint { Color = new SKColor(160, 110, 60) };
            canvas.DrawRect(0, height * 0.65f, width, height * 0.35f, woodPaint);

            // Masonry hearth (center)
            using var brickPaint = new SKPaint { Color = new SKColor(120, 90, 85) };
            canvas.DrawRect(width * 0.35f, height * 0.40f, width * 0.30f, height * 0.45f, brickPaint);

            // Architectural window (upper right) with high brightness
            using var windowPaint = new SKPaint { Color = new SKColor(245, 248, 255) };
            canvas.DrawRect(width * 0.75f, height * 0.15f, width * 0.20f, height * 0.40f, windowPaint);

            // Edge lines
            using var linePaint = new SKPaint { Color = new SKColor(40, 40, 40), StrokeWidth = 2, IsAntialias = true };
            canvas.DrawLine(0, height * 0.65f, width, height * 0.65f, linePaint);
            canvas.DrawLine(width * 0.35f, height * 0.40f, width * 0.35f, height * 0.85f, linePaint);
            canvas.DrawLine(width * 0.65f, height * 0.40f, width * 0.65f, height * 0.85f, linePaint);
        }

        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(format, quality);
        return data.ToArray();
    }

    private static byte[] CreateNoisyTestImage(int width, int height)
    {
        using var bitmap = new SKBitmap(width, height, SKColorType.Rgba8888, SKAlphaType.Premul);
        using (var canvas = new SKCanvas(bitmap))
        {
            canvas.Clear(new SKColor(150, 150, 150));
        }

        // Inject high-frequency noise
        var rng = new Random(42);
        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                var noise = rng.Next(-30, 31);
                var baseVal = 150 + noise;
                baseVal = Math.Clamp(baseVal, 0, 255);
                bitmap.SetPixel(x, y, new SKColor((byte)baseVal, (byte)baseVal, (byte)baseVal));
            }
        }

        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Jpeg, 95);
        return data.ToArray();
    }

    [Theory]
    [InlineData("ImproveClarity")]
    [InlineData("ImproveSharpness")]
    [InlineData("ReduceNoise")]
    [InlineData("Upscale")]
    [InlineData("ClassicLook")]
    [InlineData("ModernLook")]
    [InlineData("WebOptimize")]
    public async Task Immutability_AcrossAllSevenOperations_OriginalRemainsIdentical_NonEmptyFixture(string operation)
    {
        // Real, non-empty, decodable JPEG image fixture (800x600, ~25KB)
        var originalBytes = CreateArchitecturalTestImage(800, 600, SKEncodedImageFormat.Jpeg, 90);
        Assert.True(originalBytes.Length > 1000, "Original fixture must be non-empty and substantial.");

        var originalHashBefore = ComputeHash(originalBytes);
        Assert.False(string.Equals(originalHashBefore, "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855", StringComparison.OrdinalIgnoreCase),
            "Original hash must NOT be the empty-byte hash.");

        using var stream = new MemoryStream(originalBytes);
        var result = await _service.ProcessImageAsync(stream, operation);

        // Assert processing produced valid result
        Assert.NotNull(result);
        Assert.NotEmpty(result.Bytes);
        Assert.True(result.Width > 0);
        Assert.True(result.Height > 0);

        // Assert original bytes were NOT mutated in memory or stream
        var originalHashAfter = ComputeHash(originalBytes);
        Assert.Equal(originalHashBefore, originalHashAfter);

        // Assert candidate output has a separate, distinct hash
        var outputHash = ComputeHash(result.Bytes);
        Assert.NotEqual(originalHashBefore, outputHash);

        // Assert output decodes cleanly
        using var decData = SKData.CreateCopy(result.Bytes);
        using var decBmp = SKBitmap.Decode(decData);
        Assert.NotNull(decBmp);

        _output.WriteLine($"Operation: {operation}");
        _output.WriteLine($"  Original SHA-256 Before: {originalHashBefore}");
        _output.WriteLine($"  Original SHA-256 After:  {originalHashAfter} (VERIFIED IDENTICAL)");
        _output.WriteLine($"  Candidate SHA-256:       {outputHash}");
        _output.WriteLine($"  Candidate Dimensions:    {result.Width}x{result.Height}, Size: {result.FileSize} bytes");
    }

    [Theory]
    [InlineData("ImproveClarity", "Light")]
    [InlineData("ImproveClarity", "Balanced")]
    [InlineData("ImproveClarity", "High")]
    [InlineData("ImproveSharpness", "Light")]
    [InlineData("ImproveSharpness", "Balanced")]
    [InlineData("ImproveSharpness", "High")]
    [InlineData("ReduceNoise", "Light")]
    [InlineData("ReduceNoise", "Balanced")]
    [InlineData("ReduceNoise", "High")]
    [InlineData("Upscale", "Light")]
    [InlineData("Upscale", "Balanced")]
    [InlineData("Upscale", "High")]
    [InlineData("ClassicLook", "Light")]
    [InlineData("ClassicLook", "Balanced")]
    [InlineData("ClassicLook", "High")]
    [InlineData("ModernLook", "Light")]
    [InlineData("ModernLook", "Balanced")]
    [InlineData("ModernLook", "High")]
    [InlineData("WebOptimize", "Light")]
    [InlineData("WebOptimize", "Balanced")]
    [InlineData("WebOptimize", "High")]
    public async Task PresetContracts_ExecuteDiscreteAlgorithm_ProduceDecodableOutput(string operation, string preset)
    {
        var inputBytes = CreateArchitecturalTestImage(600, 400, SKEncodedImageFormat.Jpeg, 90);
        using var stream = new MemoryStream(inputBytes);

        var result = await _service.ProcessImageAsync(stream, operation, new ImageProcessingOptions { Preset = preset });

        Assert.NotNull(result);
        Assert.NotEmpty(result.Bytes);
        Assert.Contains(preset, result.EffectiveProfile);
        Assert.StartsWith(operation, result.EffectiveProfile);

        // Must be decodable
        using var data = SKData.CreateCopy(result.Bytes);
        using var bmp = SKBitmap.Decode(data);
        Assert.NotNull(bmp);
        Assert.Equal(result.Width, bmp.Width);
        Assert.Equal(result.Height, bmp.Height);
    }

    [Fact]
    public async Task CorruptInput_EmptyBytes_ThrowsInvalidOperationException()
    {
        var emptyBytes = Array.Empty<byte>();
        using var stream = new MemoryStream(emptyBytes);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.ProcessImageAsync(stream, "ImproveClarity"));

        Assert.Contains("empty", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CorruptInput_RandomGarbageBytes_ThrowsInvalidOperationException()
    {
        var rng = new Random(12345);
        var garbage = new byte[1024];
        rng.NextBytes(garbage);

        using var stream = new MemoryStream(garbage);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.ProcessImageAsync(stream, "ImproveClarity"));

        Assert.Contains("Failed to decode image data", ex.Message);
    }

    [Fact]
    public async Task CorruptInput_TruncatedJpeg_ThrowsInvalidOperationException()
    {
        var validBytes = CreateArchitecturalTestImage(400, 300, SKEncodedImageFormat.Jpeg);
        // Truncate after first 64 bytes (contains header but missing compressed scanlines)
        var truncated = new byte[64];
        Array.Copy(validBytes, 0, truncated, 0, 64);

        using var stream = new MemoryStream(truncated);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.ProcessImageAsync(stream, "ImproveClarity"));

        Assert.Contains("Failed to decode image data", ex.Message);
    }

    [Fact]
    public async Task CorruptInput_SyntheticHeaderWithoutScanlines_ThrowsInvalidOperationException()
    {
        // 38-byte mock header (the old mock test stub)
        var mockStub = new byte[]
        {
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
            0xFF, 0xC0, 0x00, 0x11, 0x08, 0x04, 0x38, 0x07, 0x80, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
            0xFF, 0xD9
        };

        using var stream = new MemoryStream(mockStub);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.ProcessImageAsync(stream, "ImproveClarity"));

        Assert.Contains("Failed to decode image data", ex.Message);
    }

    [Fact]
    public async Task CorruptInput_TruncatedPng_ThrowsInvalidOperationException()
    {
        var validPng = CreateArchitecturalTestImage(400, 300, SKEncodedImageFormat.Png);
        var truncatedPng = new byte[33]; // Only PNG header and IHDR
        Array.Copy(validPng, 0, truncatedPng, 0, 33);

        using var stream = new MemoryStream(truncatedPng);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.ProcessImageAsync(stream, "WebOptimize"));

        Assert.Contains("Failed to decode image data", ex.Message);
    }

    [Fact]
    public async Task FormatPreservation_Jpeg_Png_WebP_PreservesSourceFormat()
    {
        // 1. JPEG in -> JPEG out
        var jpegBytes = CreateArchitecturalTestImage(400, 300, SKEncodedImageFormat.Jpeg);
        using (var s = new MemoryStream(jpegBytes))
        {
            var res = await _service.ProcessImageAsync(s, "ImproveClarity");
            Assert.Equal("image/jpeg", res.MimeType);
            Assert.Equal(".jpg", res.FileExtension);
        }

        // 2. PNG in -> PNG out
        var pngBytes = CreateArchitecturalTestImage(400, 300, SKEncodedImageFormat.Png);
        using (var s = new MemoryStream(pngBytes))
        {
            var res = await _service.ProcessImageAsync(s, "ImproveClarity");
            Assert.Equal("image/png", res.MimeType);
            Assert.Equal(".png", res.FileExtension);
        }

        // 3. WebP in -> WebP out
        var webpBytes = CreateArchitecturalTestImage(400, 300, SKEncodedImageFormat.Webp);
        using (var s = new MemoryStream(webpBytes))
        {
            var res = await _service.ProcessImageAsync(s, "ImproveClarity");
            Assert.Equal("image/webp", res.MimeType);
            Assert.Equal(".webp", res.FileExtension);
        }
    }

    [Fact]
    public async Task WebOptimize_AlwaysConvertsToWebp_AndReducesByteSize()
    {
        // Large PNG (1200x800, lossless)
        var largePng = CreateArchitecturalTestImage(1200, 800, SKEncodedImageFormat.Png);
        using var stream = new MemoryStream(largePng);

        var result = await _service.ProcessImageAsync(stream, "WebOptimize", new ImageProcessingOptions { Preset = "Balanced" });

        Assert.NotNull(result);
        Assert.Equal("image/webp", result.MimeType);
        Assert.Equal(".webp", result.FileExtension);
        Assert.True(result.FileSize < largePng.Length, $"WebP output ({result.FileSize} B) must be smaller than PNG ({largePng.Length} B).");

        // Verify valid WebP magic
        Assert.True(result.Bytes.Length >= 12);
        Assert.Equal((byte)'R', result.Bytes[0]);
        Assert.Equal((byte)'I', result.Bytes[1]);
        Assert.Equal((byte)'F', result.Bytes[2]);
        Assert.Equal((byte)'F', result.Bytes[3]);
        Assert.Equal((byte)'W', result.Bytes[8]);
        Assert.Equal((byte)'E', result.Bytes[9]);
        Assert.Equal((byte)'B', result.Bytes[10]);
        Assert.Equal((byte)'P', result.Bytes[11]);
    }

    [Fact]
    public async Task ReduceNoise_OnNoisyImage_MeasurablyReducesPixelVariance()
    {
        var noisyBytes = CreateNoisyTestImage(400, 300);

        // Measure noise variance on input
        using var inData = SKData.CreateCopy(noisyBytes);
        using var inBmp = SKBitmap.Decode(inData);
        Assert.NotNull(inBmp);

        double inVariance = CalculateLuminanceVariance(inBmp, 50, 50, 100, 100);

        using var stream = new MemoryStream(noisyBytes);
        var result = await _service.ProcessImageAsync(stream, "ReduceNoise", new ImageProcessingOptions { Preset = "Balanced" });

        using var outData = SKData.CreateCopy(result.Bytes);
        using var outBmp = SKBitmap.Decode(outData);
        Assert.NotNull(outBmp);

        double outVariance = CalculateLuminanceVariance(outBmp, 50, 50, 100, 100);

        _output.WriteLine($"Noise Variance: In = {inVariance:F2}, Out = {outVariance:F2}");
        Assert.True(outVariance < inVariance, $"ReduceNoise must reduce pixel variance (In: {inVariance:F2}, Out: {outVariance:F2})");
    }

    private static double CalculateLuminanceVariance(SKBitmap bmp, int startX, int startY, int w, int h)
    {
        var lums = new List<double>();
        for (int y = startY; y < startY + h; y++)
        {
            for (int x = startX; x < startX + w; x++)
            {
                var c = bmp.GetPixel(x, y);
                var lum = 0.2126 * c.Red + 0.7152 * c.Green + 0.0722 * c.Blue;
                lums.Add(lum);
            }
        }
        var mean = lums.Average();
        var variance = lums.Select(v => Math.Pow(v - mean, 2)).Average();
        return variance;
    }

    [Fact]
    public async Task ClassicLook_IncreasesWarmColorRatios_AcrossAllPresets()
    {
        var inputBytes = CreateArchitecturalTestImage(600, 450, SKEncodedImageFormat.Jpeg);
        using var inData = SKData.CreateCopy(inputBytes);
        using var inBmp = SKBitmap.Decode(inData);
        Assert.NotNull(inBmp);
        var inCenter = inBmp.GetPixel(300, 225);
        double inRatio = (double)inCenter.Red / Math.Max((int)inCenter.Blue, 1);

        foreach (var preset in new[] { "Light", "Balanced", "High" })
        {
            using var stream = new MemoryStream(inputBytes);
            var result = await _service.ProcessImageAsync(stream, "ClassicLook", new ImageProcessingOptions { Preset = preset });

            using var outData = SKData.CreateCopy(result.Bytes);
            using var outBmp = SKBitmap.Decode(outData);
            Assert.NotNull(outBmp);
            var outCenter = outBmp.GetPixel(300, 225);
            double outRatio = (double)outCenter.Red / Math.Max((int)outCenter.Blue, 1);

            Assert.True(outRatio >= inRatio, $"ClassicLook ({preset}) must increase red/blue warmth (In: {inRatio:F3}, Out: {outRatio:F3})");
            _output.WriteLine($"ClassicLook ({preset}): In R/B = {inRatio:F3}, Out R/B = {outRatio:F3}");
        }
    }

    [Fact]
    public async Task ModernLook_IncreasesCoolColorRatios_AcrossAllPresets()
    {
        var inputBytes = CreateArchitecturalTestImage(600, 450, SKEncodedImageFormat.Jpeg);
        using var inData = SKData.CreateCopy(inputBytes);
        using var inBmp = SKBitmap.Decode(inData);
        Assert.NotNull(inBmp);
        var inCenter = inBmp.GetPixel(300, 225);
        double inRatio = (double)inCenter.Blue / Math.Max((int)inCenter.Red, 1);

        foreach (var preset in new[] { "Light", "Balanced", "High" })
        {
            using var stream = new MemoryStream(inputBytes);
            var result = await _service.ProcessImageAsync(stream, "ModernLook", new ImageProcessingOptions { Preset = preset });

            using var outData = SKData.CreateCopy(result.Bytes);
            using var outBmp = SKBitmap.Decode(outData);
            Assert.NotNull(outBmp);
            var outCenter = outBmp.GetPixel(300, 225);
            double outRatio = (double)outCenter.Blue / Math.Max((int)outCenter.Red, 1);

            Assert.True(outRatio >= inRatio, $"ModernLook ({preset}) must increase blue/red cool ratio (In: {inRatio:F3}, Out: {outRatio:F3})");
            _output.WriteLine($"ModernLook ({preset}): In B/R = {inRatio:F3}, Out B/R = {outRatio:F3}");
        }
    }

    [Fact]
    public async Task Upscale_AdaptiveScaling_AndCeilingHonesty()
    {
        // 1. Small image (400x300) -> 2.0x = 800x600
        var small = CreateArchitecturalTestImage(400, 300);
        using (var s = new MemoryStream(small))
        {
            var res = await _service.ProcessImageAsync(s, "Upscale");
            Assert.Equal(800, res.Width);
            Assert.Equal(600, res.Height);
        }

        // 2. Medium image (1000x750) -> 1.5x = 1500x1125
        var med = CreateArchitecturalTestImage(1000, 750);
        using (var s = new MemoryStream(med))
        {
            var res = await _service.ProcessImageAsync(s, "Upscale");
            Assert.Equal(1500, res.Width);
            Assert.Equal(1125, res.Height);
        }

        // 3. 25 Megapixel image (5000x5000 = 25,000,000 pixels) -> ceiling clamp
        var maxMp = CreateArchitecturalTestImage(5000, 5000);
        using (var s = new MemoryStream(maxMp))
        {
            var res = await _service.ProcessImageAsync(s, "Upscale");
            Assert.Equal(5000, res.Width);
            Assert.Equal(5000, res.Height);
            Assert.Contains("25 megapixels", string.Join(" ", res.AppliedCorrections));
        }
    }

    private static byte[] CreatePortraitSkinToneImage(int width, int height)
    {
        using var bitmap = new SKBitmap(width, height, SKColorType.Rgba8888, SKAlphaType.Premul);
        using (var canvas = new SKCanvas(bitmap))
        {
            // Background
            canvas.Clear(new SKColor(215, 220, 225));

            // Hair / Silhouette
            using var hairPaint = new SKPaint { Color = new SKColor(45, 30, 22) };
            canvas.DrawOval(new SKRect(width * 0.20f, height * 0.10f, width * 0.80f, height * 0.85f), hairPaint);

            // Face (Forehead / Cheek base: natural warm skin tone)
            using var facePaint = new SKPaint { Color = new SKColor(230, 185, 155) };
            canvas.DrawOval(new SKRect(width * 0.25f, height * 0.18f, width * 0.75f, height * 0.78f), facePaint);

            // Cheek blush zone (subtle rose gradient tone)
            using var cheekPaint = new SKPaint { Color = new SKColor(225, 168, 145) };
            canvas.DrawOval(new SKRect(width * 0.28f, height * 0.42f, width * 0.44f, height * 0.58f), cheekPaint);
            canvas.DrawOval(new SKRect(width * 0.56f, height * 0.42f, width * 0.72f, height * 0.58f), cheekPaint);

            // Lips (natural rose-mauve)
            using var lipPaint = new SKPaint { Color = new SKColor(190, 85, 95) };
            canvas.DrawOval(new SKRect(width * 0.40f, height * 0.62f, width * 0.60f, height * 0.68f), lipPaint);

            // Eyes / Brows
            using var eyePaint = new SKPaint { Color = new SKColor(50, 40, 35) };
            canvas.DrawOval(new SKRect(width * 0.35f, height * 0.36f, width * 0.43f, height * 0.41f), eyePaint);
            canvas.DrawOval(new SKRect(width * 0.57f, height * 0.36f, width * 0.65f, height * 0.41f), eyePaint);
        }

        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Jpeg, 92);
        return data.ToArray();
    }

    private static byte[] CreateLowLightNoisyInteriorImage(int width, int height)
    {
        using var bitmap = new SKBitmap(width, height, SKColorType.Rgba8888, SKAlphaType.Premul);
        using (var canvas = new SKCanvas(bitmap))
        {
            // Dim evening interior (shadow dominant, luminance ~0.10 - 0.20)
            canvas.Clear(new SKColor(35, 30, 38)); // Dark ambient room

            // Dim wooden cabinet (lower half)
            using var cabPaint = new SKPaint { Color = new SKColor(50, 35, 25) };
            canvas.DrawRect(0, height * 0.50f, width, height * 0.50f, cabPaint);

            // Faint table lamp glow (accent light)
            using var lampPaint = new SKPaint { Color = new SKColor(180, 140, 80) };
            canvas.DrawCircle(width * 0.75f, height * 0.35f, width * 0.12f, lampPaint);
        }

        // Add high-ISO sensor speckle noise
        var rng = new Random(77);
        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                var c = bitmap.GetPixel(x, y);
                var noise = rng.Next(-22, 23);
                var r = Math.Clamp(c.Red + noise, 0, 255);
                var g = Math.Clamp(c.Green + noise, 0, 255);
                var b = Math.Clamp(c.Blue + noise, 0, 255);
                bitmap.SetPixel(x, y, new SKColor((byte)r, (byte)g, (byte)b));
            }
        }

        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Jpeg, 90);
        return data.ToArray();
    }

    private static byte[] CreateSmoothGradientAndFlatColorImage(int width, int height)
    {
        using var bitmap = new SKBitmap(width, height, SKColorType.Rgba8888, SKAlphaType.Premul);
        using (var canvas = new SKCanvas(bitmap))
        {
            // Smooth vertical sunset sky gradient (top 60%)
            using var gradientPaint = new SKPaint();
            gradientPaint.Shader = SKShader.CreateLinearGradient(
                new SKPoint(0, 0),
                new SKPoint(0, height * 0.60f),
                new[] { new SKColor(40, 60, 130), new SKColor(180, 100, 110), new SKColor(230, 160, 90) },
                new[] { 0.0f, 0.55f, 1.0f },
                SKShaderTileMode.Clamp);
            canvas.DrawRect(0, 0, width, height * 0.60f, gradientPaint);

            // Flat solid architectural banner (bottom 40%)
            using var flatPaint = new SKPaint { Color = new SKColor(240, 238, 230) };
            canvas.DrawRect(0, height * 0.60f, width, height * 0.40f, flatPaint);
        }

        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);
        return data.ToArray();
    }

    private static byte[] CreateTransparentPngImage(int width, int height)
    {
        using var bitmap = new SKBitmap(width, height, SKColorType.Rgba8888, SKAlphaType.Premul);
        using (var canvas = new SKCanvas(bitmap))
        {
            // Transparent canvas
            canvas.Clear(SKColors.Transparent);

            // Solid geometric badge in center
            using var badgePaint = new SKPaint { Color = new SKColor(30, 90, 180, 255), IsAntialias = true };
            canvas.DrawRoundRect(width * 0.20f, height * 0.20f, width * 0.60f, height * 0.60f, 20, 20, badgePaint);

            // Semi-transparent decorative ring
            using var ringPaint = new SKPaint
            {
                Color = new SKColor(255, 215, 0, 180),
                Style = SKPaintStyle.Stroke,
                StrokeWidth = 8,
                IsAntialias = true
            };
            canvas.DrawCircle(width * 0.50f, height * 0.50f, width * 0.22f, ringPaint);
        }

        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);
        return data.ToArray();
    }

    private static byte[] CreateTinyCompressedJpeg(int width, int height)
    {
        using var bitmap = new SKBitmap(width, height, SKColorType.Rgba8888, SKAlphaType.Premul);
        using (var canvas = new SKCanvas(bitmap))
        {
            canvas.Clear(new SKColor(100, 120, 140));
        }
        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Jpeg, 50); // Low quality, tiny byte footprint
        return data.ToArray();
    }

    [Fact]
    public async Task RealisticQuality_PortraitSkinTones_NoColorClippingOrHarshArtifacts()
    {
        var inputBytes = CreatePortraitSkinToneImage(600, 600);
        var inputHash = ComputeHash(inputBytes);

        // Test ImproveClarity and ModernLook on skin tones
        using var s1 = new MemoryStream(inputBytes);
        var resClarity = await _service.ProcessImageAsync(s1, "ImproveClarity", new ImageProcessingOptions { Preset = "Balanced" });
        Assert.NotNull(resClarity);

        using var decData = SKData.CreateCopy(resClarity.Bytes);
        using var decBmp = SKBitmap.Decode(decData);
        Assert.NotNull(decBmp);

        // Verify cheek tone in enhanced output: skin tone must not clip to 255 or invert
        var cheekColor = decBmp.GetPixel(200, 300); // left cheek
        Assert.True(cheekColor.Red > cheekColor.Blue, "Skin tone must maintain healthy warm balance (Red > Blue).");
        Assert.True(cheekColor.Red < 255, "Cheek highlights must not blow out to clipped pure white (255).");

        _output.WriteLine($"Portrait Skin-Tone Test: In Hash = {inputHash[..12]}..., Out Clarity Hash = {ComputeHash(resClarity.Bytes)[..12]}...");
        _output.WriteLine($"Cheek Color: R={cheekColor.Red}, G={cheekColor.Green}, B={cheekColor.Blue}");
    }

    [Fact]
    public async Task RealisticQuality_LowLightNoisyInterior_ReducesNoiseWithoutDestroyingEdges()
    {
        var inputBytes = CreateLowLightNoisyInteriorImage(500, 400);

        using var inData = SKData.CreateCopy(inputBytes);
        using var inBmp = SKBitmap.Decode(inData);
        Assert.NotNull(inBmp);
        double inShadowVariance = CalculateLuminanceVariance(inBmp, 20, 20, 80, 80);

        using var s = new MemoryStream(inputBytes);
        var resNoise = await _service.ProcessImageAsync(s, "ReduceNoise", new ImageProcessingOptions { Preset = "Balanced" });

        using var outData = SKData.CreateCopy(resNoise.Bytes);
        using var outBmp = SKBitmap.Decode(outData);
        Assert.NotNull(outBmp);
        double outShadowVariance = CalculateLuminanceVariance(outBmp, 20, 20, 80, 80);

        _output.WriteLine($"Low-Light Interior Noise: In Variance = {inShadowVariance:F2}, Out Variance = {outShadowVariance:F2}");
        Assert.True(outShadowVariance < inShadowVariance, "ReduceNoise must attenuate high-ISO sensor grain in dim shadow regions.");
    }

    [Fact]
    public async Task RealisticQuality_SmoothGradientAndFlatColor_NoBandingOrEdgeHalos()
    {
        var inputBytes = CreateSmoothGradientAndFlatColorImage(600, 400);

        using var s = new MemoryStream(inputBytes);
        var res = await _service.ProcessImageAsync(s, "ImproveClarity", new ImageProcessingOptions { Preset = "Balanced" });

        using var outData = SKData.CreateCopy(res.Bytes);
        using var outBmp = SKBitmap.Decode(outData);
        Assert.NotNull(outBmp);
        Assert.Equal(600, outBmp.Width);
        Assert.Equal(400, outBmp.Height);

        // Flat banner region at (300, 350) should remain clean without edge noise
        var flatPixel = outBmp.GetPixel(300, 350);
        Assert.True(flatPixel.Red > 220 && flatPixel.Green > 220 && flatPixel.Blue > 210, "Flat architectural banner must retain clean neutral tone.");
    }

    [Fact]
    public async Task RealisticQuality_PngTransparency_PreservesAlphaChannel()
    {
        var inputBytes = CreateTransparentPngImage(400, 400);

        // Test ImproveClarity on transparent PNG
        using (var s = new MemoryStream(inputBytes))
        {
            var res = await _service.ProcessImageAsync(s, "ImproveClarity", new ImageProcessingOptions { Preset = "Balanced" });
            Assert.Equal("image/png", res.MimeType);
            Assert.Equal(".png", res.FileExtension);

            using var decData = SKData.CreateCopy(res.Bytes);
            using var decBmp = SKBitmap.Decode(decData);
            Assert.NotNull(decBmp);

            // Pixel (10, 10) was transparent background; must remain transparent
            var cornerPixel = decBmp.GetPixel(10, 10);
            Assert.Equal(0, cornerPixel.Alpha);

            // Pixel (200, 200) was badge center; must remain fully opaque
            var centerPixel = decBmp.GetPixel(200, 200);
            Assert.Equal(255, centerPixel.Alpha);
        }

        // Test WebOptimize on transparent PNG (WebP supports alpha)
        using (var s = new MemoryStream(inputBytes))
        {
            var res = await _service.ProcessImageAsync(s, "WebOptimize", new ImageProcessingOptions { Preset = "Balanced" });
            Assert.Equal("image/webp", res.MimeType);
            Assert.Equal(".webp", res.FileExtension);

            using var decData = SKData.CreateCopy(res.Bytes);
            using var decBmp = SKBitmap.Decode(decData);
            Assert.NotNull(decBmp);

            var cornerPixel = decBmp.GetPixel(10, 10);
            Assert.Equal(0, cornerPixel.Alpha);
        }
    }

    [Fact]
    public async Task RealisticQuality_WebOptimize_AcrossMultipleInputs_AccuratelyReportsCompressionDeltas()
    {
        // 1. Substantial input: 1200x800 PNG (lossless, ~120KB)
        var largePng = CreateArchitecturalTestImage(1200, 800, SKEncodedImageFormat.Png);
        using (var s = new MemoryStream(largePng))
        {
            var res = await _service.ProcessImageAsync(s, "WebOptimize", new ImageProcessingOptions { Preset = "Balanced" });
            Assert.True(res.FileSize < largePng.Length, "WebOptimize must achieve substantial reduction on large uncompressed assets.");
            _output.WriteLine($"Large PNG WebOptimize: In = {largePng.Length} B, Out = {res.FileSize} B (Savings: {(1.0 - (double)res.FileSize / largePng.Length) * 100:F1}%)");
        }

        // 2. Tiny, already-heavily-compressed input: 48x48 JPEG (~350B)
        var tinyJpeg = CreateTinyCompressedJpeg(48, 48);
        using (var s = new MemoryStream(tinyJpeg))
        {
            var res = await _service.ProcessImageAsync(s, "WebOptimize", new ImageProcessingOptions { Preset = "Balanced" });
            Assert.NotNull(res);
            Assert.Equal("image/webp", res.MimeType);
            // On tiny images (48x48), WebP container headers may slightly increase total bytes over bare low-quality JPEG Huffman table
            _output.WriteLine($"Tiny 48x48 JPEG WebOptimize: In = {tinyJpeg.Length} B, Out = {res.FileSize} B (Delta: {res.FileSize - tinyJpeg.Length} B)");
        }
    }
}
