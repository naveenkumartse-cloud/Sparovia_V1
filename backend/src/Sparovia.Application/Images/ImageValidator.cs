using System.Text;

namespace Sparovia.Application.Images;

public class ImageValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public string DetectedMimeType { get; set; } = string.Empty;
    public string RecommendedExtension { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public long FileSize { get; set; }
}

public interface IImageValidator
{
    ImageValidationResult Validate(Stream stream, string? fileName, string? declaredContentType);
}

public class ImageValidator : IImageValidator
{
    private readonly ImageUploadOptions _options;

    public ImageValidator(ImageUploadOptions? options = null)
    {
        _options = options ?? new ImageUploadOptions();
    }

    public ImageValidationResult Validate(Stream stream, string? fileName, string? declaredContentType)
    {
        // 1. Check for null or empty stream
        if (stream == null || stream.Length == 0)
        {
            return new ImageValidationResult
            {
                IsValid = false,
                ErrorCode = "EMPTY_FILE",
                ErrorMessage = "This image couldn't be uploaded. The file is empty."
            };
        }

        // 2. Authoritative file size check
        if (stream.Length > _options.MaxFileSizeBytes)
        {
            return new ImageValidationResult
            {
                IsValid = false,
                ErrorCode = "FILE_TOO_LARGE",
                ErrorMessage = "This image is too large. Please upload an image under 10 MB."
            };
        }

        // 3. Pre-validate extension if provided
        string? extension = null;
        if (!string.IsNullOrWhiteSpace(fileName))
        {
            // Sanitize path traversal attempts from filename
            var sanitizedFileName = Path.GetFileName(fileName);
            extension = Path.GetExtension(sanitizedFileName).ToLowerInvariant();

            if (string.IsNullOrEmpty(extension) || !_options.AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
            {
                return new ImageValidationResult
                {
                    IsValid = false,
                    ErrorCode = "UNSUPPORTED_FORMAT",
                    ErrorMessage = "This image format isn't supported. Please upload a JPG, PNG, or WebP image."
                };
            }
        }

        // 4. Pre-validate declared content type if provided
        string? normalizedDeclaredMime = null;
        if (!string.IsNullOrWhiteSpace(declaredContentType))
        {
            normalizedDeclaredMime = NormalizeMimeType(declaredContentType);
            if (!_options.AllowedMimeTypes.Contains(normalizedDeclaredMime, StringComparer.OrdinalIgnoreCase))
            {
                return new ImageValidationResult
                {
                    IsValid = false,
                    ErrorCode = "UNSUPPORTED_FORMAT",
                    ErrorMessage = "This image format isn't supported. Please upload a JPG, PNG, or WebP image."
                };
            }
        }

        // 5. Read binary header (up to 64 KB to locate SOF in JPEGs with large EXIF metadata)
        var originalPos = stream.CanSeek ? stream.Position : 0;
        if (stream.CanSeek)
        {
            stream.Seek(0, SeekOrigin.Begin);
        }

        var readSize = (int)Math.Min(stream.Length, 65536);
        var header = new byte[readSize];
        var bytesRead = stream.Read(header, 0, header.Length);

        if (stream.CanSeek)
        {
            stream.Seek(originalPos, SeekOrigin.Begin);
        }

        if (bytesRead < 16)
        {
            return new ImageValidationResult
            {
                IsValid = false,
                ErrorCode = "CORRUPT_IMAGE",
                ErrorMessage = "This image couldn't be processed. Please choose another image."
            };
        }

        // 6. Check for explicitly rejected / deferred formats via magic bytes
        var rejectedFormatResult = CheckExplicitlyRejectedFormats(header, bytesRead);
        if (rejectedFormatResult != null)
        {
            return rejectedFormatResult;
        }

        // 7. Detect supported format and parse dimensions
        var (detectedFormat, width, height, parseError) = DetectAndParseDimensions(header, bytesRead);

        if (parseError != null)
        {
            return new ImageValidationResult
            {
                IsValid = false,
                ErrorCode = parseError,
                ErrorMessage = parseError == "CORRUPT_IMAGE"
                    ? "This image couldn't be processed. Please choose another image."
                    : "This file isn't a valid image. Please choose another image."
            };
        }

        if (detectedFormat == null || width <= 0 || height <= 0)
        {
            return new ImageValidationResult
            {
                IsValid = false,
                ErrorCode = "INVALID_IMAGE_DATA",
                ErrorMessage = "This file isn't a valid image. Please choose another image."
            };
        }

        // 8. MIME consistency check (declared MIME must match actual detected binary format)
        if (normalizedDeclaredMime != null)
        {
            if (!string.Equals(normalizedDeclaredMime, detectedFormat, StringComparison.OrdinalIgnoreCase))
            {
                return new ImageValidationResult
                {
                    IsValid = false,
                    ErrorCode = "MIME_MISMATCH",
                    ErrorMessage = "This image couldn't be uploaded. The declared content type does not match the actual image format."
                };
            }
        }

        // 9. Extension consistency check (file extension must match actual detected binary format)
        if (extension != null)
        {
            var isExtValid = detectedFormat switch
            {
                "image/jpeg" => extension is ".jpg" or ".jpeg",
                "image/png" => extension is ".png",
                "image/webp" => extension is ".webp",
                _ => false
            };

            if (!isExtValid)
            {
                return new ImageValidationResult
                {
                    IsValid = false,
                    ErrorCode = "EXTENSION_MISMATCH",
                    ErrorMessage = "This image couldn't be uploaded. File extension does not match the actual image format."
                };
            }
        }

        // 10. Dimension validation: minimum limits
        if (width < _options.MinWidth || height < _options.MinHeight)
        {
            return new ImageValidationResult
            {
                IsValid = false,
                ErrorCode = "DIMENSIONS_TOO_SMALL",
                ErrorMessage = $"Image dimensions are too small. Minimum required size is {_options.MinWidth} x {_options.MinHeight} pixels."
            };
        }

        // 11. Dimension validation: maximum limits
        if (width > _options.MaxWidth || height > _options.MaxHeight)
        {
            return new ImageValidationResult
            {
                IsValid = false,
                ErrorCode = "DIMENSIONS_EXCEEDED",
                ErrorMessage = $"Image dimensions exceed the maximum supported size of {_options.MaxWidth:N0} x {_options.MaxHeight:N0} pixels."
            };
        }

        // 12. Decompression bomb / processing safety: total pixel count check
        var totalPixels = (long)width * height;
        if (totalPixels > _options.MaxPixelCount)
        {
            return new ImageValidationResult
            {
                IsValid = false,
                ErrorCode = "PROCESSING_UNSAFE",
                ErrorMessage = "This image is too large to safely process. Please choose a standard resolution image."
            };
        }

        var recExt = detectedFormat switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => ".bin"
        };

        return new ImageValidationResult
        {
            IsValid = true,
            DetectedMimeType = detectedFormat,
            RecommendedExtension = recExt,
            Width = width,
            Height = height,
            FileSize = stream.Length
        };
    }

