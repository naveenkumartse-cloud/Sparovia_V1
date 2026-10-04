using Sparovia.Domain.Constants;

namespace Sparovia.Application.AI;

public class ApprovedAIModel
{
    public required string Key { get; set; }
    public required string ProviderKey { get; set; }
    public required string DisplayName { get; set; }
    public required string Description { get; set; }
    public required string Capability { get; set; } // "Content", "Image", "Both"
    public required string Status { get; set; } // "Available", "Unavailable", "Deprecated"
    public bool IsDefault { get; set; }
    public bool IsRecommended { get; set; }
    public bool IsFreeTier { get; set; }
    public int SortOrder { get; set; } = 10;

    // Internal mapping to provider SDK/API identifier (NEVER exposed to frontend!)
    internal string ProviderModelId { get; set; } = string.Empty;
}

/// <summary>
/// Central authoritative Model Registry for Sparovia.
/// All available models come from this controlled allowlist.
/// Clients cannot add arbitrary models, modify raw provider strings, or register custom endpoints.
/// </summary>
public static class AIModelRegistry
{
    public const string DefaultOpenAIModel = "gpt-4o-mini";
    public const string DefaultGeminiModel = "gemini-1.5-flash";
    public const string DefaultClaudeModel = "claude-3-5-haiku";
    public const string DefaultOpenRouterModel = "openrouter/free";
    public const string DefaultNvidiaNimModel = "nvidia-llama-3.1-8b";

