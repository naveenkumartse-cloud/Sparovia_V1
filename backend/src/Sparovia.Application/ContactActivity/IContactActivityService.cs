namespace Sparovia.Application.ContactActivity;

public interface IContactActivityService
{
    Task<ContactActivityOperationResult> RecordContactActivityAsync(
        Guid? tenantId,
        string? domain,
        RecordContactActivityRequest request,
        CancellationToken cancellationToken = default);

    Task<ContactActivitySummaryDto> GetActivitySummaryAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<ContactActivityListResponse> GetActivitiesAsync(
        Guid tenantId,
        ContactActivityQueryParameters query,
        CancellationToken cancellationToken = default);
}
