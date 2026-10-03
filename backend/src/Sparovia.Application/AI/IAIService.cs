namespace Sparovia.Application.AI;

/// <summary>
/// Main AI Service interface for Sparovia workflows.
/// Orchestrates validation, tenant isolation, AIRequest persistence, audit logging,
/// provider execution, and standardized result normalization.
/// </summary>
public interface IAIService
{
    Task<AIExecutionResult> ExecuteAsync(AIExecutionRequest request, CancellationToken cancellationToken = default);
    Task<AIRequestDto?> GetRequestStatusAsync(Guid tenantId, Guid aiRequestId, CancellationToken cancellationToken = default);
    Task<AIReviewDetailDto?> GetReviewDetailAsync(Guid tenantId, Guid aiRequestId, CancellationToken cancellationToken = default);
    Task<AIReviewResultDto> AcceptOutputAsync(Guid tenantId, Guid aiRequestId, string? editedText, Guid? userId, CancellationToken cancellationToken = default);
    Task<AIReviewResultDto> RejectOutputAsync(Guid tenantId, Guid aiRequestId, string? reason, Guid? userId, CancellationToken cancellationToken = default);
}
