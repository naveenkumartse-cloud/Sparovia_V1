namespace Sparovia.Application.ContactActivity;

public record ContactActivityDto
{
    public Guid Id { get; init; }
    public string Channel { get; init; } = string.Empty;
    public string EventType { get; init; } = string.Empty;
    public string? TemplateId { get; init; }
    public string? TemplateTitle { get; init; }
    public string? Source { get; init; }
    public string? CorrelationId { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record ContactActivitySummaryDto
{
    public int TotalClicks { get; init; }
    public int WhatsAppClicks { get; init; }
    public int FacebookClicks { get; init; }
    public int InstagramClicks { get; init; }
    public List<ContactActivityDto> RecentActivities { get; init; } = new();
}

public record ContactActivityListResponse
{
    public List<ContactActivityDto> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public record ContactActivityQueryParameters
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public string? Channel { get; init; }
    public string? Sort { get; init; }
}

public record RecordContactActivityRequest
{
    public string Channel { get; init; } = string.Empty;
    public string? EventType { get; init; }
    public string? TemplateId { get; init; }
    public string? TemplateTitle { get; init; }
    public string? Source { get; init; }
    public string? CorrelationId { get; init; }
    public string? Domain { get; init; }
}

public record ContactActivityOperationResult
{
    public bool Success { get; init; }
    public Guid? EventId { get; init; }
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }

    public static ContactActivityOperationResult Ok(Guid eventId) => new() { Success = true, EventId = eventId };
    public static ContactActivityOperationResult Fail(string code, string message) => new() { Success = false, ErrorCode = code, ErrorMessage = message };
}