    private static readonly IReadOnlyList<ApprovedAIModel> Models = new List<ApprovedAIModel>
    {
        // OpenAI models
        new()
        {
            Key = "gpt-4o-mini",
            ProviderKey = AIProviders.OpenAI,
            DisplayName = "GPT-4o Mini",
            Description = "Fast, cost-efficient model for quick wording, headline improvements, and concise copy.",
            Capability = AIModelCapability.Content,
            Status = AIModelStatus.Available,
            IsDefault = true,
            IsRecommended = false,
            IsFreeTier = false,
            SortOrder = 1,
            ProviderModelId = "gpt-4o-mini"
        },
        new()
        {
            Key = "gpt-4o",
            ProviderKey = AIProviders.OpenAI,
            DisplayName = "GPT-4o (Multimodal)",
            Description = "Advanced flagship reasoning for nuanced brand storytelling and vision/image quality analysis.",
            Capability = AIModelCapability.Both,
            Status = AIModelStatus.Available,
            IsDefault = false,
            IsRecommended = true,
            IsFreeTier = false,
            SortOrder = 2,
            ProviderModelId = "gpt-4o"
        },

        // Google Gemini models
        new()
        {
            Key = "gemini-1.5-flash",
            ProviderKey = AIProviders.Gemini,
            DisplayName = "Gemini 1.5 Flash",
            Description = "High-throughput multimodal understanding and responsive content refinement.",
            Capability = AIModelCapability.Content,
            Status = AIModelStatus.Available,
            IsDefault = true,
            IsRecommended = false,
            IsFreeTier = false,
            SortOrder = 1,
            ProviderModelId = "gemini-1.5-flash"
        },
        new()
        {
            Key = "gemini-1.5-pro",
            ProviderKey = AIProviders.Gemini,
            DisplayName = "Gemini 1.5 Pro (Multimodal)",
            Description = "Complex reasoning and multimodal analysis for both content and image workflows.",
            Capability = AIModelCapability.Both,
            Status = AIModelStatus.Available,
            IsDefault = false,
            IsRecommended = true,
            IsFreeTier = false,
            SortOrder = 2,
            ProviderModelId = "gemini-1.5-pro"
        },
        new()
        {
            Key = "gemini-2.0-flash",
            ProviderKey = AIProviders.Gemini,
            DisplayName = "Gemini 2.0 Flash",
            Description = "Next-generation high-speed multimodal reasoning and responsive copy generation.",
            Capability = AIModelCapability.Both,
            Status = AIModelStatus.Available,
            IsDefault = false,
            IsRecommended = false,
            IsFreeTier = false,
            SortOrder = 3,
            ProviderModelId = "gemini-2.0-flash"
        },

        // Anthropic Claude models
        new()
        {
            Key = "claude-3-5-haiku",
            ProviderKey = AIProviders.Claude,
            DisplayName = "Claude 3.5 Haiku",
            Description = "Fast, responsive copy refinement and structural clarity with minimal latency.",
            Capability = AIModelCapability.Content,
            Status = AIModelStatus.Available,
            IsDefault = true,
            IsRecommended = false,
            IsFreeTier = false,
            SortOrder = 1,
            ProviderModelId = "claude-3-5-haiku-20241022"
        },
        new()
        {
            Key = "claude-3-5-sonnet",
            ProviderKey = AIProviders.Claude,
            DisplayName = "Claude 3.5 Sonnet (Multimodal)",
            Description = "Nuanced editorial storytelling, brand voice elevation, and vision inspection.",
            Capability = AIModelCapability.Both,
            Status = AIModelStatus.Available,
            IsDefault = false,
            IsRecommended = true,
            IsFreeTier = false,
            SortOrder = 2,
            ProviderModelId = "claude-3-5-sonnet-20241022"
        },

        // OpenRouter models (with free model access)
        new()
        {
            Key = "openrouter/free",
            ProviderKey = AIProviders.OpenRouter,
            DisplayName = "OpenRouter Free Router",
            Description = "Auto-routing endpoint dynamically selecting available high-performance free models.",
            Capability = AIModelCapability.Content,
            Status = AIModelStatus.Available,
            IsDefault = true,
            IsRecommended = false,
            IsFreeTier = true,
            SortOrder = 1,
            ProviderModelId = "openrouter/free"
        },
        new()
        {
            Key = "openrouter-gemini-2.0-flash-free",
            ProviderKey = AIProviders.OpenRouter,
            DisplayName = "Gemini 2.0 Flash (Free)",
            Description = "Next-generation multimodal reasoning and copy refinement via OpenRouter free tier.",
            Capability = AIModelCapability.Both,
            Status = AIModelStatus.Available,
            IsDefault = false,
            IsRecommended = true,
            IsFreeTier = true,
            SortOrder = 2,
            ProviderModelId = "google/gemini-2.0-flash-exp:free"
        },
        new()
        {
            Key = "openrouter-llama-3.3-70b-free",
            ProviderKey = AIProviders.OpenRouter,
            DisplayName = "Llama 3.3 70B Instruct (Free)",
            Description = "State-of-the-art open-weight 70B reasoning and polished drafting via OpenRouter free tier.",
            Capability = AIModelCapability.Content,
            Status = AIModelStatus.Available,
            IsDefault = false,
            IsRecommended = false,
            IsFreeTier = true,
            SortOrder = 3,
            ProviderModelId = "meta-llama/llama-3.3-70b-instruct:free"
        },
        new()
        {
            Key = "openrouter-qwen-2.5-72b-free",
            ProviderKey = AIProviders.OpenRouter,
            DisplayName = "Qwen 2.5 72B Instruct (Free)",
            Description = "High-precision multilingual reasoning and structured copy via OpenRouter free tier.",
            Capability = AIModelCapability.Content,
            Status = AIModelStatus.Available,
            IsDefault = false,
            IsRecommended = false,
            IsFreeTier = true,
            SortOrder = 4,
            ProviderModelId = "qwen/qwen-2.5-72b-instruct:free"
        },

        // NVIDIA NIM API models (free-endpoint models)
        new()
        {
            Key = "nvidia-llama-3.1-8b",
            ProviderKey = AIProviders.NvidiaNim,
            DisplayName = "Llama 3.1 8B Instruct (Free Endpoint)",
            Description = "Fast, lightweight instruction following on NVIDIA NIM accelerated cloud infrastructure.",
            Capability = AIModelCapability.Content,
            Status = AIModelStatus.Available,
            IsDefault = true,
            IsRecommended = false,
            IsFreeTier = true,
            SortOrder = 1,
            ProviderModelId = "meta/llama-3.1-8b-instruct"
        },
        new()
        {
            Key = "nvidia-llama-3.1-70b",
            ProviderKey = AIProviders.NvidiaNim,
            DisplayName = "Llama 3.1 70B Instruct (Free Endpoint)",
            Description = "Flagship enterprise reasoning and sophisticated brand copy on NVIDIA NIM API.",
            Capability = AIModelCapability.Content,
            Status = AIModelStatus.Available,
            IsDefault = false,
            IsRecommended = true,
            IsFreeTier = true,
            SortOrder = 2,
            ProviderModelId = "meta/llama-3.1-70b-instruct"
        },
        new()
        {
            Key = "nvidia-mistral-7b",
            ProviderKey = AIProviders.NvidiaNim,
            DisplayName = "Mistral 7B Instruct v0.3 (Free Endpoint)",
            Description = "Concise instruction following and punchy marketing copy on NVIDIA NIM API.",
            Capability = AIModelCapability.Content,
            Status = AIModelStatus.Available,
            IsDefault = false,
            IsRecommended = false,
            IsFreeTier = true,
            SortOrder = 3,
            ProviderModelId = "mistralai/mistral-7b-instruct-v0.3"
        },
        new()
        {
            Key = "nvidia-nemotron-70b",
            ProviderKey = AIProviders.NvidiaNim,
            DisplayName = "Llama 3.1 Nemotron 70B (Free Endpoint)",
            Description = "NVIDIA-aligned high-precision reasoning and professional copy generation.",
            Capability = AIModelCapability.Content,
            Status = AIModelStatus.Available,
            IsDefault = false,
            IsRecommended = false,
            IsFreeTier = true,
            SortOrder = 4,
            ProviderModelId = "nvidia/llama-3.1-nemotron-70b-instruct"
        }
    };

