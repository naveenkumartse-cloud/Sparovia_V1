using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sparovia.Application.AI;
using Sparovia.Application.Common.Interfaces;
using Sparovia.Application.Images;
using Sparovia.Application.WebsiteContent;
using Sparovia.Domain.Constants;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;

namespace Sparovia.Infrastructure.Images;

public class WebsiteImageService : IWebsiteImageService
{
    private readonly SparoviaDbContext _dbContext;
    private readonly IStorageProvider _storageProvider;
    private readonly IImageValidator _validator;
    private readonly IWebsiteContentService _contentService;
    private readonly IImageProcessingService _imageProcessor;
    private readonly ILogger<WebsiteImageService> _logger;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
    private const string ImageBucket = "sparovia-images";

    private static readonly HashSet<string> AllowedEnhancementOperations = new(StringComparer.OrdinalIgnoreCase)
    {
        "ImproveClarity",
        "ImproveSharpness",
        "ReduceNoise",
        "Upscale",
        "ClassicLook",
        "ModernLook",
        "WebOptimize"
    };

    private static readonly HashSet<string> ProhibitedTransformations = new(StringComparer.OrdinalIgnoreCase)
    {
        "AddObjects", "RemoveObjects", "AddBuildings", "RemoveBuildings", "AddRooms", "RemoveRooms",
        "ChangeArchitecture", "ChangeStructuralElements", "ChangeMaterials", "ChangeProducts",
        "AddPeople", "RemovePeople", "AddVehicles", "RemoveVehicles", "FabricateDetails",
        "GenerateImage", "GenerateProject", "ReplaceArchitecture", "FakePortfolio"
    };

    private static bool ContainsUnsafeContent(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return false;
        return Regex.IsMatch(text, @"<\s*script\b", RegexOptions.IgnoreCase) ||
               Regex.IsMatch(text, @"javascript:", RegexOptions.IgnoreCase) ||
               Regex.IsMatch(text, @"<[^>]+>", RegexOptions.IgnoreCase);
    }

    public WebsiteImageService(
        SparoviaDbContext dbContext,
        IStorageProvider storageProvider,
        IImageValidator validator,
        IWebsiteContentService contentService,
        IImageProcessingService imageProcessor,
        ILogger<WebsiteImageService> logger,
        Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        _dbContext = dbContext;
        _storageProvider = storageProvider;
        _validator = validator;
        _contentService = contentService;
        _imageProcessor = imageProcessor;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<List<ImageDto>> GetImagesAsync(Guid tenantId, string? usageType = null, bool includeUnused = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Images
            .AsNoTracking()
            .Include(i => i.Variants)
            .Where(i => i.TenantId == tenantId && i.Status != "Deleted");

        if (!includeUnused)
        {
            query = query.Where(i => i.Status != "Unused");
        }

        if (!string.IsNullOrWhiteSpace(usageType))
        {
            query = query.Where(i => i.UsageType == usageType);
        }

        var images = await query
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);

        return images.Select(MapToDto).ToList();
    }

    public async Task<ImageDto?> GetImageByIdAsync(Guid tenantId, Guid imageId, CancellationToken cancellationToken = default)
    {
        var image = await _dbContext.Images
            .AsNoTracking()
            .Include(i => i.Variants)
            .FirstOrDefaultAsync(i => i.Id == imageId && i.TenantId == tenantId && i.Status != "Deleted", cancellationToken);

        return image == null ? null : MapToDto(image);
    }

