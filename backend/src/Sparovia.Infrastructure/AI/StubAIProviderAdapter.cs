using System.Diagnostics;
using Sparovia.Application.AI;
using Sparovia.Domain.Constants;

namespace Sparovia.Infrastructure.AI;

/// <summary>
/// Deterministic Stub AI Provider Adapter for local testing, integration tests, and offline development.
/// Generates contextually grounded improvements according to Sparovia AI rules.
/// </summary>
public class StubAIProviderAdapter : IAIProvider
{
    public string ProviderName => "StubAIProvider";

    public async Task<bool> TestConnectionAsync(string providerKey, string apiKey, CancellationToken cancellationToken = default)
    {
        var result = await TestConnectionDetailedAsync(providerKey, apiKey, null, cancellationToken);
        return result.Success;
    }

    public async Task<AIConnectionTestResult> TestConnectionDetailedAsync(string providerKey, string apiKey, string? modelKey = null, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await Task.Delay(10, cancellationToken);

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return new AIConnectionTestResult
            {
                Success = false,
                ErrorCode = AIErrorCodes.ValidationError,
                ErrorMessage = "API key cannot be empty.",
                StatusCode = 400
            };
        }

        if (apiKey.Contains("__SIMULATE_INVALID_KEY__", StringComparison.OrdinalIgnoreCase) ||
            apiKey.Equals("invalid", StringComparison.OrdinalIgnoreCase) ||
            apiKey.Equals("invalid-key", StringComparison.OrdinalIgnoreCase))
        {
            return new AIConnectionTestResult
            {
                Success = false,
                ErrorCode = AIErrorCodes.ConnectionTestFailed,
                ErrorMessage = "Could not authenticate with provider. Please check your credentials.",
                StatusCode = 401
            };
        }

        if (apiKey.Contains("__SIMULATE_QUOTA_EXCEEDED__", StringComparison.OrdinalIgnoreCase))
        {
            return new AIConnectionTestResult
            {
                Success = false,
                ErrorCode = AIErrorCodes.QuotaExceeded,
                ErrorMessage = "The AI provider rejected the request because your account has exhausted its quota or prepaid credit balance. Please check your provider billing and credit balance.",
                StatusCode = 429
            };
        }

