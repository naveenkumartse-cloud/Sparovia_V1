using Sparovia.Domain.Constants;

namespace Sparovia.Application.AI;

public class ApprovedAIProvider
{
    public required string Key { get; set; }
    public required string DisplayName { get; set; }
    public required string Description { get; set; }
    public required List<string> SupportedCapabilities { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public required string DefaultModelKey { get; set; }
    public string? DocumentationUrl { get; set; }
    public string? Placeholder { get; set; }
}

/// <summary>
/// Authoritative server-side Provider Registry for Sparovia.
/// Only Sparovia-approved providers can be selected by tenants.
/// Arbitrary client-created providers are prohibited.
/// </summary>
public static class AIProviderRegistry
{
    private static readonly IReadOnlyList<ApprovedAIProvider> Providers = new List<ApprovedAIProvider>
    {
        new()
        {
            Key = AIProviders.OpenAI,
            DisplayName = "OpenAI",
            Description = "Industry-leading reasoning, conversational nuance, and vision analysis.",
            SupportedCapabilities = new List<string> { AIModelCapability.Content, AIModelCapability.Both },
            IsActive = true,
            DefaultModelKey = "gpt-4o-mini",
            DocumentationUrl = "https://platform.openai.com/api-keys",
            Placeholder = "sk-proj-..."
        },
        new()
        {
            Key = AIProviders.Gemini,
            DisplayName = "Google Gemini",
            Description = "High-throughput multimodal understanding and responsive content refinement.",
            SupportedCapabilities = new List<string> { AIModelCapability.Content, AIModelCapability.Both },
            IsActive = true,
            DefaultModelKey = "gemini-1.5-flash",
            DocumentationUrl = "https://aistudio.google.com/app/apikey",
            Placeholder = "AIzaSy..."
        },
        new()
        {
            Key = AIProviders.Claude,
            DisplayName = "Anthropic Claude",
            Description = "Advanced editorial refinement, structural clarity, and vision reasoning.",
            SupportedCapabilities = new List<string> { AIModelCapability.Content, AIModelCapability.Both },
            IsActive = true,
            DefaultModelKey = "claude-3-5-haiku",
            DocumentationUrl = "https://console.anthropic.com/settings/keys",
            Placeholder = "sk-ant-api..."
        }
    };

    public static IReadOnlyList<ApprovedAIProvider> GetAllApprovedProviders() => Providers;

    public static ApprovedAIProvider? GetProviderByKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key)) return null;
        return Providers.FirstOrDefault(p => string.Equals(p.Key, key, StringComparison.OrdinalIgnoreCase));
    }

    public static bool IsApproved(string key)
    {
        return GetProviderByKey(key) != null;
    }
}
