namespace Sparovia.Application.BusinessPresence;

public interface IBusinessPresenceService
{
    Task<BusinessPresenceDto?> GetPresenceAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<BusinessPresenceResult> UpdatePresenceAsync(Guid tenantId, UpdateBusinessPresenceRequest request, CancellationToken cancellationToken = default);
    Task<BusinessPresenceResult> MarkAsReviewedAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
