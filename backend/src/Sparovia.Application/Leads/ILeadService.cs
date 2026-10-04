namespace Sparovia.Application.Leads;

public interface ILeadService
{
    Task<LeadListResponse> GetLeadsAsync(Guid tenantId, LeadQueryParameters parameters, CancellationToken cancellationToken = default);

    Task<LeadDto?> GetLeadByIdAsync(Guid tenantId, Guid leadId, CancellationToken cancellationToken = default);

    Task<LeadOperationResult> UpdateLeadStatusAsync(Guid tenantId, Guid leadId, string newStatus, Guid? updatedByUserId, CancellationToken cancellationToken = default);

    Task<LeadOperationResult> CreateWebsiteLeadAsync(Guid? tenantId, string? domain, PublicWebsiteLeadRequest request, CancellationToken cancellationToken = default);

    Task<LeadOperationResult> ProcessWhatsAppWebhookAsync(Guid tenantId, WhatsAppLeadWebhookRequest request, CancellationToken cancellationToken = default);

    Task<int> GetNewLeadsCountAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
