using System.Text;
using Sparovia.Application.Images;
using Xunit;

namespace Sparovia.UnitTests;

public class ImageValidatorTests
{
    private readonly ImageValidator _validator = new();

    private static byte[] CreateValidJpeg(int width = 1920, int height = 1080)
    {
        // SOI (FF D8), APP0 (FF E0 ...), SOF0 (FF C0 00 11 08 [H] [W] ...), EOI (FF D9)
        var hHigh = (byte)((height >> 8) & 0xFF);
        var hLow = (byte)(height & 0xFF);
        var wHigh = (byte)((width >> 8) & 0xFF);
        var wLow = (byte)(width & 0xFF);

        return new byte[]
        {
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
            0xFF, 0xC0, 0x00, 0x11, 0x08, hHigh, hLow, wHigh, wLow, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
            0xFF, 0xD9
        };
    }

    private static byte[] CreateValidPng(int width = 800, int height = 600)
    {
        var wB0 = (byte)((width >> 24) & 0xFF);
        var wB1 = (byte)((width >> 16) & 0xFF);
        var wB2 = (byte)((width >> 8) & 0xFF);
        var wB3 = (byte)(width & 0xFF);

        var hB0 = (byte)((height >> 24) & 0xFF);
        var hB1 = (byte)((height >> 16) & 0xFF);
        var hB2 = (byte)((height >> 8) & 0xFF);
        var hB3 = (byte)(height & 0xFF);

        return new byte[]
        {
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // Magic
            0x00, 0x00, 0x00, 0x0D, // IHDR chunk length (13)
            0x49, 0x48, 0x44, 0x52, // "IHDR"
            wB0, wB1, wB2, wB3,     // Width
            hB0, hB1, hB2, hB3,     // Height
            0x08, 0x02, 0x00, 0x00, 0x00,
            0x4D, 0xB4, 0x2C, 0x6B  // CRC
        };
    }

    private static byte[] CreateValidWebp(int width = 200, int height = 100)
    {
        var bytes = new byte[32];
        bytes[0] = 0x52; bytes[1] = 0x49; bytes[2] = 0x46; bytes[3] = 0x46; // RIFF
        bytes[4] = 0x18; bytes[5] = 0x00; bytes[6] = 0x00; bytes[7] = 0x00; // size
        bytes[8] = 0x57; bytes[9] = 0x45; bytes[10] = 0x42; bytes[11] = 0x50; // WEBP
        bytes[12] = 0x56; bytes[13] = 0x50; bytes[14] = 0x38; bytes[15] = 0x20; // VP8 
        bytes[16] = 0x0A; bytes[17] = 0x00; bytes[18] = 0x00; bytes[19] = 0x00;
        bytes[20] = 0x9D; bytes[21] = 0x01; bytes[22] = 0x2A; // keyframe code
        bytes[23] = 0x00; bytes[24] = 0x00; bytes[25] = 0x00;
        bytes[26] = (byte)(width & 0xFF); bytes[27] = (byte)((width >> 8) & 0x3F);
        bytes[28] = (byte)(height & 0xFF); bytes[29] = (byte)((height >> 8) & 0x3F);
        return bytes;
    }

    [Fact]
    public void Test01_ValidJpeg_Accepted()
    {
        var bytes = CreateValidJpeg(1920, 1080);
        using var stream = new MemoryStream(bytes);

        var result = _validator.Validate(stream, "living_room.jpeg", "image/jpeg");

        Assert.True(result.IsValid);
        Assert.Equal("image/jpeg", result.DetectedMimeType);
        Assert.Equal(1920, result.Width);
        Assert.Equal(1080, result.Height);
        Assert.Equal(".jpg", result.RecommendedExtension);
    }

    [Fact]
    public void Test02_ValidJpg_Accepted()
    {
        var bytes = CreateValidJpeg(1280, 720);
        using var stream = new MemoryStream(bytes);

        var result = _validator.Validate(stream, "exterior.jpg", "image/jpeg");

        Assert.True(result.IsValid);
        Assert.Equal("image/jpeg", result.DetectedMimeType);
        Assert.Equal(1280, result.Width);
        Assert.Equal(720, result.Height);
    }

    [Fact]
    public void Test03_ValidPng_Accepted()
    {
        var bytes = CreateValidPng(800, 600);
        using var stream = new MemoryStream(bytes);

        var result = _validator.Validate(stream, "portfolio.png", "image/png");

        Assert.True(result.IsValid);
        Assert.Equal("image/png", result.DetectedMimeType);
        Assert.Equal(800, result.Width);
        Assert.Equal(600, result.Height);
        Assert.Equal(".png", result.RecommendedExtension);
    }

    [Fact]
    public void Test04_ValidWebp_Accepted()
    {
        var bytes = CreateValidWebp(200, 100);
        using var stream = new MemoryStream(bytes);

        var result = _validator.Validate(stream, "hero.webp", "image/webp");

        Assert.True(result.IsValid);
        Assert.Equal("image/webp", result.DetectedMimeType);
        Assert.Equal(200, result.Width);
        Assert.Equal(100, result.Height);
        Assert.Equal(".webp", result.RecommendedExtension);
    }

