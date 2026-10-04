namespace Sparovia.Domain.Constants;

public static class AIRequestStatus
{
    public const string Processing = "Processing";
    public const string Succeeded = "Succeeded";
    public const string Failed = "Failed";
    public const string Rejected = "Rejected";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Processing,
        Succeeded,
        Failed,
        Rejected
    };
}

public static class AIOperationTypes
{
    // Content operations
    public const string ImproveWording = "ImproveWording";
    public const string MakeMoreProfessional = "MakeMoreProfessional";
    public const string MakeProfessional = "MakeProfessional";
    public const string MakeShorter = "MakeShorter";
    public const string MakeClearer = "MakeClearer";
    public const string ImproveServiceDescription = "ImproveServiceDescription";
    public const string CustomInstruction = "CustomInstruction";

    // Image operations
    public const string ImproveClarity = "ImproveClarity";
    public const string ImproveSharpness = "ImproveSharpness";
    public const string ReduceNoise = "ReduceNoise";
    public const string Upscale = "Upscale";
    public const string ClassicLook = "ClassicLook";
    public const string ModernLook = "ModernLook";
    public const string WebOptimize = "WebOptimize";

    public static readonly IReadOnlySet<string> SupportedContentOperations = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ImproveWording,
        MakeMoreProfessional,
        MakeProfessional,
        MakeShorter,
        MakeClearer,
        ImproveServiceDescription,
        CustomInstruction
    };

    public static readonly IReadOnlySet<string> SupportedImageOperations = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ImproveClarity,
        ImproveSharpness,
        ReduceNoise,
        Upscale,
        ClassicLook,
        ModernLook,
        WebOptimize
    };
}

public static class AIResourceTypes
{
    public const string WebsiteContent = "WebsiteContent";
    public const string ImageVariant = "ImageVariant";
    public const string General = "General";
}

public static class AIErrorCodes
{
    // General AI execution errors
    public const string ProviderUnavailable = "PROVIDER_UNAVAILABLE";
    public const string ProcessingTimeout = "PROCESSING_TIMEOUT";
    public const string RateLimited = "RATE_LIMITED";
    public const string InvalidRequest = "INVALID_REQUEST";
    public const string UnsupportedOperation = "UNSUPPORTED_OPERATION";
    public const string ProcessingFailed = "PROCESSING_FAILED";
    public const string ValidationError = "VALIDATION_ERROR";
    public const string TenantMismatch = "TENANT_MISMATCH";
    public const string ResourceNotFound = "RESOURCE_NOT_FOUND";
    public const string OnboardingRequired = "ONBOARDING_REQUIRED";
    public const string ConnectionTestFailed = "CONNECTION_TEST_FAILED";

    // Standardized Model & Provider persistence error codes
    public const string ModelNotFound = "AI_MODEL_NOT_FOUND";
    public const string ModelNotAllowed = "AI_MODEL_NOT_ALLOWED";
    public const string ModelUnavailable = "AI_MODEL_UNAVAILABLE";
    public const string ModelDeprecated = "AI_MODEL_DEPRECATED";
    public const string ProviderNotFound = "AI_PROVIDER_NOT_FOUND";
    public const string ProviderModelMismatch = "AI_PROVIDER_MODEL_MISMATCH";
    public const string ProviderConnectionRequired = "AI_PROVIDER_CONNECTION_REQUIRED";
    public const string ModelCapabilityUnsupported = "AI_MODEL_CAPABILITY_UNSUPPORTED";
    public const string ConfigurationNotFound = "AI_CONFIGURATION_NOT_FOUND";
    public const string ConfigurationUpdateFailed = "AI_CONFIGURATION_UPDATE_FAILED";

    // Content Assistance specific error codes
    public const string ContentOperationNotSupported = "AI_CONTENT_OPERATION_NOT_SUPPORTED";
    public const string ContentFieldNotSupported = "AI_CONTENT_FIELD_NOT_SUPPORTED";
    public const string ContentValidationFailed = "AI_CONTENT_VALIDATION_FAILED";
    public const string OutputInvalid = "AI_OUTPUT_INVALID";

    // Build 29 - Review & Output Validation error codes
    public const string ReviewStateInvalid = "AI_REVIEW_STATE_INVALID";
    public const string ResultStaleConflict = "AI_RESULT_STALE_CONFLICT";
    public const string OutputValidationFailed = "AI_OUTPUT_VALIDATION_FAILED";
    public const string OutputProhibitedContent = "AI_OUTPUT_PROHIBITED_CONTENT";
    public const string ReviewUnauthorized = "AI_REVIEW_UNAUTHORIZED";

    // Legacy aliases
    public const string ModelNotApproved = "AI_MODEL_NOT_FOUND";
    public const string ProviderNotApproved = "AI_PROVIDER_NOT_FOUND";
    public const string ModelCapabilityMismatch = "AI_MODEL_CAPABILITY_UNSUPPORTED";
    public const string ConnectionNotConfigured = "AI_PROVIDER_CONNECTION_REQUIRED";
    public const string InvalidCredential = "INVALID_CREDENTIAL";
    public const string ProviderTimeout = "PROVIDER_TIMEOUT";
}

public static class AIReviewStatus
{
    public const string PendingReview = "PendingReview";
    public const string Accepted = "Accepted";
    public const string Rejected = "Rejected";
    public const string EditedBeforeAcceptance = "EditedBeforeAcceptance";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        PendingReview,
        Accepted,
        Rejected,
        EditedBeforeAcceptance
    };
}

public static class AIConnectionStatus
{
    public const string Connected = "Connected";
    public const string NotConnected = "NotConnected";
    public const string Invalid = "Invalid";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Connected,
        NotConnected,
        Invalid
    };
}

public static class AIProviders
{
    public const string OpenAI = "openai";
    public const string Gemini = "gemini";
    public const string Google = "gemini";
    public const string Claude = "claude";
    public const string OpenRouter = "openrouter";
    public const string NvidiaNim = "nvidianim";
    public const string Nvidia = "nvidianim";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        OpenAI,
        Gemini,
        Claude,
        OpenRouter,
        NvidiaNim
    };
}

public static class AIModelStatus
{
    public const string Available = "Available";
    public const string Unavailable = "Unavailable";
    public const string Deprecated = "Deprecated";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Available,
        Unavailable,
        Deprecated
    };
}

public static class AIModelCapability
{
    public const string Content = "Content";
    public const string Image = "Image";
    public const string Both = "Both";
    public const string General = "General";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Content,
        Image,
        Both,
        General
    };
}
