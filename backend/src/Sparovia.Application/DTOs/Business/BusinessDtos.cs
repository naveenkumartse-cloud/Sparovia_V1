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
    bool IsActive,
    DateTime CreatedAt
);