    private static string NormalizeMimeType(string contentType)
    {
        var mime = contentType.Split(';')[0].Trim().ToLowerInvariant();
        return mime switch
        {
            "image/jpg" or "image/pjpeg" => "image/jpeg",
            "image/x-png" => "image/png",
            _ => mime
        };
    }

    private static ImageValidationResult? CheckExplicitlyRejectedFormats(byte[] buffer, int length)
    {
        // 1. Executables: PE / Windows (MZ), ELF (7F 45 4C 46), Mach-O, Shell scripts
        if (length >= 2 && buffer[0] == 0x4D && buffer[1] == 0x5A) // MZ
        {
            return CreateUnsupportedFormatResult();
        }
        if (length >= 4 && buffer[0] == 0x7F && buffer[1] == 0x45 && buffer[2] == 0x4C && buffer[3] == 0x46) // \x7FELF
        {
            return CreateUnsupportedFormatResult();
        }
        if (length >= 2 && buffer[0] == (byte)'#' && buffer[1] == (byte)'!') // #!
        {
            return CreateUnsupportedFormatResult();
        }

        // 2. PDF: %PDF
        if (length >= 4 && buffer[0] == 0x25 && buffer[1] == 0x50 && buffer[2] == 0x44 && buffer[3] == 0x46)
        {
            return CreateUnsupportedFormatResult();
        }

        // 3. GIF: GIF87a or GIF89a (47 49 46 38)
        if (length >= 4 && buffer[0] == 0x47 && buffer[1] == 0x49 && buffer[2] == 0x46 && buffer[3] == 0x38)
        {
            return CreateUnsupportedFormatResult();
        }

        // 4. TIFF: II*\0 (49 49 2A 00) or MM\0* (4D 4D 00 2A)
        if (length >= 4 &&
            ((buffer[0] == 0x49 && buffer[1] == 0x49 && buffer[2] == 0x2A && buffer[3] == 0x00) ||
             (buffer[0] == 0x4D && buffer[1] == 0x4D && buffer[2] == 0x00 && buffer[3] == 0x2A)))
        {
            return CreateUnsupportedFormatResult();
        }

        // 5. HEIC / HEIF: bytes 4..7 are "ftyp", bytes 8..11 are "heic", "heix", "hevc", "mif1", "msf1"
        if (length >= 12 &&
            buffer[4] == 0x66 && buffer[5] == 0x74 && buffer[6] == 0x79 && buffer[7] == 0x70)
        {
            var brand = Encoding.ASCII.GetString(buffer, 8, 4).ToLowerInvariant();
            if (brand is "heic" or "heix" or "hevc" or "mif1" or "msf1")
            {
                return CreateUnsupportedFormatResult();
            }
        }

        // 6. SVG: XML or <svg declaration
        var prefixAscii = Encoding.ASCII.GetString(buffer, 0, Math.Min(length, 128)).TrimStart().ToLowerInvariant();
        if (prefixAscii.StartsWith("<svg") || prefixAscii.StartsWith("<?xml"))
        {
            return CreateUnsupportedFormatResult();
        }

        return null;
    }