    [Fact]
    public void Test05_Svg_Rejected()
    {
        var svgBytes = Encoding.UTF8.GetBytes("<svg xmlns=\"http://www.w3.org/2000/svg\"><circle r=\"10\"/></svg>");
        using var stream = new MemoryStream(svgBytes);

        var result = _validator.Validate(stream, "vector.svg", "image/svg+xml");

        Assert.False(result.IsValid);
        Assert.Equal("UNSUPPORTED_FORMAT", result.ErrorCode);
    }

    [Fact]
    public void Test06_Gif_Rejected()
    {
        var gifBytes = new byte[] { 0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x0A, 0x00, 0x0A, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00 };
        using var stream = new MemoryStream(gifBytes);

        var result = _validator.Validate(stream, "animation.gif", "image/gif");

        Assert.False(result.IsValid);
        Assert.Equal("UNSUPPORTED_FORMAT", result.ErrorCode);
    }

    [Fact]
    public void Test07_Tiff_Rejected()
    {
        var tiffBytes = new byte[] { 0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x01, 0x03, 0x00, 0x01, 0x00 };
        using var stream = new MemoryStream(tiffBytes);

        var result = _validator.Validate(stream, "scan.tiff", "image/tiff");

        Assert.False(result.IsValid);
        Assert.Equal("UNSUPPORTED_FORMAT", result.ErrorCode);
    }

    [Fact]
    public void Test08_Raw_Rejected()
    {
        // Canon CR2 header starts with II\x1a\0\0\0HEAPCCDR
        var rawBytes = new byte[] { 0x49, 0x49, 0x2A, 0x00, 0x10, 0x00, 0x00, 0x00, 0x43, 0x52, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00 };
        using var stream = new MemoryStream(rawBytes);

        var result = _validator.Validate(stream, "photo.cr2", "image/x-canon-cr2");

        Assert.False(result.IsValid);
        Assert.Equal("UNSUPPORTED_FORMAT", result.ErrorCode);
    }

    [Fact]
    public void Test09_Heic_Rejected()
    {
        var heicBytes = new byte[]
        {
            0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // ftyp
            0x68, 0x65, 0x69, 0x63, 0x00, 0x00, 0x00, 0x00  // heic
        };
        using var stream = new MemoryStream(heicBytes);

        var result = _validator.Validate(stream, "camera.heic", "image/heic");

        Assert.False(result.IsValid);
        Assert.Equal("UNSUPPORTED_FORMAT", result.ErrorCode);
    }

    [Fact]
    public void Test10_Heif_Rejected()
    {
        var heifBytes = new byte[]
        {
            0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // ftyp
            0x6D, 0x69, 0x66, 0x31, 0x00, 0x00, 0x00, 0x00  // mif1
        };
        using var stream = new MemoryStream(heifBytes);

        var result = _validator.Validate(stream, "camera.heif", "image/heif");

        Assert.False(result.IsValid);
        Assert.Equal("UNSUPPORTED_FORMAT", result.ErrorCode);
    }

    [Fact]
    public void Test11_Pdf_Rejected()
    {
        var pdfBytes = Encoding.UTF8.GetBytes("%PDF-1.4\n1 0 obj\n<<\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF");
        using var stream = new MemoryStream(pdfBytes);

        var result = _validator.Validate(stream, "document.pdf", "application/pdf");

        Assert.False(result.IsValid);
        Assert.Equal("UNSUPPORTED_FORMAT", result.ErrorCode);
    }

    [Fact]
    public void Test12_Executable_Rejected()
    {
        // MZ PE header
        var exeBytes = new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00 };
        using var stream = new MemoryStream(exeBytes);

        var result = _validator.Validate(stream, "setup.exe", "application/octet-stream");

