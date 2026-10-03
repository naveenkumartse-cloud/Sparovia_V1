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
        cancellationToken.ThrowIfCancellationRequested();
        await Task.Delay(10, cancellationToken);

        if (string.IsNullOrWhiteSpace(apiKey)) return false;
        if (apiKey.Contains("__SIMULATE_INVALID_KEY__", StringComparison.OrdinalIgnoreCase) ||
            apiKey.Equals("invalid", StringComparison.OrdinalIgnoreCase) ||
            apiKey.Equals("invalid-key", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return true;
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