    public static IReadOnlyList<ApprovedAIModel> GetAllApprovedModels() => Models;

    public static IReadOnlyList<ApprovedAIModel> GetModelsByProvider(string providerKey)
    {
        if (string.IsNullOrWhiteSpace(providerKey)) return Array.Empty<ApprovedAIModel>();
        var normKey = providerKey.Trim();
        if (string.Equals(normKey, "nvidia", StringComparison.OrdinalIgnoreCase))
            normKey = AIProviders.NvidiaNim;
        else if (string.Equals(normKey, "google", StringComparison.OrdinalIgnoreCase))
            normKey = AIProviders.Gemini;

        return Models.Where(m => string.Equals(m.ProviderKey, normKey, StringComparison.OrdinalIgnoreCase))
            .OrderBy(m => m.SortOrder)
            .ToList();
    }

    public static ApprovedAIModel? GetModelByKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key)) return null;
        var trimmed = key.Trim();
        return Models.FirstOrDefault(m => 
            string.Equals(m.Key, trimmed, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(m.ProviderModelId, trimmed, StringComparison.OrdinalIgnoreCase));
    }

    public static bool IsApproved(string key)
    {
        return GetModelByKey(key) != null;
    }

    public static bool IsSelectable(string key, out string? rejectionCode, out string? rejectionMessage)
    {
        var model = GetModelByKey(key);
        if (model == null)
        {
            rejectionCode = AIErrorCodes.ModelNotFound;
            rejectionMessage = $"Model '{key}' is not an approved Sparovia AI model.";
            return false;
        }

        if (string.Equals(model.Status, AIModelStatus.Unavailable, StringComparison.OrdinalIgnoreCase))
        {
            rejectionCode = AIErrorCodes.ModelUnavailable;
            rejectionMessage = $"Model '{model.DisplayName}' is currently unavailable for selection.";
            return false;
        }

        if (string.Equals(model.Status, AIModelStatus.Deprecated, StringComparison.OrdinalIgnoreCase))
        {
            rejectionCode = AIErrorCodes.ModelDeprecated;
            rejectionMessage = $"Model '{model.DisplayName}' is deprecated and cannot be newly selected.";
            return false;
        }

        rejectionCode = null;
        rejectionMessage = null;
        return true;
    }

    /// <summary>
    /// Authoritative server-side validation rule:
    /// 1. Verifies that provider exists and is approved in Sparovia.
    /// 2. Verifies that candidate model exists and is approved in Sparovia allowlist.
    /// 3. Verifies that model belongs to the specified provider.
    /// 4. Verifies that model is currently available/selectable (not unavailable, not deprecated).
    /// </summary>
    public static bool ValidateModelSelection(
        string providerKey,
        string modelKey,
        out ApprovedAIModel? model,
        out string? errorCode,
        out string? errorMessage)
    {
        model = null;

        var normProviderKey = providerKey?.Trim() ?? string.Empty;
        if (string.Equals(normProviderKey, "nvidia", StringComparison.OrdinalIgnoreCase))
            normProviderKey = AIProviders.NvidiaNim;
        else if (string.Equals(normProviderKey, "google", StringComparison.OrdinalIgnoreCase))
            normProviderKey = AIProviders.Gemini;

        if (string.IsNullOrWhiteSpace(normProviderKey) || !AIProviderRegistry.IsApproved(normProviderKey))
        {
            errorCode = AIErrorCodes.ProviderNotFound;
            errorMessage = $"Provider '{providerKey}' is not an approved Sparovia AI provider.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(modelKey))
        {
            errorCode = AIErrorCodes.ModelNotFound;
            errorMessage = "Model identifier is required.";
            return false;
        }

        var candidate = GetModelByKey(modelKey);
        if (candidate == null)
        {
            errorCode = AIErrorCodes.ModelNotFound;
            errorMessage = $"Model '{modelKey}' is not an approved Sparovia AI model.";
            return false;
        }

        if (!string.Equals(candidate.ProviderKey, normProviderKey, StringComparison.OrdinalIgnoreCase))
        {
            errorCode = AIErrorCodes.ProviderModelMismatch;
            errorMessage = $"Model '{candidate.DisplayName}' does not belong to provider '{providerKey}'.";
            return false;
        }

        if (string.Equals(candidate.Status, AIModelStatus.Unavailable, StringComparison.OrdinalIgnoreCase))
        {
            errorCode = AIErrorCodes.ModelUnavailable;
            errorMessage = $"Model '{candidate.DisplayName}' is currently unavailable for selection.";
            return false;
        }

        if (string.Equals(candidate.Status, AIModelStatus.Deprecated, StringComparison.OrdinalIgnoreCase))
        {
            errorCode = AIErrorCodes.ModelDeprecated;
            errorMessage = $"Model '{candidate.DisplayName}' is deprecated and cannot be selected.";
            return false;
        }

        model = candidate;
        errorCode = null;
        errorMessage = null;
        return true;
    }

    public static bool SupportsCapability(string modelKey, string requiredCapability)
    {
        var model = GetModelByKey(modelKey);
        if (model == null) return false;

        // "Both" multimodal models satisfy both Content and Image
        if (string.Equals(model.Capability, AIModelCapability.Both, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return string.Equals(model.Capability, requiredCapability, StringComparison.OrdinalIgnoreCase);
    }

    public static string ResolveProviderModelId(string modelKey, string? providerKey = null)
    {
        var model = GetModelByKey(modelKey);
        if (model != null) return model.ProviderModelId;

        if (!string.IsNullOrWhiteSpace(providerKey))
        {
            var defKey = DefaultModelKeyFor(providerKey);
            var defModel = GetModelByKey(defKey);
            if (defModel != null) return defModel.ProviderModelId;
        }

        return "gpt-4o-mini";
    }

    public static string DefaultModelKeyFor(string providerKey)
    {
        var norm = providerKey?.Trim() ?? string.Empty;
        if (string.Equals(norm, "nvidia", StringComparison.OrdinalIgnoreCase))
            norm = AIProviders.NvidiaNim;
        else if (string.Equals(norm, "google", StringComparison.OrdinalIgnoreCase))
            norm = AIProviders.Gemini;

        if (string.Equals(norm, AIProviders.OpenRouter, StringComparison.OrdinalIgnoreCase))
            return DefaultOpenRouterModel;
        if (string.Equals(norm, AIProviders.NvidiaNim, StringComparison.OrdinalIgnoreCase))
            return DefaultNvidiaNimModel;
        if (string.Equals(norm, AIProviders.Gemini, StringComparison.OrdinalIgnoreCase))
            return DefaultGeminiModel;
        if (string.Equals(norm, AIProviders.Claude, StringComparison.OrdinalIgnoreCase))
            return DefaultClaudeModel;

        var providerModels = GetModelsByProvider(norm);
        var def = providerModels.FirstOrDefault(m => m.IsDefault);
        return def?.Key ?? providerModels.FirstOrDefault()?.Key ?? DefaultOpenAIModel;
    }
}