    private static ImageValidationResult CreateUnsupportedFormatResult()
    {
        return new ImageValidationResult
        {
            IsValid = false,
            ErrorCode = "UNSUPPORTED_FORMAT",
            ErrorMessage = "This image format isn't supported. Please upload a JPG, PNG, or WebP image."
        };
    }

    private static (string? Format, int Width, int Height, string? Error) DetectAndParseDimensions(byte[] buffer, int length)
    {
        // 1. Check PNG: 89 50 4E 47 0D 0A 1A 0A
        if (length >= 8 &&
            buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47 &&
            buffer[4] == 0x0D && buffer[5] == 0x0A && buffer[6] == 0x1A && buffer[7] == 0x0A)
        {
            // Must have IHDR chunk starting at offset 12
            if (length < 24 ||
                buffer[12] != 0x49 || buffer[13] != 0x48 || buffer[14] != 0x44 || buffer[15] != 0x52)
            {
                return (null, 0, 0, "CORRUPT_IMAGE");
            }

            // Width at offset 16 (4 bytes big-endian), Height at offset 20 (4 bytes big-endian)
            var width = (buffer[16] << 24) | (buffer[17] << 16) | (buffer[18] << 8) | buffer[19];
            var height = (buffer[20] << 24) | (buffer[21] << 16) | (buffer[22] << 8) | buffer[23];

            if (width <= 0 || height <= 0)
            {
                return (null, 0, 0, "CORRUPT_IMAGE");
            }

            return ("image/png", width, height, null);
        }

        // 2. Check JPEG: FF D8 FF
        if (length >= 3 && buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF)
        {
            var (w, h, error) = ParseJpegDimensions(buffer, length);
            if (error != null)
            {
                return (null, 0, 0, error);
            }
            return ("image/jpeg", w, h, null);
        }

        // 3. Check WebP: RIFF ... WEBP
        if (length >= 12 &&
            buffer[0] == 0x52 && buffer[1] == 0x49 && buffer[2] == 0x46 && buffer[3] == 0x46 &&
            buffer[8] == 0x57 && buffer[9] == 0x45 && buffer[10] == 0x42 && buffer[11] == 0x50)
        {
            var (w, h, error) = ParseWebpDimensions(buffer, length);
            if (error != null)
            {
                return (null, 0, 0, error);
            }
            return ("image/webp", w, h, null);
        }

        return (null, 0, 0, "INVALID_IMAGE_DATA");
    }