        Assert.False(result.IsValid);
        Assert.Equal("UNSUPPORTED_FORMAT", result.ErrorCode);
    }

    [Fact]
    public void Test13_OversizedFile_Rejected()
    {
        // 11 MB stream
        var mockStream = new MockOversizedStream(11 * 1024 * 1024);

        var result = _validator.Validate(mockStream, "huge.jpg", "image/jpeg");

        Assert.False(result.IsValid);
        Assert.Equal("FILE_TOO_LARGE", result.ErrorCode);
        Assert.Contains("under 10 MB", result.ErrorMessage);
    }

    [Fact]
    public void Test14_CorruptJpeg_TruncatedBeforeSOF_Rejected()
    {
        // JPEG SOI but truncated before SOF
        var corruptBytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x00 };
        using var stream = new MemoryStream(corruptBytes);

        var result = _validator.Validate(stream, "corrupt.jpg", "image/jpeg");

        Assert.False(result.IsValid);
        Assert.Equal("CORRUPT_IMAGE", result.ErrorCode);
    }

    [Fact]
    public void Test15_CorruptPng_MissingIhdr_Rejected()
    {
        // PNG magic signature followed by garbage instead of IHDR
        var corruptBytes = new byte[]
        {
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D,
            0x42, 0x41, 0x44, 0x21, // "BAD!" instead of "IHDR"
            0x00, 0x00, 0x01, 0x00
        };
        using var stream = new MemoryStream(corruptBytes);

        var result = _validator.Validate(stream, "corrupt.png", "image/png");

        Assert.False(result.IsValid);
        Assert.Equal("CORRUPT_IMAGE", result.ErrorCode);
    }

    [Fact]
    public void Test16_InvalidWebp_CorruptKeyframe_Rejected()
    {
        // RIFF ... WEBP VP8 with invalid keyframe code
        var corruptWebp = new byte[32];
        corruptWebp[0] = 0x52; corruptWebp[1] = 0x49; corruptWebp[2] = 0x46; corruptWebp[3] = 0x46;
        corruptWebp[8] = 0x57; corruptWebp[9] = 0x45; corruptWebp[10] = 0x42; corruptWebp[11] = 0x50;
        corruptWebp[12] = 0x56; corruptWebp[13] = 0x50; corruptWebp[14] = 0x38; corruptWebp[15] = 0x20;
        corruptWebp[20] = 0x00; corruptWebp[21] = 0x00; corruptWebp[22] = 0x00; // invalid keyframe
        using var stream = new MemoryStream(corruptWebp);

        var result = _validator.Validate(stream, "corrupt.webp", "image/webp");

        Assert.False(result.IsValid);
        Assert.Equal("CORRUPT_IMAGE", result.ErrorCode);
    }

    [Fact]
    public void Test17_MimeMismatch_DeclaredPngActualJpeg_Rejected()
    {
        var jpegBytes = CreateValidJpeg();
        using var stream = new MemoryStream(jpegBytes);

        // Declared as image/png but payload is actual JPEG
        var result = _validator.Validate(stream, "photo.jpg", "image/png");

        Assert.False(result.IsValid);
        Assert.Equal("MIME_MISMATCH", result.ErrorCode);
    }

    [Fact]
    public void Test18_ExtensionMismatch_PngRenamedToJpg_Rejected()
    {
        var pngBytes = CreateValidPng();
        using var stream = new MemoryStream(pngBytes);

        // Actual PNG file renamed to .jpg
        var result = _validator.Validate(stream, "fake.jpg", "image/jpeg");

        Assert.False(result.IsValid);
        Assert.True(result.ErrorCode is "EXTENSION_MISMATCH" or "MIME_MISMATCH");
    }

    [Fact]
    public void Test19_FakeImage_RenamedToJpg_Rejected()
    {
        var textBytes = Encoding.UTF8.GetBytes("This is plain text pretending to be a photograph.");
        using var stream = new MemoryStream(textBytes);

        var result = _validator.Validate(stream, "fake.jpg", "image/jpeg");

        Assert.False(result.IsValid);
        Assert.Equal("INVALID_IMAGE_DATA", result.ErrorCode);
    }

    [Fact]
    public void Test20_DimensionsTooSmall_Rejected()
    {
        // 50x50 is below minimum allowed 100x100
        var smallJpeg = CreateValidJpeg(width: 50, height: 50);
        using var stream = new MemoryStream(smallJpeg);

        var result = _validator.Validate(stream, "tiny.jpg", "image/jpeg");

        Assert.False(result.IsValid);
        Assert.Equal("DIMENSIONS_TOO_SMALL", result.ErrorCode);
    }

    [Fact]
    public void Test21_DimensionsExceeded_Rejected()
    {
        // 12000x800 exceeds maximum dimension of 10,000
        var hugePng = CreateValidPng(width: 12000, height: 800);
        using var stream = new MemoryStream(hugePng);

        var result = _validator.Validate(stream, "super_wide.png", "image/png");

        Assert.False(result.IsValid);
        Assert.Equal("DIMENSIONS_EXCEEDED", result.ErrorCode);
    }

    [Fact]
    public void Test22_ProcessingUnsafe_DecompressionBomb_Rejected()
    {
        // 8000x8000 = 64,000,000 pixels (exceeds 50 MP threshold)
        var bombJpeg = CreateValidJpeg(width: 8000, height: 8000);
        using var stream = new MemoryStream(bombJpeg);

        var result = _validator.Validate(stream, "bomb.jpg", "image/jpeg");

        Assert.False(result.IsValid);
        Assert.Equal("PROCESSING_UNSAFE", result.ErrorCode);
    }

    [Fact]
    public void Test23_PathTraversalFilename_DoesNotBypassValidation()
    {
        var jpegBytes = CreateValidJpeg(1920, 1080);
        using var stream = new MemoryStream(jpegBytes);

        // Filename attempting path traversal
        var result = _validator.Validate(stream, "../../../etc/passwd", "image/jpeg");

        // Rejected because extension is .passwd which is not allowed
        Assert.False(result.IsValid);
        Assert.Equal("UNSUPPORTED_FORMAT", result.ErrorCode);
    }

    private class MockOversizedStream : MemoryStream
    {
        private readonly long _length;

        public MockOversizedStream(long length)
        {
            _length = length;
        }

        public override long Length => _length;
    }
}
