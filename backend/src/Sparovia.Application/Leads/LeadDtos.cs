namespace Sparovia.Application.Leads;

public record LeadDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string Message { get; init; } = string.Empty;
    public string? AreaOfInterest { get; init; }
    public Guid? AreaOfInterestCategoryId { get; init; }
    public string Source { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? SourceReference { get; init; }
    public DateTime SubmittedAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record LeadListResponse
{
    public List<LeadDto> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public record LeadQueryParameters
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public string? Search { get; init; }
    public string? Status { get; init; }
    public string? Source { get; init; }
    public string? Sort { get; init; }
}

public record CreateLeadRequest
{
    public string Name { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string Message { get; init; } = string.Empty;
    public string? AreaOfInterest { get; init; }
    public Guid? AreaOfInterestCategoryId { get; init; }
    public string? Source { get; init; }
    public string? Status { get; init; }
}

public record UpdateLeadRequest
{
    public string Name { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string Message { get; init; } = string.Empty;
    public string? AreaOfInterest { get; init; }
    public Guid? AreaOfInterestCategoryId { get; init; }
    public string? Status { get; init; }
}

public record UpdateLeadStatusRequest
{
    public string Status { get; init; } = string.Empty;
}

public record PublicWebsiteLeadRequest
{
    public string Name { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string? Service { get; init; }
    public string? AreaOfInterest { get; init; }
    public Guid? AreaOfInterestCategoryId { get; init; }
    public string Message { get; init; } = string.Empty;
    public string? Domain { get; init; }
}

public record WhatsAppLeadWebhookRequest
{
    public string? CustomerName { get; init; }
    public string? Phone { get; init; }
    public string? Message { get; init; }
    public string? MessageId { get; init; }
    public string? ConversationId { get; init; }
    public DateTime? Timestamp { get; init; }
}

public record LeadOperationResult
{
    public bool Success { get; init; }
    public LeadDto? Lead { get; init; }
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }

    public static LeadOperationResult Ok(LeadDto lead) => new() { Success = true, Lead = lead };
    public static LeadOperationResult Fail(string code, string message) => new() { Success = false, ErrorCode = code, ErrorMessage = message };
}

public record LeadFollowUpDto
{
    public Guid Id { get; init; }
    public Guid LeadId { get; init; }
    public DateTime FollowedUpAt { get; init; }
    public string Method { get; init; } = string.Empty;
    public string Notes { get; init; } = string.Empty;
    public string? NextAction { get; init; }
    public DateTime? NextFollowUpAt { get; init; }
    public Guid? CreatedByUserId { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record CreateLeadFollowUpRequest
{
    public DateTime FollowedUpAt { get; init; } = DateTime.UtcNow;
    public string Method { get; init; } = "Call";
    public string Notes { get; init; } = string.Empty;
    public string? NextAction { get; init; }
    public DateTime? NextFollowUpAt { get; init; }
}

public record LeadFollowUpOperationResult
{
    public bool Success { get; init; }
    public LeadFollowUpDto? FollowUp { get; init; }
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }

    public static LeadFollowUpOperationResult Ok(LeadFollowUpDto followUp) => new() { Success = true, FollowUp = followUp };
    public static LeadFollowUpOperationResult Fail(string code, string message) => new() { Success = false, ErrorCode = code, ErrorMessage = message };
}