    private static (int Width, int Height, string? Error) ParseJpegDimensions(byte[] buffer, int length)
    {
        var i = 2; // after SOI (FF D8)
        while (i < length - 4)
        {
            if (buffer[i] != 0xFF)
            {
                i++;
                continue;
            }

            // Skip padding FF bytes
            while (i < length && buffer[i] == 0xFF)
            {
                i++;
            }

            if (i >= length)
            {
                break;
            }

            var marker = buffer[i];
            i++;

            // SOF markers:
            // 0xC0 (SOF0: Baseline), 0xC1 (SOF1: Extended Sequential),
            // 0xC2 (SOF2: Progressive), 0xC3 (SOF3: Lossless)
            if (marker is 0xC0 or 0xC1 or 0xC2 or 0xC3 or 0xC5 or 0xC6 or 0xC7 or 0xC9 or 0xCA or 0xCB or 0xCD or 0xCE or 0xCF)
            {
                if (i + 7 <= length)
                {
                    // Length: 2 bytes
                    // Data precision: 1 byte at i + 2
                    // Height: 2 bytes big-endian at i + 3
                    // Width: 2 bytes big-endian at i + 5
                    var height = (buffer[i + 3] << 8) | buffer[i + 4];
                    var width = (buffer[i + 5] << 8) | buffer[i + 6];

                    if (width <= 0 || height <= 0)
                    {
                        return (0, 0, "CORRUPT_IMAGE");
                    }

                    return (width, height, null);
                }
                return (0, 0, "CORRUPT_IMAGE");
            }
            else if (marker is 0xD8 or 0xD9) // SOI or EOI
            {
                continue;
            }
            else if (marker is 0x00 or (>= 0xD0 and <= 0xD7)) // RST markers (no length)
            {
                continue;
            }
            else
            {
                // Other marker with 2-byte segment length
                if (i + 2 <= length)
                {
                    var segLen = (buffer[i] << 8) | buffer[i + 1];
                    if (segLen < 2)
                    {
                        return (0, 0, "CORRUPT_IMAGE");
                    }
                    i += segLen;
                }
                else
                {
                    break;
                }
            }
        }

        // If SOF marker could not be located in the header data
        return (0, 0, "CORRUPT_IMAGE");
    }

    private static (int Width, int Height, string? Error) ParseWebpDimensions(byte[] buffer, int length)
    {
        if (length < 16)
        {
            return (0, 0, "CORRUPT_IMAGE");
        }

        // VP8 (lossy): "VP8 " at offset 12
        if (buffer[12] == 0x56 && buffer[13] == 0x50 && buffer[14] == 0x38 && buffer[15] == 0x20)
        {
            if (length >= 30)
            {
                // Keyframe check (0x9D 0x01 0x2A at offset 20..22)
                if (buffer[20] != 0x9D || buffer[21] != 0x01 || buffer[22] != 0x2A)
                {
                    return (0, 0, "CORRUPT_IMAGE");
                }
                var width = ((buffer[27] << 8) | buffer[26]) & 0x3FFF;
                var height = ((buffer[29] << 8) | buffer[28]) & 0x3FFF;

                if (width <= 0 || height <= 0)
                {
                    return (0, 0, "CORRUPT_IMAGE");
                }
                return (width, height, null);
            }
            return (0, 0, "CORRUPT_IMAGE");
        }
        // VP8L (lossless): "VP8L" at offset 12
        else if (buffer[12] == 0x56 && buffer[13] == 0x50 && buffer[14] == 0x38 && buffer[15] == 0x4C)
        {
            if (length >= 25 && buffer[20] == 0x2F) // 0x2F is VP8L signature byte
            {
                var b1 = buffer[21];
                var b2 = buffer[22];
                var b3 = buffer[23];
                var b4 = buffer[24];
                var width = 1 + (((b2 & 0x3F) << 8) | b1);
                var height = 1 + (((b4 & 0xF) << 10) | (b3 << 2) | ((b2 & 0xC0) >> 6));

                if (width <= 0 || height <= 0)
                {
                    return (0, 0, "CORRUPT_IMAGE");
                }
                return (width, height, null);
            }
            return (0, 0, "CORRUPT_IMAGE");
        }
        // VP8X (extended): "VP8X" at offset 12
        else if (buffer[12] == 0x56 && buffer[13] == 0x50 && buffer[14] == 0x38 && buffer[15] == 0x58)
        {
            if (length >= 30)
            {
                var width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
                var height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));

                if (width <= 0 || height <= 0)
                {
                    return (0, 0, "CORRUPT_IMAGE");
                }
                return (width, height, null);
            }
            return (0, 0, "CORRUPT_IMAGE");
        }

        return (0, 0, "CORRUPT_IMAGE");
    }
}