    public async Task<ImageOperationResult> UploadImageAsync(
        Guid tenantId,
        Stream fileStream,
        string fileName,
        string contentType,
        string usageType,
        string? slot = null,
        string? projectWorkName = null,
        string? category = null,
        string? caption = null,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        // 0. Server-side metadata validation & sanitization
        if (projectWorkName != null)
        {
            projectWorkName = projectWorkName.Trim();
            if (projectWorkName.Length > 200)
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "INVALID_METADATA",
                    ErrorMessage = "Project/Work name cannot exceed 200 characters."
                };
            }
            if (ContainsUnsafeContent(projectWorkName))
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "UNSAFE_CONTENT",
                    ErrorMessage = "HTML scripts and unsafe tags are not allowed in metadata."
                };
            }
            if (projectWorkName.Length == 0) projectWorkName = null;
        }

        if (category != null)
        {
            category = category.Trim();
            if (category.Length > 100)
            {
                category = category.Substring(0, 100);
            }
            if (ContainsUnsafeContent(category))
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "UNSAFE_CONTENT",
                    ErrorMessage = "HTML scripts and unsafe tags are not allowed in metadata."
                };
            }
            if (category.Length == 0) category = null;
        }

        if (caption != null)
        {
            caption = caption.Trim();
            if (caption.Length > 1000)
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "INVALID_METADATA",
                    ErrorMessage = "Caption cannot exceed 1000 characters."
                };
            }
            if (ContainsUnsafeContent(caption))
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "UNSAFE_CONTENT",
                    ErrorMessage = "HTML scripts and unsafe tags are not allowed in metadata."
                };
            }
            if (caption.Length == 0) caption = null;
        }

        // 1. Server-side file validation
        var valResult = _validator.Validate(fileStream, fileName, contentType);
        if (!valResult.IsValid)
        {
            _logger.LogWarning("Image upload rejected for TenantId={TenantId}: {Reason}", tenantId, valResult.ErrorMessage);
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = valResult.ErrorCode,
                ErrorMessage = valResult.ErrorMessage
            };
        }

        // 2. Resolve connected website
        var website = await _contentService.GetOrCreateConnectedWebsiteAsync(tenantId, cancellationToken);

        // 3. Generate server-controlled storage key (strictly tenant-scoped, safe from client path traversal)
        var imageId = Guid.NewGuid();
        var rawFileName = Path.GetFileName(fileName);
        var safeFileName = string.IsNullOrWhiteSpace(rawFileName) ? $"image_{imageId}{valResult.RecommendedExtension}" : rawFileName;
        var storageKey = $"tenants/{tenantId}/images/original/original_{imageId}_{DateTime.UtcNow.Ticks}{valResult.RecommendedExtension}";

        // 4. Store in storage provider (must physically succeed before DB record is committed)
        try
        {
            if (fileStream.CanSeek)
            {
                fileStream.Seek(0, SeekOrigin.Begin);
            }
            await _storageProvider.UploadAsync(ImageBucket, storageKey, fileStream, valResult.DetectedMimeType, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Storage upload failed for TenantId={TenantId}, image={ImageId}", tenantId, imageId);
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "STORAGE_UPLOAD_FAILED",
                ErrorMessage = "Failed to upload image to storage provider. Please try again."
            };
        }

        // Track category in website work categories if provided
        if (!string.IsNullOrWhiteSpace(category))
        {
            await EnsureWorkCategoryExistsAsync(tenantId, website.Id, category, cancellationToken);
        }

        // 5. Create Image domain entity with compensating delete protection
        var image = new Image
        {
            Id = imageId,
            TenantId = tenantId,
            WebsiteId = website.Id,
            StorageKey = storageKey,
            OriginalFileName = safeFileName,
            MimeType = valResult.DetectedMimeType,
            FileSize = valResult.FileSize,
            Width = valResult.Width,
            Height = valResult.Height,
            UsageType = string.Equals(usageType, "ExploreOurWork", StringComparison.OrdinalIgnoreCase) ? "ExploreOurWork" : "WebsiteImage",
            Slot = slot,
            ProjectWorkName = projectWorkName,
            Category = category,
            Caption = caption,
            Status = "Approved", // Ready for website placement
            IsActiveWebsiteUsage = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        try
        {
            _dbContext.Images.Add(image);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist Image entity. Executing compensating delete on storage key {StorageKey} for TenantId={TenantId}.", storageKey, tenantId);
            try
            {
                await _storageProvider.DeleteAsync(ImageBucket, storageKey, CancellationToken.None);
            }
            catch (Exception delEx)
            {
                _logger.LogError(delEx, "Compensating delete failed for {StorageKey}.", storageKey);
            }
            throw;
        }

        _logger.LogInformation(
            "AUDIT: ImageUploaded. TenantId={TenantId}, UserId={UserId}, ImageId={ImageId}, UsageType={UsageType}, Slot={Slot}, FileSize={FileSize}",
            tenantId, userId, imageId, image.UsageType, slot, valResult.FileSize);

        return new ImageOperationResult
        {
            Success = true,
            Image = MapToDto(image)
        };
    }

    public async Task<ImageOperationResult> ReplaceImageAsync(
        Guid tenantId,
        Guid imageId,
        Stream fileStream,
        string fileName,
        string contentType,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var existingImage = await _dbContext.Images
            .FirstOrDefaultAsync(i => i.Id == imageId && i.TenantId == tenantId, cancellationToken);

        if (existingImage == null)
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "IMAGE_NOT_FOUND",
                ErrorMessage = "The image to replace could not be found."
            };
        }

        // Validate replacement image (if validation fails, existing live image remains completely untouched!)
        var valResult = _validator.Validate(fileStream, fileName, contentType);
        if (!valResult.IsValid)
        {
            _logger.LogWarning("Image replacement rejected for TenantId={TenantId}, ImageId={ImageId}: {Reason}", tenantId, imageId, valResult.ErrorMessage);
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = valResult.ErrorCode,
                ErrorMessage = valResult.ErrorMessage
            };
        }

        // Original image is NEVER overwritten! Create a new original asset
        var newImageId = Guid.NewGuid();
        var rawFileName = Path.GetFileName(fileName);
        var safeFileName = string.IsNullOrWhiteSpace(rawFileName) ? $"image_{newImageId}{valResult.RecommendedExtension}" : rawFileName;
        var storageKey = $"tenants/{tenantId}/images/original/original_{newImageId}_{DateTime.UtcNow.Ticks}{valResult.RecommendedExtension}";

        try
        {
            if (fileStream.CanSeek)
            {
                fileStream.Seek(0, SeekOrigin.Begin);
            }
            await _storageProvider.UploadAsync(ImageBucket, storageKey, fileStream, valResult.DetectedMimeType, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Storage upload failed for TenantId={TenantId}, replacement image={ImageId}", tenantId, newImageId);
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "STORAGE_UPLOAD_FAILED",
                ErrorMessage = "Failed to upload replacement image to storage provider. Please try again."
            };
        }

        var replacementSlot = existingImage.Slot;
        if (string.IsNullOrWhiteSpace(replacementSlot) && existingImage.UsageType == "ExploreOurWork")
        {
            replacementSlot = $"replaces:{existingImage.Id}";
        }

        var newImage = new Image
        {
            Id = newImageId,
            TenantId = tenantId,
            WebsiteId = existingImage.WebsiteId,
            StorageKey = storageKey,
            OriginalFileName = safeFileName,
            MimeType = valResult.DetectedMimeType,
            FileSize = valResult.FileSize,
            Width = valResult.Width,
            Height = valResult.Height,
            UsageType = existingImage.UsageType,
            Slot = replacementSlot,
            ProjectWorkName = existingImage.ProjectWorkName,
            Category = existingImage.Category,
            Caption = existingImage.Caption,
            Status = existingImage.Status == "Published" ? "Approved" : existingImage.Status,
            IsActiveWebsiteUsage = existingImage.Status != "Published", // Active if previous was draft/unused, pending publish if previous was live
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // If existing image was NOT published, deactivate it immediately.
        // If it WAS published, it remains live until newImage is published!
        if (existingImage.Status != "Published")
        {
            existingImage.IsActiveWebsiteUsage = false;
            existingImage.Status = "Unused";
            existingImage.UpdatedAt = DateTime.UtcNow;
        }

        try
        {
            _dbContext.Images.Add(newImage);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist replacement Image entity. Executing compensating delete on storage key {StorageKey} for TenantId={TenantId}.", storageKey, tenantId);
            try
            {
                await _storageProvider.DeleteAsync(ImageBucket, storageKey, CancellationToken.None);
            }
            catch (Exception delEx)
            {
                _logger.LogError(delEx, "Compensating delete failed for {StorageKey}.", storageKey);
            }
            throw;
        }

        _logger.LogInformation(
            "AUDIT: ImageReplaced. TenantId={TenantId}, UserId={UserId}, PreviousImageId={PreviousImageId}, NewImageId={NewImageId}, Slot={Slot}",
            tenantId, userId, imageId, newImageId, newImage.Slot);

        return new ImageOperationResult
        {
            Success = true,
            Image = MapToDto(newImage)
        };
    }

    public async Task<ImageOperationResult> UpdateMetadataAsync(
        Guid tenantId,
        Guid imageId,
        string? projectWorkName,
        string? category,
        string? caption,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        // Metadata validation & sanitization
        if (projectWorkName != null)
        {
            projectWorkName = projectWorkName.Trim();
            if (projectWorkName.Length > 200)
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "INVALID_METADATA",
                    ErrorMessage = "Project/Work name cannot exceed 200 characters."
                };
            }
            if (ContainsUnsafeContent(projectWorkName))
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "UNSAFE_CONTENT",
                    ErrorMessage = "HTML scripts and unsafe tags are not allowed in metadata."
                };
            }
            if (projectWorkName.Length == 0) projectWorkName = null;
        }

        if (category != null)
        {
            category = category.Trim();
            if (category.Length > 100)
            {
                category = category.Substring(0, 100);
            }
            if (ContainsUnsafeContent(category))
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "UNSAFE_CONTENT",
                    ErrorMessage = "HTML scripts and unsafe tags are not allowed in metadata."
                };
            }
            if (category.Length == 0) category = null;
        }

        if (caption != null)
        {
            caption = caption.Trim();
            if (caption.Length > 1000)
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "INVALID_METADATA",
                    ErrorMessage = "Caption cannot exceed 1000 characters."
                };
            }
            if (ContainsUnsafeContent(caption))
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "UNSAFE_CONTENT",
                    ErrorMessage = "HTML scripts and unsafe tags are not allowed in metadata."
                };
            }
            if (caption.Length == 0) caption = null;
        }

        var image = await _dbContext.Images
            .Include(i => i.Variants)
            .FirstOrDefaultAsync(i => i.Id == imageId && i.TenantId == tenantId, cancellationToken);

        if (image == null)
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "IMAGE_NOT_FOUND",
                ErrorMessage = "The specified image was not found."
            };
        }

        image.ProjectWorkName = projectWorkName;
        image.Category = category;
        image.Caption = caption;
        image.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(category))
        {
            await EnsureWorkCategoryExistsAsync(tenantId, image.WebsiteId, category, cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Sync with public website our-work section if this is a live ExploreOurWork image
        if (image.UsageType == "ExploreOurWork" && image.Status == "Published" && image.IsActiveWebsiteUsage)
        {
            await SyncExploreOurWorkToWebsiteContentAsync(tenantId, image.WebsiteId, cancellationToken);
        }

        _logger.LogInformation(
            "AUDIT: ImageMetadataUpdated. TenantId={TenantId}, UserId={UserId}, ImageId={ImageId}",
            tenantId, userId, imageId);

        return new ImageOperationResult
        {
            Success = true,
            Image = MapToDto(image)
        };
    }

    public async Task<ImageOperationResult> ApproveImageAsync(
        Guid tenantId,
        Guid imageId,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var image = await _dbContext.Images
            .Include(i => i.Variants)
            .FirstOrDefaultAsync(i => i.Id == imageId && i.TenantId == tenantId, cancellationToken);

        if (image == null)
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "IMAGE_NOT_FOUND",
                ErrorMessage = "The specified image was not found."
            };
        }

        image.Status = "Approved";
        image.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: ImageApproved. TenantId={TenantId}, UserId={UserId}, ImageId={ImageId}",
            tenantId, userId, imageId);

        return new ImageOperationResult
        {
            Success = true,
            Image = MapToDto(image)
        };
    }

    public async Task<ImageOperationResult> RejectImageAsync(
        Guid tenantId,
        Guid imageId,
        string? reason = null,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var image = await _dbContext.Images
            .Include(i => i.Variants)
            .FirstOrDefaultAsync(i => i.Id == imageId && i.TenantId == tenantId, cancellationToken);

        if (image == null)
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "IMAGE_NOT_FOUND",
                ErrorMessage = "The specified image was not found."
            };
        }

        image.Status = "Rejected";
        image.IsActiveWebsiteUsage = false;
        image.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: ImageRejected. TenantId={TenantId}, UserId={UserId}, ImageId={ImageId}, Reason={Reason}",
            tenantId, userId, imageId, reason);

        return new ImageOperationResult
        {
            Success = true,
            Image = MapToDto(image)
        };
    }

    public async Task<ImagePreviewDto?> GetImagePreviewAsync(Guid tenantId, Guid imageId, CancellationToken cancellationToken = default)
    {
        var image = await _dbContext.Images
            .AsNoTracking()
            .Include(i => i.Variants)
            .FirstOrDefaultAsync(i => i.Id == imageId && i.TenantId == tenantId && i.Status != "Deleted", cancellationToken);

        if (image == null) return null;

        var activeVariant = image.Variants
            .Where(v => v.Status is "Approved" or "Published")
            .OrderByDescending(v => v.CreatedAt)
            .FirstOrDefault();

        return new ImagePreviewDto
        {
            Id = image.Id,
            UsageType = image.UsageType,
            Slot = image.Slot,
            Status = image.Status,
            Width = image.Width,
            Height = image.Height,
            FileSize = image.FileSize,
            MimeType = image.MimeType,
            OriginalFileName = image.OriginalFileName,
            ProjectWorkName = image.ProjectWorkName,
            Category = image.Category,
            Caption = image.Caption,
            PreviewUrl = GeneratePreviewUrl(image.Id, image.TenantId),
            ActiveVariant = activeVariant != null ? MapVariantDto(activeVariant, image.TenantId) : null,
            CreatedAt = image.CreatedAt
        };
    }

    public async Task<ImageOperationResult> PublishImageAsync(
        Guid tenantId,
        Guid imageId,
        Guid? variantId = null,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var image = await _dbContext.Images
            .Include(i => i.Variants)
            .FirstOrDefaultAsync(i => i.Id == imageId && i.TenantId == tenantId, cancellationToken);

        if (image == null)
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "IMAGE_NOT_FOUND",
                ErrorMessage = "The specified image was not found."
            };
        }

        if (image.Status is not ("Approved" or "Published"))
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "IMAGE_NOT_APPROVED",
                ErrorMessage = "Image must be approved before it can be published to the website."
            };
        }

        ImageVariant? targetVariant = null;
        if (variantId.HasValue)
        {
            targetVariant = image.Variants.FirstOrDefault(v => v.Id == variantId.Value);
            if (targetVariant == null)
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "VARIANT_NOT_FOUND",
                    ErrorMessage = "The specified variant was not found on this image."
                };
            }

            if (targetVariant.Status is not ("Approved" or "Published"))
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "VARIANT_NOT_APPROVED",
                    ErrorMessage = "Only approved image variants can be published to the website."
                };
            }

            targetVariant.Status = "Published";
            targetVariant.UpdatedAt = DateTime.UtcNow;

            foreach (var other in image.Variants.Where(v => v.Id != targetVariant.Id && v.Status == "Published"))
            {
                other.Status = "Approved";
                other.UpdatedAt = DateTime.UtcNow;
            }
        }
        else
        {
            var optVariant = image.Variants
                .Where(v => v.VariantType == "WebsiteOptimized" && (v.Status == "Approved" || v.Status == "Published"))
                .OrderByDescending(v => v.CreatedAt)
                .FirstOrDefault();

            if (optVariant != null)
            {
                targetVariant = optVariant;
                targetVariant.Status = "Published";
                targetVariant.UpdatedAt = DateTime.UtcNow;

                foreach (var other in image.Variants.Where(v => v.Id != targetVariant.Id && v.Status == "Published"))
                {
                    other.Status = "Approved";
                    other.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        image.Status = "Published";
        image.IsActiveWebsiteUsage = true;
        image.UpdatedAt = DateTime.UtcNow;

        // If this image replaces another image (e.g. for ExploreOurWork)
        if (!string.IsNullOrWhiteSpace(image.Slot) && image.Slot.StartsWith("replaces:"))
        {
            if (Guid.TryParse(image.Slot["replaces:".Length..], out var oldId))
            {
                var oldImg = await _dbContext.Images.FirstOrDefaultAsync(i => i.Id == oldId && i.TenantId == tenantId, cancellationToken);
                if (oldImg != null)
                {
                    oldImg.IsActiveWebsiteUsage = false;
                    oldImg.Status = "Unused";
                    oldImg.UpdatedAt = DateTime.UtcNow;
                }
            }
            image.Slot = null; // Clean up replacement slot marker
        }
        else if (!string.IsNullOrWhiteSpace(image.Slot))
        {
            // If this image has a slot, demote previous published images in the same slot
            var otherImagesInSlot = await _dbContext.Images
                .Where(i => i.TenantId == tenantId && i.Slot == image.Slot && i.Id != image.Id && i.Status == "Published")
                .ToListAsync(cancellationToken);

            foreach (var other in otherImagesInSlot)
            {
                other.Status = "Approved";
                other.UpdatedAt = DateTime.UtcNow;
            }

            // Sync with WebsiteContent draft & published for standard sections
            await SyncImageToWebsiteContentAsync(tenantId, image, targetVariant, cancellationToken);
        }

        if (image.UsageType == "ExploreOurWork")
        {
            await SyncExploreOurWorkToWebsiteContentAsync(tenantId, image.WebsiteId, cancellationToken);
        }

        var website = await _dbContext.Websites.FirstOrDefaultAsync(w => w.Id == image.WebsiteId, cancellationToken);
        if (website != null)
        {
            website.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: ImagePublished. TenantId={TenantId}, UserId={UserId}, ImageId={ImageId}, VariantId={VariantId}, Slot={Slot}",
            tenantId, userId, imageId, variantId, image.Slot);

        return new ImageOperationResult
        {
            Success = true,
            Image = MapToDto(image),
            Variant = targetVariant != null ? MapVariantDto(targetVariant) : null
        };
    }

    public async Task<ImageOperationResult> RemoveFromWebsiteUsageAsync(
        Guid tenantId,
        Guid imageId,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var image = await _dbContext.Images
            .Include(i => i.Variants)
            .FirstOrDefaultAsync(i => i.Id == imageId && i.TenantId == tenantId, cancellationToken);

        if (image == null)
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "IMAGE_NOT_FOUND",
                ErrorMessage = "The specified image was not found."
            };
        }

        // Safe removal: Deactivate from active usage, set status to Unused. Original remains preserved!
        image.IsActiveWebsiteUsage = false;
        image.Status = "Unused";
        image.UpdatedAt = DateTime.UtcNow;

        // Clean up from standard website content if referenced in a slot
        await ClearImageFromWebsiteContentAsync(tenantId, image, cancellationToken);

        if (image.UsageType == "ExploreOurWork")
        {
            await SyncExploreOurWorkToWebsiteContentAsync(tenantId, image.WebsiteId, cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: ImageRemovedFromWebsiteUsage. TenantId={TenantId}, UserId={UserId}, ImageId={ImageId}",
            tenantId, userId, imageId);

        return new ImageOperationResult
        {
            Success = true,
            Image = MapToDto(image)
        };
    }

    public async Task<ImageAnalysisResult> AnalyzeImageAsync(Guid tenantId, Guid imageId, CancellationToken cancellationToken = default)
    {
        var image = await _dbContext.Images
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == imageId && i.TenantId == tenantId && i.Status != "Deleted", cancellationToken);

        if (image == null)
        {
            throw new KeyNotFoundException($"Image with ID {imageId} not found.");
        }

        var stream = await _storageProvider.DownloadAsync(ImageBucket, image.StorageKey, cancellationToken);
        return await _imageProcessor.AnalyzeImageAsync(stream, image.FileSize, image.MimeType, cancellationToken);
    }

    public async Task<ImageOperationResult> ProcessQualityStudioAsync(
        Guid tenantId,
        Guid imageId,
        QualityStudioProcessRequest request,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        request ??= new QualityStudioProcessRequest();

        var preset = string.IsNullOrWhiteSpace(request.Preset) ? "Balanced" : request.Preset.Trim();
        var validPresets = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Light", "Balanced", "High", "Custom" };
        if (!validPresets.Contains(preset))
        {
            preset = "Balanced";
        }
        request.Preset = preset;

        // Clamp parameters safely
        if (request.Brightness.HasValue) request.Brightness = Math.Clamp(request.Brightness.Value, -50, 50);
        if (request.Contrast.HasValue) request.Contrast = Math.Clamp(request.Contrast.Value, -50, 50);
        if (request.Sharpness.HasValue) request.Sharpness = Math.Clamp(request.Sharpness.Value, 0, 100);
        if (request.NoiseReduction.HasValue) request.NoiseReduction = Math.Clamp(request.NoiseReduction.Value, 0, 100);
        if (request.Saturation.HasValue) request.Saturation = Math.Clamp(request.Saturation.Value, -50, 50);

        var image = await _dbContext.Images
            .Include(i => i.Variants)
            .FirstOrDefaultAsync(i => i.Id == imageId && i.TenantId == tenantId && i.Status != "Deleted", cancellationToken);

        if (image == null)
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "IMAGE_NOT_FOUND",
                ErrorMessage = "The specified image was not found."
            };
        }

        // Original image is NEVER modified. Download original stream (read-only)
        Stream originalStream;
        try
        {
            originalStream = await _storageProvider.DownloadAsync(ImageBucket, image.StorageKey, cancellationToken);
            if (originalStream == null || (originalStream.CanSeek && originalStream.Length == 0))
            {
                _logger.LogError("Downloaded stream for original image {ImageId} ({StorageKey}) is empty or null.", imageId, image.StorageKey);
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "IMAGE_RETRIEVAL_FAILED",
                    ErrorMessage = "Failed to retrieve the original image file from storage. The file appears to be missing or corrupted."
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download original image {ImageId} from storage {StorageKey}", imageId, image.StorageKey);
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "IMAGE_RETRIEVAL_FAILED",
                ErrorMessage = "Failed to retrieve the original image file from storage."
            };
        }

        var options = new ImageProcessingOptions
        {
            Preset = request.Preset,
            Brightness = request.Brightness,
            Contrast = request.Contrast,
            Sharpness = request.Sharpness,
            NoiseReduction = request.NoiseReduction,
            Saturation = request.Saturation
        };

        ProcessedImageResult processedResult;
        try
        {
            using (originalStream)
            {
                processedResult = await _imageProcessor.ProcessImageAsync(
                    originalStream,
                    $"QualityStudio:{request.Preset}",
                    options,
                    cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed QualityStudio processing for image {ImageId} with preset {Preset}", imageId, request.Preset);
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "PROCESSING_FAILED",
                ErrorMessage = $"Failed to process image in Quality Studio: {ex.Message}"
            };
        }

        // Output Result Validation
        if (processedResult.FileSize <= 0 || processedResult.Width <= 0 || processedResult.Height <= 0 || processedResult.Bytes.Length == 0)
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "RESULT_VALIDATION_FAILED",
                ErrorMessage = "The processed image output failed integrity validation. Original image remains preserved."
            };
        }

        var variantId = Guid.NewGuid();
        var variantStorageKey = $"tenants/{tenantId}/websites/{image.WebsiteId}/images/{imageId}/variants/{variantId}/quality_studio{processedResult.FileExtension}";

        // Store variant bytes in Supabase Storage
        using (var uploadStream = new MemoryStream(processedResult.Bytes))
        {
            await _storageProvider.UploadAsync(ImageBucket, variantStorageKey, uploadStream, processedResult.MimeType, cancellationToken);
        }

        var variant = new ImageVariant
        {
            Id = variantId,
            TenantId = tenantId,
            ImageId = imageId,
            VariantType = "QualityStudio",
            Operation = $"QualityStudio:{request.Preset}",
            StorageKey = variantStorageKey,
            MimeType = processedResult.MimeType,
            FileSize = processedResult.FileSize,
            Width = processedResult.Width,
            Height = processedResult.Height,
            Version = image.Variants.Count + 1,
            Status = "Enhanced", // Ready for human Before/After review
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.ImageVariants.Add(variant);

        // Audit deterministic processing operation for tracking and review status lifecycle
        var aiRequest = new AIRequest
        {
            TenantId = tenantId,
            UserId = userId,
            OperationType = $"QualityStudio:{request.Preset}",
            ResourceType = "Image",
            ResourceId = imageId,
            Status = AIRequestStatus.Succeeded,
            ReviewStatus = AIReviewStatus.PendingReview,
            ProviderReference = "Deterministic",
            ModelReference = "QualityStudio",
            OutputText = processedResult.EffectiveProfile != null 
                ? $"{processedResult.EffectiveProfile}|{string.Join(";", processedResult.AppliedCorrections)}"
                : null,
            ContextVersion = processedResult.AlgorithmVersion,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };
        _dbContext.AIRequests.Add(aiRequest);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist QualityStudio variant. Executing compensating delete on {StorageKey}", variantStorageKey);
            try { await _storageProvider.DeleteAsync(ImageBucket, variantStorageKey, CancellationToken.None); } catch { }
            throw;
        }

        _logger.LogInformation(
            "AUDIT: ImageQualityStudioProcessed. TenantId={TenantId}, UserId={UserId}, ImageId={ImageId}, VariantId={VariantId}, Preset={Preset}",
            tenantId, userId, imageId, variantId, request.Preset);

        var variantDto = MapVariantDto(variant, tenantId);
        variantDto.AlgorithmVersion = processedResult.AlgorithmVersion;
        variantDto.EffectiveProfile = processedResult.EffectiveProfile;
        variantDto.AppliedCorrections = processedResult.AppliedCorrections;

        return new ImageOperationResult
        {
            Success = true,
            Image = MapToDto(image),
            Variant = variantDto
        };
    }

    public async Task<ImageOperationResult> EnhanceImageAsync(
        Guid tenantId,
        Guid imageId,
        string operation,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var image = await _dbContext.Images
            .Include(i => i.Variants)
            .FirstOrDefaultAsync(i => i.Id == imageId && i.TenantId == tenantId, cancellationToken);

        if (image == null)
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "IMAGE_NOT_FOUND",
                ErrorMessage = "The specified image was not found."
            };
        }

        if (ProhibitedTransformations.Contains(operation))
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "PROHIBITED_TRANSFORMATION",
                ErrorMessage = "This transformation is prohibited. Image Enhancement strictly improves quality, not reality. Generative alterations, object additions/removals, or architectural replacements are not permitted."
            };
        }

        if (!AllowedEnhancementOperations.Contains(operation))
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "UNSUPPORTED_OPERATION",
                ErrorMessage = $"The enhancement operation '{operation}' is not supported."
            };
        }

        // WebOptimize is deterministic optimization
        if (string.Equals(operation, "WebOptimize", StringComparison.OrdinalIgnoreCase))
        {
            return await OptimizeImageAsync(tenantId, imageId, null, "webp", 1200, null, userId, cancellationToken);
        }

        // Idempotency: Protect against rapid double-clicks / repeated submissions
        var recentVariant = image.Variants
            .Where(v => string.Equals(v.Operation, operation, StringComparison.OrdinalIgnoreCase) && v.CreatedAt >= DateTime.UtcNow.AddSeconds(-15))
            .OrderByDescending(v => v.CreatedAt)
            .FirstOrDefault();

        if (recentVariant != null)
        {
            _logger.LogInformation("Idempotency: Reusing recent {Operation} variant {VariantId} for ImageId {ImageId}", operation, recentVariant.Id, imageId);
            return new ImageOperationResult
            {
                Success = true,
                Image = MapToDto(image),
                Variant = MapVariantDto(recentVariant, tenantId)
            };
        }

        // Original image is NEVER overwritten! Create a derived variant via deterministic server-side processing
        var variantId = Guid.NewGuid();

        // Download original stream (read-only)
        var originalStream = await _storageProvider.DownloadAsync(ImageBucket, image.StorageKey, cancellationToken);

        ProcessedImageResult processedResult;
        try
        {
            processedResult = await _imageProcessor.ProcessImageAsync(originalStream, operation, null, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed deterministic processing for operation {Operation} on image {ImageId}", operation, imageId);
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "PROCESSING_FAILED",
                ErrorMessage = $"Failed to process image with operation '{operation}': {ex.Message}"
            };
        }

        // Output Result Validation
        if (processedResult.FileSize <= 0 || processedResult.Width <= 0 || processedResult.Height <= 0 || processedResult.Bytes.Length == 0)
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "RESULT_VALIDATION_FAILED",
                ErrorMessage = "The enhanced image output failed integrity validation. Original image remains preserved."
            };
        }

        var variantStorageKey = $"tenants/{tenantId}/websites/{image.WebsiteId}/images/{imageId}/variants/{variantId}/{operation.ToLowerInvariant()}{processedResult.FileExtension}";

        // Store enhanced variant bytes
        using var uploadStream = new MemoryStream(processedResult.Bytes);
        await _storageProvider.UploadAsync(ImageBucket, variantStorageKey, uploadStream, processedResult.MimeType, cancellationToken);

        var variant = new ImageVariant
        {
            Id = variantId,
            TenantId = tenantId,
            ImageId = imageId,
            VariantType = "AIEnhanced",
            Operation = operation,
            StorageKey = variantStorageKey,
            MimeType = processedResult.MimeType,
            FileSize = processedResult.FileSize,
            Width = processedResult.Width,
            Height = processedResult.Height,
            Version = image.Variants.Count + 1,
            Status = "Enhanced", // Ready for human Before/After review
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.ImageVariants.Add(variant);

        // Audit as AIRequest for tracking and review status lifecycle
        var aiConfig = await _dbContext.TenantAIConfigurations
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == tenantId, cancellationToken);

        var aiRequest = new AIRequest
        {
            TenantId = tenantId,
            UserId = userId,
            OperationType = operation,
            ResourceType = "Image",
            ResourceId = imageId,
            Status = AIRequestStatus.Succeeded,
            ReviewStatus = AIReviewStatus.PendingReview,
            ProviderReference = aiConfig?.ProviderKey ?? "Deterministic",
            ModelReference = aiConfig?.SelectedModelKey ?? "BuiltIn",
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };
        _dbContext.AIRequests.Add(aiRequest);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist enhanced variant. Executing compensating delete on {StorageKey}", variantStorageKey);
            try { await _storageProvider.DeleteAsync(ImageBucket, variantStorageKey, CancellationToken.None); } catch { }
            throw;
        }

        _logger.LogInformation(
            "AUDIT: ImageEnhancementRequested. TenantId={TenantId}, UserId={UserId}, ImageId={ImageId}, VariantId={VariantId}, Operation={Operation}",
            tenantId, userId, imageId, variantId, operation);

        return new ImageOperationResult
        {
            Success = true,
            Image = MapToDto(image),
            Variant = MapVariantDto(variant, tenantId)
        };
    }

    public async Task<ImageOperationResult> OptimizeImageAsync(
        Guid tenantId,
        Guid imageId,
        Guid? parentVariantId = null,
        string? targetFormat = null,
        int? maxWidth = null,
        int? maxHeight = null,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var image = await _dbContext.Images
            .Include(i => i.Variants)
            .FirstOrDefaultAsync(i => i.Id == imageId && i.TenantId == tenantId, cancellationToken);

        if (image == null)
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "IMAGE_NOT_FOUND",
                ErrorMessage = "The specified image was not found."
            };
        }

        ImageVariant? parentVariant = null;
        if (parentVariantId.HasValue)
        {
            parentVariant = await _dbContext.ImageVariants
                .FirstOrDefaultAsync(v => v.Id == parentVariantId.Value, cancellationToken);

            if (parentVariant == null)
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "PARENT_VARIANT_NOT_FOUND",
                    ErrorMessage = "The specified parent variant was not found."
                };
            }

            if (parentVariant.TenantId != tenantId)
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "CROSS_TENANT_PARENT_REJECTED",
                    ErrorMessage = "Parent variant does not belong to this tenant."
                };
            }

            if (parentVariant.ImageId != imageId)
            {
                return new ImageOperationResult
                {
                    Success = false,
                    ErrorCode = "CROSS_IMAGE_PARENT_REJECTED",
                    ErrorMessage = "Parent variant does not belong to the specified image."
                };
            }
        }

        var sourceStorageKey = parentVariant?.StorageKey ?? image.StorageKey;
        var limitWidth = maxWidth ?? 1200;

        var format = string.Equals(targetFormat, "jpeg", StringComparison.OrdinalIgnoreCase) || string.Equals(targetFormat, "jpg", StringComparison.OrdinalIgnoreCase)
            ? "jpeg"
            : "webp";

        // Read source stream (read-only, never mutates original!)
        var sourceStream = await _storageProvider.DownloadAsync(ImageBucket, sourceStorageKey, cancellationToken);

        ProcessedImageResult processedResult;
        try
        {
            processedResult = await _imageProcessor.ProcessImageAsync(
                sourceStream,
                "WebOptimize",
                new ImageProcessingOptions
                {
                    MaxWidth = limitWidth,
                    TargetFormat = format,
                    Quality = 82
                },
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to optimize image {ImageId}", imageId);
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "OPTIMIZATION_FAILED",
                ErrorMessage = $"Failed to optimize image: {ex.Message}"
            };
        }

        var variantId = Guid.NewGuid();
        var storageKey = $"tenants/{tenantId}/websites/{image.WebsiteId}/images/{imageId}/variants/{variantId}/optimized_{DateTime.UtcNow.Ticks}{processedResult.FileExtension}";

        using var uploadStream = new MemoryStream(processedResult.Bytes);
        await _storageProvider.UploadAsync(ImageBucket, storageKey, uploadStream, processedResult.MimeType, cancellationToken);

        var variant = new ImageVariant
        {
            Id = variantId,
            TenantId = tenantId,
            ImageId = imageId,
            ParentVariantId = parentVariantId,
            VariantType = "WebsiteOptimized",
            Operation = "WebOptimize",
            StorageKey = storageKey,
            MimeType = processedResult.MimeType,
            FileSize = processedResult.FileSize,
            Width = processedResult.Width,
            Height = processedResult.Height,
            Version = image.Variants.Count + 1,
            Status = "Approved", // Ready for publication
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.ImageVariants.Add(variant);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist optimized variant. Executing compensating delete on {StorageKey}", storageKey);
            try { await _storageProvider.DeleteAsync(ImageBucket, storageKey, CancellationToken.None); } catch { }
            throw;
        }

        _logger.LogInformation(
            "AUDIT: ImageOptimized. TenantId={TenantId}, UserId={UserId}, ImageId={ImageId}, VariantId={VariantId}, ParentVariantId={ParentVariantId}",
            tenantId, userId, imageId, variantId, parentVariantId);

        return new ImageOperationResult
        {
            Success = true,
            Image = MapToDto(image),
            Variant = MapVariantDto(variant, tenantId)
        };
    }

    public Task<ImageOperationResult> ApproveEnhancementAsync(
        Guid tenantId,
        Guid imageId,
        Guid variantId,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        return ReviewVariantAsync(tenantId, imageId, variantId, isApproved: true, reason: null, userId: userId, cancellationToken: cancellationToken);
    }

    public Task<ImageOperationResult> RejectEnhancementAsync(
        Guid tenantId,
        Guid imageId,
        Guid variantId,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        return ReviewVariantAsync(tenantId, imageId, variantId, isApproved: false, reason: "User discarded variant in review", userId: userId, cancellationToken: cancellationToken);
    }

    public async Task<ImageOperationResult> ReviewVariantAsync(
        Guid tenantId,
        Guid imageId,
        Guid variantId,
        bool isApproved,
        string? reason = null,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var variant = await _dbContext.ImageVariants
            .Include(v => v.Image)
            .FirstOrDefaultAsync(v => v.Id == variantId && v.ImageId == imageId && v.TenantId == tenantId, cancellationToken);

        if (variant == null)
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "VARIANT_NOT_FOUND",
                ErrorMessage = "The specified variant was not found."
            };
        }

        if (variant.Status is "Processing")
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "INVALID_STATE_TRANSITION",
                ErrorMessage = "Enhancement is still processing and is not ready for review."
            };
        }

        if (variant.Status is "Failed")
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "INVALID_STATE_TRANSITION",
                ErrorMessage = "Failed enhancement cannot be approved or reviewed."
            };
        }

        if (variant.Status is "Published")
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "INVALID_STATE_TRANSITION",
                ErrorMessage = "A published variant cannot be reviewed or rejected directly. Remove it from website usage first."
            };
        }

        if (isApproved && variant.Status == "Rejected")
        {
            return new ImageOperationResult
            {
                Success = false,
                ErrorCode = "INVALID_STATE_TRANSITION",
                ErrorMessage = "A rejected enhancement cannot be approved."
            };
        }

        // Idempotency: if already in the target state
        if ((isApproved && variant.Status == "Approved") || (!isApproved && variant.Status == "Rejected"))
        {
            return new ImageOperationResult
            {
                Success = true,
                Image = variant.Image != null ? MapToDto(variant.Image) : null,
                Variant = MapVariantDto(variant)
            };
        }

        variant.Status = isApproved ? "Approved" : "Rejected";
        variant.UpdatedAt = DateTime.UtcNow;

        var linkedAiRequest = await _dbContext.AIRequests
            .Where(r => r.TenantId == tenantId && r.ResourceType == "Image" && r.ResourceId == imageId && r.ReviewStatus == AIReviewStatus.PendingReview)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (linkedAiRequest != null)
        {
            linkedAiRequest.ReviewStatus = isApproved ? AIReviewStatus.Accepted : AIReviewStatus.Rejected;
            linkedAiRequest.CompletedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: ImageVariantReviewed. TenantId={TenantId}, UserId={UserId}, ImageId={ImageId}, VariantId={VariantId}, IsApproved={IsApproved}, Reason={Reason}",
            tenantId, userId, imageId, variantId, isApproved, reason);

        return new ImageOperationResult
        {
            Success = true,
            Image = variant.Image != null ? MapToDto(variant.Image) : null,
            Variant = MapVariantDto(variant)
        };
    }

    public async Task<VariantReviewDto?> GetVariantReviewAsync(
        Guid tenantId,
        Guid imageId,
        Guid variantId,
        CancellationToken cancellationToken = default)
    {
        var variant = await _dbContext.ImageVariants
            .AsNoTracking()
            .Include(v => v.Image)
            .FirstOrDefaultAsync(v => v.Id == variantId && v.ImageId == imageId && v.TenantId == tenantId, cancellationToken);

        if (variant == null || variant.Image == null) return null;

        var img = variant.Image;
        return new VariantReviewDto
        {
            ImageId = img.Id,
            VariantId = variant.Id,
            Operation = variant.Operation ?? "Enhancement",
            Status = variant.Status,
            CanApprove = variant.Status is "Enhanced" or "ReadyForReview",
            CanReject = variant.Status is "Enhanced" or "ReadyForReview",
            Before = new ImageBeforeReviewDto
            {
                Id = img.Id,
                OriginalFileName = img.OriginalFileName,
                PreviewUrl = GeneratePreviewUrl(img.Id, img.TenantId),
                Width = img.Width,
                Height = img.Height,
                FileSize = img.FileSize,
                MimeType = img.MimeType,
                Label = "Original Client Photograph"
            },
            After = new ImageAfterReviewDto
            {
                Id = variant.Id,
                PreviewUrl = GenerateVariantPreviewUrl(img.Id, variant.Id, img.TenantId),
                Width = variant.Width,
                Height = variant.Height,
                FileSize = variant.FileSize,
                MimeType = variant.MimeType,
                Status = variant.Status,
                Operation = variant.Operation ?? "Enhancement",
                Label = variant.VariantType == "WebsiteOptimized" ? "Web-Optimized Representation" : "AI Enhanced Variant"
            }
        };
    }

    private static ImageFileStreamResult GenerateFallbackSvg(string title, string? usageType)
    {
        var displayTitle = string.IsNullOrWhiteSpace(title) ? "Sparovia Media" : title;
        var svg = $@"<svg xmlns=""http://www.w3.org/2000/svg"" width=""800"" height=""600"" viewBox=""0 0 800 600"">
  <rect width=""800"" height=""600"" fill=""#f8fafc""/>
  <rect x=""40"" y=""40"" width=""720"" height=""520"" rx=""16"" fill=""#f1f5f9"" stroke=""#cbd5e1"" stroke-width=""2"" stroke-dasharray=""8 8""/>
  <circle cx=""400"" cy=""260"" r=""48"" fill=""#e2e8f0""/>
  <path d=""M384 276 L396 260 L408 272 L416 264 L428 276 Z"" fill=""#94a3b8""/>
  <circle cx=""390"" cy=""248"" r=""4"" fill=""#94a3b8""/>
  <text x=""400"" y=""350"" dominant-baseline=""middle"" text-anchor=""middle"" font-family=""system-ui, -apple-system, sans-serif"" font-size=""20"" font-weight=""600"" fill=""#475569"">{System.Security.SecurityElement.Escape(displayTitle)}</text>
  <text x=""400"" y=""385"" dominant-baseline=""middle"" text-anchor=""middle"" font-family=""system-ui, -apple-system, sans-serif"" font-size=""14"" fill=""#94a3b8"">{System.Security.SecurityElement.Escape(usageType ?? "Project Image")}</text>
</svg>";
        var bytes = System.Text.Encoding.UTF8.GetBytes(svg);
        return new ImageFileStreamResult
        {
            Stream = new MemoryStream(bytes),
            ContentType = "image/svg+xml",
            FileName = "preview.svg"
        };
    }

    public async Task<ImageFileStreamResult?> GetImageFileAsync(
        Guid? tenantId,
        Guid imageId,
        Guid? variantId = null,
        bool isPublicRequest = false,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Images
            .AsNoTracking()
            .Include(i => i.Variants)
            .Where(i => i.Id == imageId && i.Status != "Deleted");

        if (isPublicRequest)
        {
            // Public website can only consume Published images that are active in website usage
            query = query.Where(i => i.Status == "Published" && i.IsActiveWebsiteUsage);
        }
        else if (tenantId.HasValue)
        {
            query = query.Where(i => i.TenantId == tenantId.Value);
        }
        else
        {
            return null;
        }

        var image = await query.FirstOrDefaultAsync(cancellationToken);
        if (image == null) return null;

        if (variantId.HasValue)
        {
            var variant = image.Variants.FirstOrDefault(v => v.Id == variantId.Value);
            if (variant == null) return null;
            if (isPublicRequest && variant.Status != "Published") return null;

            var variantStream = await _storageProvider.DownloadAsync(ImageBucket, variant.StorageKey, cancellationToken);
            if (variantStream == null || (variantStream.CanSeek && variantStream.Length == 0))
            {
                return GenerateFallbackSvg(image.ProjectWorkName ?? image.OriginalFileName ?? "Project Image", image.UsageType);
            }

            var ext = variant.MimeType == "image/webp" ? ".webp" : (variant.MimeType == "image/jpeg" ? ".jpg" : ".png");
            return new ImageFileStreamResult
            {
                Stream = variantStream,
                ContentType = variant.MimeType,
                FileName = $"variant_{variant.Id}{ext}"
            };
        }

        var publishedVariant = image.Variants.FirstOrDefault(v => v.Status == "Published");
        if (publishedVariant != null)
        {
            var variantStream = await _storageProvider.DownloadAsync(ImageBucket, publishedVariant.StorageKey, cancellationToken);
            if (variantStream != null && (!variantStream.CanSeek || variantStream.Length > 0))
            {
                var ext = publishedVariant.MimeType == "image/webp" ? ".webp" : (publishedVariant.MimeType == "image/jpeg" ? ".jpg" : ".png");
                return new ImageFileStreamResult
                {
                    Stream = variantStream,
                    ContentType = publishedVariant.MimeType,
                    FileName = $"variant_{publishedVariant.Id}{ext}"
                };
            }
        }

        var originalStream = await _storageProvider.DownloadAsync(ImageBucket, image.StorageKey, cancellationToken);
        if (originalStream == null || (originalStream.CanSeek && originalStream.Length == 0))
        {
            return GenerateFallbackSvg(image.ProjectWorkName ?? image.OriginalFileName ?? "Project Image", image.UsageType);
        }

        return new ImageFileStreamResult
        {
            Stream = originalStream,
            ContentType = image.MimeType,
            FileName = image.OriginalFileName ?? $"image_{image.Id}.bin"
        };
    }

    public Task<ImageOperationResult> DeleteImageAsync(
        Guid tenantId,
        Guid imageId,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        return RemoveFromWebsiteUsageAsync(tenantId, imageId, userId, cancellationToken);
    }

    public async Task<BulkImageOperationResult> BulkDeleteImagesAsync(
        Guid tenantId,
        List<Guid> imageIds,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        if (imageIds == null || imageIds.Count == 0)
        {
            return new BulkImageOperationResult
            {
                Success = true,
                AffectedCount = 0,
                Message = "No images specified for deletion."
            };
        }

        var uniqueIds = imageIds.Distinct().ToList();
        var images = await _dbContext.Images
            .Include(i => i.Variants)
            .Where(i => i.TenantId == tenantId && uniqueIds.Contains(i.Id) && i.Status != "Deleted")
            .ToListAsync(cancellationToken);

        var succeeded = new List<Guid>();
        var failed = new List<Guid>();

        bool syncExploreNeeded = false;
        Guid? websiteId = null;

        foreach (var id in uniqueIds)
        {
            var image = images.FirstOrDefault(i => i.Id == id);
            if (image == null)
            {
                failed.Add(id);
                continue;
            }

            try
            {
                websiteId = image.WebsiteId;
                image.IsActiveWebsiteUsage = false;
                image.Status = "Unused";
                image.UpdatedAt = DateTime.UtcNow;

                await ClearImageFromWebsiteContentAsync(tenantId, image, cancellationToken);

                if (image.UsageType == "ExploreOurWork")
                {
                    syncExploreNeeded = true;
                }

                succeeded.Add(id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to remove image {ImageId} in bulk delete for tenant {TenantId}", id, tenantId);
                failed.Add(id);
            }
        }

        if (syncExploreNeeded && websiteId.HasValue)
        {
            await SyncExploreOurWorkToWebsiteContentAsync(tenantId, websiteId.Value, cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: BulkImagesDeleted. TenantId={TenantId}, UserId={UserId}, SucceededCount={SucceededCount}, FailedCount={FailedCount}",
            tenantId, userId, succeeded.Count, failed.Count);

        return new BulkImageOperationResult
        {
            Success = succeeded.Count > 0 || failed.Count == 0,
            AffectedCount = succeeded.Count,
            SucceededIds = succeeded,
            FailedIds = failed,
            Message = $"Successfully deleted {succeeded.Count} images."
        };
    }

    public async Task<BulkImageOperationResult> BulkPublishImagesAsync(
        Guid tenantId,
        List<Guid> imageIds,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        if (imageIds == null || imageIds.Count == 0)
        {
            return new BulkImageOperationResult
            {
                Success = true,
                AffectedCount = 0,
                Message = "No images specified for publishing."
            };
        }

        var uniqueIds = imageIds.Distinct().ToList();
        var images = await _dbContext.Images
            .Include(i => i.Variants)
            .Where(i => i.TenantId == tenantId && uniqueIds.Contains(i.Id) && i.Status != "Deleted")
            .ToListAsync(cancellationToken);

        var succeeded = new List<Guid>();
        var failed = new List<Guid>();

        bool syncExploreNeeded = false;
        Guid? websiteId = null;

        foreach (var id in uniqueIds)
        {
            var image = images.FirstOrDefault(i => i.Id == id);
            if (image == null)
            {
                failed.Add(id);
                continue;
            }

            try
            {
                websiteId = image.WebsiteId;

                var optVariant = image.Variants
                    .Where(v => v.VariantType == "WebsiteOptimized" && (v.Status == "Approved" || v.Status == "Published"))
                    .OrderByDescending(v => v.CreatedAt)
                    .FirstOrDefault();

                if (optVariant != null)
                {
                    optVariant.Status = "Published";
                    optVariant.UpdatedAt = DateTime.UtcNow;

                    foreach (var other in image.Variants.Where(v => v.Id != optVariant.Id && v.Status == "Published"))
                    {
                        other.Status = "Approved";
                        other.UpdatedAt = DateTime.UtcNow;
                    }
                }

                image.Status = "Published";
                image.IsActiveWebsiteUsage = true;
                image.UpdatedAt = DateTime.UtcNow;

                if (!string.IsNullOrWhiteSpace(image.Slot) && image.Slot.StartsWith("replaces:"))
                {
                    if (Guid.TryParse(image.Slot["replaces:".Length..], out var oldId))
                    {
                        var oldImg = await _dbContext.Images.FirstOrDefaultAsync(i => i.Id == oldId && i.TenantId == tenantId, cancellationToken);
                        if (oldImg != null)
                        {
                            oldImg.IsActiveWebsiteUsage = false;
                            oldImg.Status = "Unused";
                            oldImg.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                    image.Slot = null;
                }
                else if (!string.IsNullOrWhiteSpace(image.Slot))
                {
                    var otherImagesInSlot = await _dbContext.Images
                        .Where(i => i.TenantId == tenantId && i.Slot == image.Slot && i.Id != image.Id && i.Status == "Published")
                        .ToListAsync(cancellationToken);

                    foreach (var other in otherImagesInSlot)
                    {
                        other.Status = "Approved";
                        other.UpdatedAt = DateTime.UtcNow;
                    }

                    await SyncImageToWebsiteContentAsync(tenantId, image, optVariant, cancellationToken);
                }

                if (image.UsageType == "ExploreOurWork")
                {
                    syncExploreNeeded = true;
                }

                succeeded.Add(id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish image {ImageId} in bulk publish for tenant {TenantId}", id, tenantId);
                failed.Add(id);
            }
        }

        if (syncExploreNeeded && websiteId.HasValue)
        {
            await SyncExploreOurWorkToWebsiteContentAsync(tenantId, websiteId.Value, cancellationToken);
        }

        if (websiteId.HasValue)
        {
            var website = await _dbContext.Websites.FirstOrDefaultAsync(w => w.Id == websiteId.Value, cancellationToken);
            if (website != null)
            {
                website.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: BulkImagesPublished. TenantId={TenantId}, UserId={UserId}, SucceededCount={SucceededCount}, FailedCount={FailedCount}",
            tenantId, userId, succeeded.Count, failed.Count);

        return new BulkImageOperationResult
        {
            Success = succeeded.Count > 0 || failed.Count == 0,
            AffectedCount = succeeded.Count,
            SucceededIds = succeeded,
            FailedIds = failed,
            Message = $"Successfully published {succeeded.Count} images."
        };
    }

    public async Task<List<WorkCategoryDto>> GetWorkCategoriesAsync(
        Guid tenantId,
        Guid? websiteId = null,
        CancellationToken cancellationToken = default)
    {
        Guid targetWebsiteId;
        if (websiteId.HasValue)
        {
            var web = await _dbContext.Websites.FirstOrDefaultAsync(w => w.Id == websiteId.Value && w.TenantId == tenantId, cancellationToken);
            targetWebsiteId = web?.Id ?? websiteId.Value;
        }
        else
        {
            var webDto = await _contentService.GetOrCreateConnectedWebsiteAsync(tenantId, cancellationToken);
            targetWebsiteId = webDto.Id;
        }

        var categories = await _dbContext.WebsiteWorkCategories
            .AsNoTracking()
            .Where(c => c.TenantId == tenantId && c.IsActive && (c.WebsiteId == targetWebsiteId || c.WebsiteId == Guid.Empty))
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);

        // Count approved/published ExploreOurWork images per category
        var imagesWithCategory = await _dbContext.Images
            .AsNoTracking()
            .Where(i => i.TenantId == tenantId && i.UsageType == "ExploreOurWork" && i.Status != "Deleted" && i.Status != "Unused" && i.Category != null)
            .Select(i => i.Category!)
            .ToListAsync(cancellationToken);

        var imageCounts = imagesWithCategory
            .GroupBy(c => c.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

        return categories.Select(c => new WorkCategoryDto
        {
            Id = c.Id,
            TenantId = c.TenantId,
            WebsiteId = c.WebsiteId,
            Name = c.Name,
            Slug = c.Slug,
            DisplayOrder = c.DisplayOrder,
            IsActive = c.IsActive,
            ImageCount = imageCounts.TryGetValue(c.Name.Trim(), out var count) ? count : 0,
            CreatedAt = c.CreatedAt
        }).ToList();
    }

    public async Task<WorkCategoryDto> CreateWorkCategoryAsync(
        Guid tenantId,
        CreateWorkCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("Category name cannot be empty.", nameof(request.Name));
        }

        var trimmedName = request.Name.Trim();
        if (trimmedName.Length > 100)
        {
            trimmedName = trimmedName[..100];
        }

        if (ContainsUnsafeContent(trimmedName))
        {
            throw new InvalidOperationException("Category name contains unsafe content.");
        }

        var websiteId = request.WebsiteId;
        if (!websiteId.HasValue)
        {
            var website = await _contentService.GetOrCreateConnectedWebsiteAsync(tenantId, cancellationToken);
            websiteId = website.Id;
        }

        var existing = await _dbContext.WebsiteWorkCategories
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Name.ToLower() == trimmedName.ToLower(), cancellationToken);

        if (existing != null)
        {
            if (!existing.IsActive)
            {
                existing.IsActive = true;
                existing.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
            return new WorkCategoryDto
            {
                Id = existing.Id,
                TenantId = existing.TenantId,
                WebsiteId = existing.WebsiteId,
                Name = existing.Name,
                Slug = existing.Slug,
                DisplayOrder = existing.DisplayOrder,
                IsActive = existing.IsActive,
                CreatedAt = existing.CreatedAt
            };
        }

        var slug = Slugify(trimmedName);
        var maxOrder = await _dbContext.WebsiteWorkCategories
            .Where(c => c.TenantId == tenantId)
            .Select(c => (int?)c.DisplayOrder)
            .MaxAsync(cancellationToken) ?? 0;

        var category = new WebsiteWorkCategory
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            WebsiteId = websiteId.Value,
            Name = trimmedName,
            Slug = slug,
            DisplayOrder = maxOrder + 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.WebsiteWorkCategories.Add(category);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new WorkCategoryDto
        {
            Id = category.Id,
            TenantId = category.TenantId,
            WebsiteId = category.WebsiteId,
            Name = category.Name,
            Slug = category.Slug,
            DisplayOrder = category.DisplayOrder,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt
        };
    }

    public Task<WorkCategoryDto> CreateWorkCategoryAsync(
        Guid tenantId,
        string name,
        CancellationToken cancellationToken = default)
    {
        return CreateWorkCategoryAsync(tenantId, new CreateWorkCategoryRequest { Name = name }, cancellationToken);
    }

    public async Task<WorkCategoryDto> UpdateWorkCategoryAsync(
        Guid tenantId,
        Guid categoryId,
        UpdateWorkCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request?.Name))
        {
            throw new ArgumentException("Category name cannot be empty.", nameof(request.Name));
        }

        var trimmedName = request.Name.Trim();
        if (trimmedName.Length > 100)
        {
            trimmedName = trimmedName[..100];
        }

        if (ContainsUnsafeContent(trimmedName))
        {
            throw new InvalidOperationException("Category name contains unsafe content.");
        }

        var category = await _dbContext.WebsiteWorkCategories
            .FirstOrDefaultAsync(c => c.Id == categoryId && c.TenantId == tenantId, cancellationToken);

        if (category == null)
        {
            throw new KeyNotFoundException("Category not found.");
        }

        // Check duplicate name within tenant
        var duplicate = await _dbContext.WebsiteWorkCategories
            .AnyAsync(c => c.TenantId == tenantId && c.Id != categoryId && c.Name.ToLower() == trimmedName.ToLower(), cancellationToken);

        if (duplicate)
        {
            throw new InvalidOperationException($"A category named '{trimmedName}' already exists.");
        }

        var oldName = category.Name;
        category.Name = trimmedName;
        category.Slug = Slugify(trimmedName);
        if (request.DisplayOrder.HasValue)
        {
            category.DisplayOrder = request.DisplayOrder.Value;
        }
        category.UpdatedAt = DateTime.UtcNow;

        // If old category was used by images, update them to new name
        if (!string.Equals(oldName, trimmedName, StringComparison.OrdinalIgnoreCase))
        {
            var imagesWithOldCat = await _dbContext.Images
                .Where(i => i.TenantId == tenantId && i.Category == oldName)
                .ToListAsync(cancellationToken);

            foreach (var img in imagesWithOldCat)
            {
                img.Category = trimmedName;
                img.UpdatedAt = DateTime.UtcNow;
            }

            var leadsWithOldCat = await _dbContext.Leads
                .Where(l => l.TenantId == tenantId && (l.AreaOfInterestCategoryId == category.Id || l.AreaOfInterest == oldName))
                .ToListAsync(cancellationToken);

            foreach (var lead in leadsWithOldCat)
            {
                lead.AreaOfInterest = trimmedName;
                lead.AreaOfInterestCategoryId = category.Id;
                lead.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Sync explore our work to website content
        await SyncExploreOurWorkToWebsiteContentAsync(tenantId, category.WebsiteId, cancellationToken);

        var imageCount = await _dbContext.Images
            .CountAsync(i => i.TenantId == tenantId && i.UsageType == "ExploreOurWork" && i.Status != "Deleted" && i.Status != "Unused" && i.Category == category.Name, cancellationToken);

        return new WorkCategoryDto
        {
            Id = category.Id,
            TenantId = category.TenantId,
            WebsiteId = category.WebsiteId,
            Name = category.Name,
            Slug = category.Slug,
            DisplayOrder = category.DisplayOrder,
            IsActive = category.IsActive,
            ImageCount = imageCount,
            CreatedAt = category.CreatedAt
        };
    }

    public async Task<bool> DeleteWorkCategoryAsync(
        Guid tenantId,
        Guid categoryId,
        CancellationToken cancellationToken = default)
    {
        var category = await _dbContext.WebsiteWorkCategories
            .FirstOrDefaultAsync(c => c.Id == categoryId && c.TenantId == tenantId, cancellationToken);

        if (category == null)
        {
            throw new KeyNotFoundException("Category not found.");
        }

        // Option A safety check: prevent deletion if images currently use this category
        var hasImages = await _dbContext.Images
            .AnyAsync(i => i.TenantId == tenantId && i.UsageType == "ExploreOurWork" && i.Status != "Deleted" && i.Status != "Unused" && i.Category == category.Name, cancellationToken);

        if (hasImages)
        {
            throw new InvalidOperationException($"Cannot delete category '{category.Name}' because it has project images assigned to it. Please reassign or delete the images first.");
        }

        _dbContext.WebsiteWorkCategories.Remove(category);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Sync explore our work
        await SyncExploreOurWorkToWebsiteContentAsync(tenantId, category.WebsiteId, cancellationToken);

        return true;
    }

    private async Task EnsureWorkCategoryExistsAsync(Guid tenantId, Guid websiteId, string categoryName, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(categoryName)) return;
        var trimmed = categoryName.Trim();
        if (trimmed.Equals("All", StringComparison.OrdinalIgnoreCase)) return;

        var exists = await _dbContext.WebsiteWorkCategories
            .AnyAsync(c => c.TenantId == tenantId && c.Name.ToLower() == trimmed.ToLower(), cancellationToken);

        if (!exists)
        {
            var slug = Slugify(trimmed);
            var maxOrder = await _dbContext.WebsiteWorkCategories
                .Where(c => c.TenantId == tenantId)
                .Select(c => (int?)c.DisplayOrder)
                .MaxAsync(cancellationToken) ?? 0;

            var newCat = new WebsiteWorkCategory
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                WebsiteId = websiteId,
                Name = trimmed,
                Slug = slug,
                DisplayOrder = maxOrder + 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.WebsiteWorkCategories.Add(newCat);
        }
    }

    private static string Slugify(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var normalized = text.ToLowerInvariant().Trim();
        normalized = System.Text.RegularExpressions.Regex.Replace(normalized, @"[^a-z0-9\s-]", "");
        normalized = System.Text.RegularExpressions.Regex.Replace(normalized, @"\s+", "-").Trim('-');
        return string.IsNullOrWhiteSpace(normalized) ? "category" : normalized;
    }

    private async Task ClearImageFromWebsiteContentAsync(Guid tenantId, Image image, CancellationToken cancellationToken)
    {
        var slot = image.Slot;
        if (string.IsNullOrWhiteSpace(slot)) return;

        var (sectionKey, fieldKey) = slot switch
        {
            "heroImage" or "hero" => ("hero", "heroImage"),
            "primaryImage" or "aboutPrimary" => ("about", "primaryImage"),
            "secondaryImage" or "aboutSecondary" => ("about", "secondaryImage"),
            "serviceImage" or "services" => ("services", "image"),
            _ => (null, null)
        };

        if (sectionKey == null || fieldKey == null) return;

        var website = await _contentService.GetOrCreateConnectedWebsiteAsync(tenantId, cancellationToken);
        var content = await _dbContext.WebsiteContents
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.WebsiteId == website.Id && c.SectionKey == sectionKey, cancellationToken);

        if (content != null)
        {
            try
            {
                var draftNode = JsonNode.Parse(content.DraftContentJson);
                if (draftNode is JsonObject obj)
                {
                    obj[fieldKey] = "";
                    content.DraftContentJson = obj.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
                }

                if (!string.IsNullOrWhiteSpace(content.PublishedContentJson))
                {
                    var pubNode = JsonNode.Parse(content.PublishedContentJson);
                    if (pubNode is JsonObject pubObj)
                    {
                        pubObj[fieldKey] = "";
                        content.PublishedContentJson = pubObj.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
                    }
                }

                content.UpdatedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clear deleted image delivery URL from section '{SectionKey}'.", sectionKey);
            }
        }
    }

    private async Task SyncImageToWebsiteContentAsync(Guid tenantId, Image image, ImageVariant? variant, CancellationToken cancellationToken)
    {
        var slot = image.Slot;
        if (string.IsNullOrWhiteSpace(slot)) return;

        var deliveryUrl = variant != null
            ? $"/api/v1/website/images/{image.Id}/variants/{variant.Id}/file"
            : $"/api/v1/website/images/{image.Id}/file";

        // Determine section from slot
        var (sectionKey, fieldKey) = slot switch
        {
            "heroImage" or "hero" => ("hero", "heroImage"),
            "primaryImage" or "aboutPrimary" => ("about", "primaryImage"),
            "secondaryImage" or "aboutSecondary" => ("about", "secondaryImage"),
            "serviceImage" or "services" => ("services", "image"),
            _ => (null, null)
        };

        if (sectionKey == null || fieldKey == null) return;

        var website = await _contentService.GetOrCreateConnectedWebsiteAsync(tenantId, cancellationToken);
        var content = await _dbContext.WebsiteContents
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.WebsiteId == website.Id && c.SectionKey == sectionKey, cancellationToken);

        if (content != null)
        {
            try
            {
                var draftNode = JsonNode.Parse(content.DraftContentJson);
                if (draftNode is JsonObject obj)
                {
                    obj[fieldKey] = deliveryUrl;
                    content.DraftContentJson = obj.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
                }

                if (!string.IsNullOrWhiteSpace(content.PublishedContentJson))
                {
                    var pubNode = JsonNode.Parse(content.PublishedContentJson);
                    if (pubNode is JsonObject pubObj)
                    {
                        pubObj[fieldKey] = deliveryUrl;
                        content.PublishedContentJson = pubObj.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
                    }
                }

                content.UpdatedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to sync image delivery URL to section '{SectionKey}'.", sectionKey);
            }
        }
    }

    private async Task SyncExploreOurWorkToWebsiteContentAsync(Guid tenantId, Guid websiteId, CancellationToken cancellationToken)
    {
        var content = await _dbContext.WebsiteContents
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.WebsiteId == websiteId && c.SectionKey == "our-work", cancellationToken);

        if (content == null) return;

        var publishedImages = await _dbContext.Images
            .AsNoTracking()
            .Include(i => i.Variants)
            .Where(i => i.TenantId == tenantId && i.WebsiteId == websiteId && i.UsageType == "ExploreOurWork" && i.Status == "Published" && i.IsActiveWebsiteUsage)
            .OrderBy(i => i.CreatedAt)
            .ToListAsync(cancellationToken);

        // Fetch dynamic tenant work categories
        var activeCategories = await _dbContext.WebsiteWorkCategories
            .AsNoTracking()
            .Where(c => c.TenantId == tenantId && (c.WebsiteId == websiteId || c.WebsiteId == Guid.Empty) && c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .Select(c => c.Name)
            .ToListAsync(cancellationToken);

        var dynamicCategorySet = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "All" };
        foreach (var cat in activeCategories) dynamicCategorySet.Add(cat);
        foreach (var img in publishedImages.Where(i => !string.IsNullOrWhiteSpace(i.Category)))
        {
            dynamicCategorySet.Add(img.Category!);
        }
        var categoriesList = dynamicCategorySet.ToList();

        var galleryItems = publishedImages.Select((img, idx) =>
        {
            var publishedVariant = img.Variants
                .Where(v => v.Status == "Published")
                .OrderByDescending(v => v.CreatedAt)
                .FirstOrDefault();

            var deliveryUrl = publishedVariant != null
                ? $"/api/v1/website/images/{img.Id}/variants/{publishedVariant.Id}/file"
                : $"/api/v1/website/images/{img.Id}/file";

            return new
            {
                id = img.Id.ToString(),
                title = !string.IsNullOrWhiteSpace(img.ProjectWorkName) ? img.ProjectWorkName : "Project Showcase",
                image = deliveryUrl,
                category = !string.IsNullOrWhiteSpace(img.Category) ? img.Category : "All",
                span = idx == 0 ? "large" : "standard",
                caption = img.Caption ?? ""
            };
        }).ToList();

        try
        {
            var draftNode = JsonNode.Parse(content.DraftContentJson);
            if (draftNode is JsonObject draftObj)
            {
                draftObj["categories"] = JsonSerializer.SerializeToNode(categoriesList);
                draftObj["items"] = JsonSerializer.SerializeToNode(galleryItems);
                content.DraftContentJson = draftObj.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
            }

            if (!string.IsNullOrWhiteSpace(content.PublishedContentJson))
            {
                var pubNode = JsonNode.Parse(content.PublishedContentJson);
                if (pubNode is JsonObject pubObj)
                {
                    pubObj["categories"] = JsonSerializer.SerializeToNode(categoriesList);
                    pubObj["items"] = JsonSerializer.SerializeToNode(galleryItems);
                    content.PublishedContentJson = pubObj.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
                }
            }

            content.UpdatedAt = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to sync ExploreOurWork images to our-work section content.");
        }
    }

    public string GenerateImageSignature(Guid imageId, Guid tenantId, long expiresUnix)
    {
        var secret = _configuration["Jwt:Secret"] ?? "Sparovia-Default-Development-Key-At-Least-32-Bytes-Long-12345";
        var payload = $"{imageId:D}:{tenantId:D}:{expiresUnix}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public bool VerifyImageSignature(Guid imageId, Guid tenantId, long expiresUnix, string signature)
    {
        if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > expiresUnix)
        {
            return false;
        }

        var expected = GenerateImageSignature(imageId, tenantId, expiresUnix);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected),
            Encoding.UTF8.GetBytes(signature));
    }

    private string GeneratePreviewUrl(Guid imageId, Guid tenantId)
    {
        var expires = DateTimeOffset.UtcNow.AddDays(7).ToUnixTimeSeconds();
        var sig = GenerateImageSignature(imageId, tenantId, expires);
        return $"/api/v1/website/images/{imageId}/file?sig={sig}&exp={expires}";
    }

    private string GenerateVariantPreviewUrl(Guid imageId, Guid variantId, Guid tenantId)
    {
        var expires = DateTimeOffset.UtcNow.AddDays(7).ToUnixTimeSeconds();
        var sig = GenerateImageSignature(variantId, tenantId, expires);
        return $"/api/v1/website/images/{imageId}/variants/{variantId}/file?sig={sig}&exp={expires}";
    }

    private ImageDto MapToDto(Image image)
    {
        return new ImageDto
        {
            Id = image.Id,
            TenantId = image.TenantId,
            WebsiteId = image.WebsiteId,
            OriginalFileName = image.OriginalFileName,
            MimeType = image.MimeType,
            FileSize = image.FileSize,
            Width = image.Width,
            Height = image.Height,
            UsageType = image.UsageType,
            Slot = image.Slot,
            ProjectWorkName = image.ProjectWorkName,
            Category = image.Category,
            Caption = image.Caption,
            Status = image.Status,
            IsActiveWebsiteUsage = image.IsActiveWebsiteUsage,
            PreviewUrl = GeneratePreviewUrl(image.Id, image.TenantId),
            CreatedAt = image.CreatedAt,
            UpdatedAt = image.UpdatedAt,
            Variants = image.Variants?.Select(v => MapVariantDto(v, image.TenantId)).ToList() ?? new()
        };
    }

    private ImageVariantDto MapVariantDto(ImageVariant variant, Guid? tenantId = null)
    {
        var tid = tenantId ?? variant.Image?.TenantId ?? Guid.Empty;
        return new ImageVariantDto
        {
            Id = variant.Id,
            ImageId = variant.ImageId,
            ParentVariantId = variant.ParentVariantId,
            VariantType = variant.VariantType,
            Operation = variant.Operation,
            MimeType = variant.MimeType,
            FileSize = variant.FileSize,
            Width = variant.Width,
            Height = variant.Height,
            Version = variant.Version,
            Status = variant.Status,
            PreviewUrl = tid != Guid.Empty
                ? GenerateVariantPreviewUrl(variant.ImageId, variant.Id, tid)
                : $"/api/v1/website/images/{variant.ImageId}/variants/{variant.Id}/file",
            CreatedAt = variant.CreatedAt,
            AlgorithmVersion = "1.0.0-deterministic",
            EffectiveProfile = variant.Operation ?? (variant.VariantType == "QualityStudio" ? "Balanced" : "Adaptive"),
            AppliedCorrections = GetAppliedCorrectionsForOperation(variant.Operation, variant.VariantType)
        };
    }

    private static List<string> GetAppliedCorrectionsForOperation(string? operation, string variantType)
    {
        var op = operation?.Trim() ?? "";
        if (op.Equals("ImproveClarity", StringComparison.OrdinalIgnoreCase))
        {
            return new List<string>
            {
                "Improved tonal clarity",
                "Preserved natural material colors"
            };
        }
        if (op.Equals("ImproveSharpness", StringComparison.OrdinalIgnoreCase))
        {
            return new List<string>
            {
                "Refined edge sharpness"
            };
        }
        if (op.Equals("ReduceNoise", StringComparison.OrdinalIgnoreCase))
        {
            return new List<string>
            {
                "Reduced visible image noise",
                "Preserved natural material colors"
            };
        }
        if (op.Equals("Upscale", StringComparison.OrdinalIgnoreCase) || op.Equals("UpscaleResolution", StringComparison.OrdinalIgnoreCase))
        {
            return new List<string>
            {
                "Increased image resolution",
                "Refined edge sharpness"
            };
        }
        if (op.Equals("ClassicLook", StringComparison.OrdinalIgnoreCase))
        {
            return new List<string>
            {
                "Preserved natural material colors",
                "Improved tonal clarity"
            };
        }
        if (op.Equals("ModernLook", StringComparison.OrdinalIgnoreCase))
        {
            return new List<string>
            {
                "Improved tonal clarity",
                "Preserved natural material colors"
            };
        }
        if (op.Equals("WebOptimize", StringComparison.OrdinalIgnoreCase))
        {
            return new List<string>
            {
                "Optimized image for web delivery"
            };
        }
        if (variantType == "QualityStudio" || op.StartsWith("QualityStudio", StringComparison.OrdinalIgnoreCase))
        {
            return new List<string>
            {
                "Improved tonal clarity",
                "Refined edge sharpness"
            };
        }
        return new List<string>();
    }
}
