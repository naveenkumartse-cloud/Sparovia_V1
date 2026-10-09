namespace Sparovia.Application.Images;

public interface IWebsiteImageService
{
    Task<List<ImageDto>> GetImagesAsync(Guid tenantId, string? usageType = null, bool includeUnused = false, CancellationToken cancellationToken = default);
    Task<ImageDto?> GetImageByIdAsync(Guid tenantId, Guid imageId, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> UploadImageAsync(Guid tenantId, Stream fileStream, string fileName, string contentType, string usageType, string? slot = null, string? projectWorkName = null, string? category = null, string? caption = null, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> ReplaceImageAsync(Guid tenantId, Guid imageId, Stream fileStream, string fileName, string contentType, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> UpdateMetadataAsync(Guid tenantId, Guid imageId, string? projectWorkName, string? category, string? caption, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<ImagePreviewDto?> GetImagePreviewAsync(Guid tenantId, Guid imageId, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> ApproveImageAsync(Guid tenantId, Guid imageId, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> RejectImageAsync(Guid tenantId, Guid imageId, string? reason = null, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> PublishImageAsync(Guid tenantId, Guid imageId, Guid? variantId = null, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> RemoveFromWebsiteUsageAsync(Guid tenantId, Guid imageId, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> DeleteImageAsync(Guid tenantId, Guid imageId, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<BulkImageOperationResult> BulkDeleteImagesAsync(Guid tenantId, List<Guid> imageIds, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<BulkImageOperationResult> BulkPublishImagesAsync(Guid tenantId, List<Guid> imageIds, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<List<WorkCategoryDto>> GetWorkCategoriesAsync(Guid tenantId, Guid? websiteId = null, CancellationToken cancellationToken = default);
    Task<WorkCategoryDto> CreateWorkCategoryAsync(Guid tenantId, CreateWorkCategoryRequest request, CancellationToken cancellationToken = default);
    Task<WorkCategoryDto> UpdateWorkCategoryAsync(Guid tenantId, Guid categoryId, UpdateWorkCategoryRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteWorkCategoryAsync(Guid tenantId, Guid categoryId, CancellationToken cancellationToken = default);
    Task<ImageAnalysisResult> AnalyzeImageAsync(Guid tenantId, Guid imageId, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> ProcessQualityStudioAsync(Guid tenantId, Guid imageId, QualityStudioProcessRequest request, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> EnhanceImageAsync(Guid tenantId, Guid imageId, string operation, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> OptimizeImageAsync(Guid tenantId, Guid imageId, Guid? parentVariantId = null, string? targetFormat = null, int? maxWidth = null, int? maxHeight = null, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> ApproveEnhancementAsync(Guid tenantId, Guid imageId, Guid variantId, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> RejectEnhancementAsync(Guid tenantId, Guid imageId, Guid variantId, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<ImageOperationResult> ReviewVariantAsync(Guid tenantId, Guid imageId, Guid variantId, bool isApproved, string? reason = null, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<VariantReviewDto?> GetVariantReviewAsync(Guid tenantId, Guid imageId, Guid variantId, CancellationToken cancellationToken = default);
    Task<ImageFileStreamResult?> GetImageFileAsync(Guid? tenantId, Guid imageId, Guid? variantId = null, bool isPublicRequest = false, CancellationToken cancellationToken = default);
    string GenerateImageSignature(Guid imageId, Guid tenantId, long expiresUnix);
    bool VerifyImageSignature(Guid imageId, Guid tenantId, long expiresUnix, string signature);
}
