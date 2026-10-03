namespace Sparovia.Application.AI;

public class AIExecutionRequest
{
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }
    public required string OperationType { get; set; }
    public required string ResourceType { get; set; }
    public Guid ResourceId { get; set; }

    public string? InputText { get; set; }
    public string? Instruction { get; set; }

    public string? TargetSectionKey { get; set; }
    public string? TargetFieldKey { get; set; }
    public int? TargetResourceVersion { get; set; }

    public AIExecutionContext Context { get; set; } = new();
    public AIOperationOptions Options { get; set; } = new();
}

public class AIExecutionContext
{
    public string? BusinessName { get; set; }
    public string? BusinessType { get; set; }
    public string? PrimaryCategory { get; set; }
    public string? BusinessDescription { get; set; }
    public string? Differentiators { get; set; }
    public List<string> Services { get; set; } = new();
    public string? Location { get; set; }
    public List<string> ApprovedFacts { get; set; } = new();

    public string? SectionKey { get; set; }
    public string? FieldName { get; set; }
    public string? ExistingPublishedContent { get; set; }
    public string? CurrentDraftContent { get; set; }
}

public class AIOperationOptions
{
    public string? ModelKey { get; set; }
    public int? MaxOutputTokens { get; set; }
    public string? IdempotencyKey { get; set; }
}

public class AIExecutionResult
{
    public bool Success { get; set; }
    public Guid AIRequestId { get; set; }
    public string? OutputText { get; set; }
    public string Status { get; set; } = "Processing";
    public string ReviewStatus { get; set; } = "PendingReview";
    public AIMetadata? Metadata { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
}

public class AIMetadata
{
    public long ProcessingDurationMs { get; set; }
    public string? ModelReference { get; set; }
    public string? ProviderReference { get; set; }
}

public class AIRequestDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }
    public string OperationType { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public Guid ResourceId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ReviewStatus { get; set; } = string.Empty;
    public string? OutputText { get; set; }
    public string? OriginalText { get; set; }
    public string? ProviderReference { get; set; }
    public string? ModelReference { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
}

// Client-facing Content AI endpoint contract
public class AIImproveContentRequest
{
    public required string SectionKey { get; set; }
    public required string Field { get; set; }
    public required string Operation { get; set; }
    public required string CurrentText { get; set; }
    public string? Instruction { get; set; }
}

public class AIContentResponseDto
{
    public Guid AiRequestId { get; set; }
    public required string Suggestion { get; set; }
    public required string Status { get; set; }
    public string ReviewStatus { get; set; } = "PendingReview";
    public string? OriginalText { get; set; }
    public string? SectionKey { get; set; }
    public string? Field { get; set; }
    public int? TargetResourceVersion { get; set; }
}

// Review and Acceptance DTOs (Build 29)
public class AIReviewRequestDto
{
    public string? EditedText { get; set; }
}

public class AIRejectRequestDto
{
    public string? Reason { get; set; }
}

public class AIReviewDetailDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }
    public string OperationType { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public Guid ResourceId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ReviewStatus { get; set; } = string.Empty;
    public string? OutputText { get; set; }
    public string? OriginalText { get; set; }
    public string? TargetSectionKey { get; set; }
    public string? TargetFieldKey { get; set; }
    public int? TargetResourceVersion { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
}

public class AIReviewResultDto
{
    public bool Success { get; set; }
    public Guid AiRequestId { get; set; }
    public string ReviewStatus { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public object? AppliedDraft { get; set; }
    public int? AppliedVersion { get; set; }
}

public class AIImageValidationRequest
{
    public Guid TenantId { get; set; }
    public Guid SourceImageTenantId { get; set; }
    public Guid OriginalImageId { get; set; }
    public bool IsOriginalModified { get; set; }
    public string Format { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public long FileSizeBytes { get; set; }
    public string OperationType { get; set; } = string.Empty;
    public bool IsVariant { get; set; } = true;
}

// Provider abstraction messages
public class AIProviderTextRequest
{
    public required string OperationType { get; set; }
    public required string InputText { get; set; }
    public string? Instruction { get; set; }
    public string? SystemPrompt { get; set; }
    public string? GroundingContext { get; set; }
    public string? Model { get; set; }
    public string? ProviderKey { get; set; }
    public string? ApiKey { get; set; }
    public int MaxTokens { get; set; } = 1000;
}

public class AIProviderResult
{
    public bool Success { get; set; }
    public string? OutputText { get; set; }
    public string? ProviderReference { get; set; }
    public string? ModelReference { get; set; }
    public long DurationMs { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
}

// Client-facing Model Selection DTOs
public class AIModelDto
{
    public required string Key { get; set; }
    public string ProviderKey { get; set; } = string.Empty;
    public required string DisplayName { get; set; }
    public required string Description { get; set; }
    public required string Capability { get; set; }
    public required string Status { get; set; }
    public bool IsDefault { get; set; }
    public bool IsRecommended { get; set; }
    public bool IsSelected { get; set; }
}

public class AIProviderDto
{
    public required string Key { get; set; }
    public required string DisplayName { get; set; }
    public required string Description { get; set; }
    public required List<string> SupportedCapabilities { get; set; } = new();
    public required string DefaultModelKey { get; set; }
    public string? DocumentationUrl { get; set; }
    public string? Placeholder { get; set; }
}

public class AIConnectionDto
{
    public required string Status { get; set; } // "Connected", "NotConnected", "Invalid"
    public string? ProviderKey { get; set; }
    public string? ProviderDisplayName { get; set; }
    public string? SelectedModelKey { get; set; }
    public string? SelectedModelDisplayName { get; set; }
    public string? MaskedApiKey { get; set; }
    public string? SupportedCapability { get; set; }
    public bool IsContentAIAvailable { get; set; }
    public bool IsImageEnhancementAvailable { get; set; }
    public DateTime? LastValidatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class ConnectAIProviderRequest
{
    public required string ProviderKey { get; set; }
    public required string ApiKey { get; set; }
    public required string SelectedModelKey { get; set; }
}

public class UpdateAIConnectionRequest
{
    public string? SelectedModelKey { get; set; }
    public string? ModelKey { get; set; }
    public string? ModelId { get; set; }
    public string? ApiKey { get; set; }

    public string? ResolvedModelKey => !string.IsNullOrWhiteSpace(SelectedModelKey) 
        ? SelectedModelKey 
        : !string.IsNullOrWhiteSpace(ModelKey) 
            ? ModelKey 
            : ModelId;
}

public class TestAIConnectionRequest
{
    public required string ProviderKey { get; set; }
    public string? ApiKey { get; set; }
}

public class TestAIConnectionResponse
{
    public bool Success { get; set; }
    public required string ProviderKey { get; set; }
    public required string Message { get; set; }
}

public class AIModelSelectionDto
{
    public required string SelectedModelKey { get; set; }
    public required AIModelDto Model { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class AIModelsResponseDto
{
    public required List<AIModelDto> Models { get; set; } = new();
    public required string SelectedModelKey { get; set; }
}

public class UpdateModelSelectionRequest
{
    public string? ModelKey { get; set; }
    public string? ModelId { get; set; }

    public string? ResolvedModelKey => !string.IsNullOrWhiteSpace(ModelKey) ? ModelKey : ModelId;
}