        return new AIConnectionTestResult
        {
            Success = true,
            StatusCode = 200
        };
    }

    public async Task<AIProviderResult> GenerateTextAsync(AIProviderTextRequest request, CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();

        // Check cancellation
        cancellationToken.ThrowIfCancellationRequested();

        // Simulate lightweight processing time
        await Task.Delay(10, cancellationToken);

        // Simulation hook for invalid key
        if (!string.IsNullOrWhiteSpace(request.ApiKey) &&
            (request.ApiKey.Contains("__SIMULATE_INVALID_KEY__", StringComparison.OrdinalIgnoreCase) ||
             request.ApiKey.Equals("invalid", StringComparison.OrdinalIgnoreCase)))
        {
            stopwatch.Stop();
            return new AIProviderResult
            {
                Success = false,
                ErrorCode = AIErrorCodes.ProviderUnavailable,
                ErrorMessage = "Could not authenticate with AI provider. Invalid API key.",
                DurationMs = stopwatch.ElapsedMilliseconds
            };
        }

        // Simulation hook for test failure triggers
        if (request.InputText.Contains("__SIMULATE_PROVIDER_ERROR__"))
        {
            stopwatch.Stop();
            return new AIProviderResult
            {
                Success = false,
                ErrorCode = AIErrorCodes.ProviderUnavailable,
                ErrorMessage = "The simulated external AI service is currently unavailable.",
                DurationMs = stopwatch.ElapsedMilliseconds
            };
        }

        if (request.InputText.Contains("__SIMULATE_TIMEOUT__"))
        {
            stopwatch.Stop();
            return new AIProviderResult
            {
                Success = false,
                ErrorCode = AIErrorCodes.ProcessingTimeout,
                ErrorMessage = "The simulated external AI service timed out.",
                DurationMs = stopwatch.ElapsedMilliseconds
            };
        }

        if (request.InputText.Contains("__SIMULATE_METADATA_ONLY__"))
        {
            stopwatch.Stop();
            return new AIProviderResult
            {
                Success = true,
                OutputText = "User Safety: safe",
                ProviderReference = request.ProviderKey ?? ProviderName,
                ModelReference = request.Model ?? "gpt-4o-mini",
                DurationMs = stopwatch.ElapsedMilliseconds
            };
        }

        if (request.InputText.Contains("__SIMULATE_SAFETY_PREAMBLE__"))
        {
            stopwatch.Stop();
            return new AIProviderResult
            {
                Success = true,
                OutputText = "User Safety: safe\nResponse Safety: safe\n\nKVN Interior provides bespoke interior design excellence tailored to your lifestyle.",
                ProviderReference = request.ProviderKey ?? ProviderName,
                ModelReference = request.Model ?? "gpt-4o-mini",
                DurationMs = stopwatch.ElapsedMilliseconds
            };
        }

        if (request.InputText.Contains("__SIMULATE_RAW_JSON_METADATA__"))
        {
            stopwatch.Stop();
            return new AIProviderResult
            {
                Success = true,
                OutputText = "{\"user_safety\": \"safe\", \"status\": \"ok\"}",
                ProviderReference = request.ProviderKey ?? ProviderName,
                ModelReference = request.Model ?? "gpt-4o-mini",
                DurationMs = stopwatch.ElapsedMilliseconds
            };
        }

        if (request.InputText.Contains("__SIMULATE_RAW_JSON_SUGGESTION__"))
        {
            stopwatch.Stop();
            return new AIProviderResult
            {
                Success = true,
                OutputText = "{\"suggestion\": \"Refined interior design services by KVN Interior.\"}",
                ProviderReference = request.ProviderKey ?? ProviderName,
                ModelReference = request.Model ?? "gpt-4o-mini",
                DurationMs = stopwatch.ElapsedMilliseconds
            };
        }

        if (request.InputText.Contains("__SIMULATE_THINK_TAGS__"))
        {
            stopwatch.Stop();
            return new AIProviderResult
            {
                Success = true,
                OutputText = "<think>Checking safety and refining wording</think>KVN Interior provides professional interior design tailored to each client.",
                ProviderReference = request.ProviderKey ?? ProviderName,
                ModelReference = request.Model ?? "gpt-4o-mini",
                DurationMs = stopwatch.ElapsedMilliseconds
            };
        }

        if (request.InputText.Contains("__SIMULATE_EMPTY_RESPONSE__"))
        {
            stopwatch.Stop();
            return new AIProviderResult
            {
                Success = true,
                OutputText = "   ",
                ProviderReference = request.ProviderKey ?? ProviderName,
                ModelReference = request.Model ?? "gpt-4o-mini",
                DurationMs = stopwatch.ElapsedMilliseconds
            };
        }

        var suggestion = GenerateSuggestion(request);
        stopwatch.Stop();

        return new AIProviderResult
        {
            Success = true,
            OutputText = suggestion,
            ProviderReference = request.ProviderKey ?? ProviderName,
            ModelReference = request.Model ?? "gpt-4o-mini",
            DurationMs = stopwatch.ElapsedMilliseconds
        };
    }

    private static string GenerateSuggestion(AIProviderTextRequest request)
    {
        var input = request.InputText.Trim();

        return request.OperationType switch
        {
            AIOperationTypes.MakeMoreProfessional or AIOperationTypes.MakeProfessional =>
                $"Elevating spaces with bespoke craftsmanship: {input.TrimEnd('.')}.",
            AIOperationTypes.MakeShorter =>
                input.Length > 60 ? input[..55].TrimEnd() + "..." : input,
            AIOperationTypes.MakeClearer =>
                $"Clear, reliable interior solutions tailored to your lifestyle: {input.TrimEnd('.')}.",
            AIOperationTypes.ImproveServiceDescription =>
                $"Expert end-to-end design and precision installation: {input.TrimEnd('.')}.",
            AIOperationTypes.CustomInstruction when !string.IsNullOrWhiteSpace(request.Instruction) =>
                $"{input.TrimEnd('.')} — refined per client request: {request.Instruction.Trim()}.",
            _ =>
                $"Premium quality design and execution: {input.TrimEnd('.')}."
        };
    }
}
