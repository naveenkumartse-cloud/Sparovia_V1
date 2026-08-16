namespace Sparovia.Application.DTOs.Business;

public record CreateBusinessRequest(
    string Name,
    string Slug,
    string Industry,
    string? Description
);

public record BusinessResponse(
    Guid Id,
    string Name,
    string Slug,
    string Industry,
    string? Description,
    bool IsOnboardingComplete,
    string? TargetAudience,
    string? ValueProposition,
    string? ContactEmail,
    string? ContactPhone,
    string? Address,
    bool? HasGoogleBusinessProfile,
    string? GoogleBusinessProfileStatus,
    bool IsActive,
    DateTime CreatedAt
);

public record UpdateBusinessRequest(
    string? Name,
    string? Industry,
    string? Description,
    bool? IsOnboardingComplete,
    string? TargetAudience,
    string? ValueProposition,
    string? ContactEmail,
    string? ContactPhone,
    string? Address,
    bool? HasGoogleBusinessProfile,
    string? GoogleBusinessProfileStatus
);
