using System.Text.Json;

namespace Sparovia.Application.WebsiteContent;

public interface IWebsiteContentService
{
    Task<WebsiteDto> GetOrCreateConnectedWebsiteAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<WebsiteContentOverviewDto> GetOverviewAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<ContentSectionSummaryDto>> GetSectionsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<ContentSectionDetailDto?> GetSectionAsync(Guid tenantId, string sectionKey, CancellationToken cancellationToken = default);
    Task<WebsiteContentOperationResult> SaveDraftAsync(Guid tenantId, string sectionKey, JsonElement fields, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<WebsiteContentOperationResult> PublishSectionAsync(Guid tenantId, string sectionKey, int? expectedVersion = null, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<PublishedWebsiteContentDto?> GetPublishedContentAsync(Guid? tenantId = null, string? domain = null, CancellationToken cancellationToken = default);
}
