namespace Sparovia.Application.Onboarding;

public interface IOnboardingService
{
    Task<BusinessBasicsDto?> GetBusinessBasicsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<BusinessBasicsResult> SaveBusinessBasicsAsync(Guid tenantId, BusinessBasicsDto dto, CancellationToken cancellationToken = default);

    Task<List<ServiceDto>> GetServicesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<ServiceResult> AddServiceAsync(Guid tenantId, AddServiceRequest request, CancellationToken cancellationToken = default);
    Task<ServiceResult> UpdateServiceAsync(Guid tenantId, Guid serviceId, UpdateServiceRequest request, CancellationToken cancellationToken = default);
    Task<ServiceResult> DeleteServiceAsync(Guid tenantId, Guid serviceId, CancellationToken cancellationToken = default);

    Task<LocationAndCustomersDto?> GetLocationAndCustomersAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<LocationAndCustomersResult> SaveLocationAndCustomersAsync(Guid tenantId, LocationAndCustomersDto dto, CancellationToken cancellationToken = default);

    Task<BusinessDescriptionDto?> GetBusinessDescriptionAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<BusinessDescriptionResult> SaveBusinessDescriptionAsync(Guid tenantId, BusinessDescriptionDto dto, CancellationToken cancellationToken = default);

    Task<ApprovedFactsDto?> GetApprovedFactsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<ApprovedFactsResult> SaveApprovedFactsAsync(Guid tenantId, ApprovedFactsDto dto, CancellationToken cancellationToken = default);

    Task<BusinessContextSummaryDto?> GetBusinessContextSummaryAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<ConfirmationResult> ConfirmBusinessContextAsync(Guid tenantId, Guid userId, CancellationToken cancellationToken = default);
}
