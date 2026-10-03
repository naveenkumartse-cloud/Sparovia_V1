namespace Sparovia.Infrastructure.AI;

public class AIOptions
{
    public const string SectionName = "AI";

    // "Stub" (default/safe/testing) or "Http" (custom/standard Chat API endpoint)
    public string Provider { get; set; } = "Stub";

    // Endpoint for HTTP provider (e.g. OpenAI/Azure/Gemini-compatible endpoint)
    public string? Endpoint { get; set; }

    // API Key loaded securely from environment / user-secrets / cloud secret store
    public string? ApiKey { get; set; }

    // Default model identifier
    public string DefaultModel { get; set; } = "gpt-4o-mini";

    // Allowlisted internal models mapped to provider-specific identifiers
    public Dictionary<string, string> AllowedModels { get; set; } = new(StringComparer.OrdinalIgnoreCase)
    {
        { "gpt-4o-mini", "gpt-4o-mini" },
        { "gpt-4o", "gpt-4o" },
        { "gemini-1.5-flash", "gemini-1.5-flash" },
        { "gemini-1.5-pro", "gemini-1.5-pro" },
        { "claude-3-5-haiku", "claude-3-5-haiku-20241022" },
        { "claude-3-5-sonnet", "claude-3-5-sonnet-20241022" }
    };

    // Timeout in seconds (default 30 seconds)
    public int TimeoutSeconds { get; set; } = 30;

    // Retry attempts for transient provider failures (5xx, 429)
    public int MaxRetries { get; set; } = 2;

    // Rate limits
    public int RateLimitPerMinute { get; set; } = 20;

    public int MaxInputLength { get; set; } = 4000;
    public int MaxInstructionLength { get; set; } = 1000;
}
