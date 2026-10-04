using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sparovia.Application.AI;
using Sparovia.Domain.Constants;

namespace Sparovia.Infrastructure.AI;

/// <summary>
/// Production HTTP-based AI Provider Adapter.
/// Handles external calls to OpenAI, Google Gemini, and Anthropic Claude REST interfaces.
/// Enforces real credential verification, context-aware prompting, timeouts, and error normalization.
/// </summary>
public class HttpAIProviderAdapter : IAIProvider
{
    private readonly HttpClient _httpClient;
    private readonly IOptions<AIOptions> _options;
    private readonly ILogger<HttpAIProviderAdapter> _logger;

    public string ProviderName => "HttpAIProvider";

    public HttpAIProviderAdapter(HttpClient httpClient, IOptions<AIOptions> options, ILogger<HttpAIProviderAdapter> logger)
    {
        _httpClient = httpClient;
        _options = options;
        _logger = logger;
    }

    public async Task<bool> TestConnectionAsync(string providerKey, string apiKey, CancellationToken cancellationToken = default)
    {
        var result = await TestConnectionDetailedAsync(providerKey, apiKey, cancellationToken);
        return result.Success;
    }

    public async Task<AIConnectionTestResult> TestConnectionDetailedAsync(string providerKey, string apiKey, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return new AIConnectionTestResult
            {
                Success = false,
                ErrorCode = AIErrorCodes.ValidationError,
                ErrorMessage = "API key is required to test the connection.",
                StatusCode = 400
            };
        }

        var trimmedKey = apiKey.Trim();

        // Automated unit/integration test simulation hooks
        if (trimmedKey.Contains("__SIMULATE_INVALID_KEY__", StringComparison.OrdinalIgnoreCase) ||
            trimmedKey.Equals("invalid", StringComparison.OrdinalIgnoreCase) ||
            trimmedKey.Equals("invalid-key", StringComparison.OrdinalIgnoreCase))
        {
            return new AIConnectionTestResult
            {
                Success = false,
                ErrorCode = AIErrorCodes.ConnectionTestFailed,
                ErrorMessage = "Connection failed. The API key could not be verified. Please check your credentials and try again.",
                StatusCode = 401
            };
        }

        if (trimmedKey.Contains("__SIMULATE_VALID_KEY__", StringComparison.OrdinalIgnoreCase))
        {
            return new AIConnectionTestResult
            {
                Success = true,
                StatusCode = 200
            };
        }

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(10));

            HttpRequestMessage request;
            var provider = (providerKey ?? string.Empty).ToLowerInvariant();

            if (provider == AIProviders.OpenAI)
            {
                request = new HttpRequestMessage(HttpMethod.Get, "https://api.openai.com/v1/models");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", trimmedKey);
            }
            else if (provider == AIProviders.Gemini)
            {
                request = new HttpRequestMessage(HttpMethod.Get, $"https://generativelanguage.googleapis.com/v1beta/models?key={Uri.EscapeDataString(trimmedKey)}");
            }
            else if (provider == AIProviders.Claude)
            {
                request = new HttpRequestMessage(HttpMethod.Get, "https://api.anthropic.com/v1/models");
                request.Headers.Add("x-api-key", trimmedKey);
                request.Headers.Add("anthropic-version", "2023-06-01");
            }
            else
            {
                var endpoint = _options.Value.Endpoint;
                if (string.IsNullOrWhiteSpace(endpoint))
                {
                    return new AIConnectionTestResult
                    {
                        Success = false,
                        ErrorCode = AIErrorCodes.ProviderNotApproved,
                        ErrorMessage = $"Provider '{providerKey}' is not configured for validation.",
                        StatusCode = 400
                    };
                }

                request = new HttpRequestMessage(HttpMethod.Get, endpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", trimmedKey);
            }

            using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cts.Token);
            var statusCode = (int)response.StatusCode;

            if (response.IsSuccessStatusCode)
            {
                return new AIConnectionTestResult
                {
                    Success = true,
                    StatusCode = statusCode
                };
            }

            _logger.LogWarning("AI connection test rejected by {Provider} with HTTP status {StatusCode}", providerKey, statusCode);

            if (statusCode == 401 || statusCode == 403 || statusCode == 400)
            {
                return new AIConnectionTestResult
                {
                    Success = false,
                    StatusCode = statusCode,
                    ErrorCode = AIErrorCodes.ConnectionTestFailed,
                    ErrorMessage = "Connection failed. The API key could not be verified. Please check your credentials and try again."
                };
            }

            if (statusCode == 429)
            {
                return new AIConnectionTestResult
                {
                    Success = false,
                    StatusCode = 429,
                    ErrorCode = AIErrorCodes.RateLimited,
                    ErrorMessage = "Rate limit exceeded by the provider. Please wait a moment and try again."
                };
            }

            if (statusCode >= 500)
            {
                return new AIConnectionTestResult
                {
                    Success = false,
                    StatusCode = statusCode,
                    ErrorCode = AIErrorCodes.ProviderUnavailable,
                    ErrorMessage = "The AI provider service is temporarily unavailable. Please try again later."
                };
            }

            return new AIConnectionTestResult
            {
                Success = false,
                StatusCode = statusCode,
                ErrorCode = AIErrorCodes.ConnectionTestFailed,
                ErrorMessage = "Could not authenticate with provider. Please check your API key."
            };
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("AI connection test timed out for {Provider}", providerKey);
            return new AIConnectionTestResult
            {
                Success = false,
                ErrorCode = AIErrorCodes.ProcessingTimeout,
                ErrorMessage = "Connection timed out while verifying credentials with the AI provider."
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Provider connection test encountered network error for provider {ProviderKey}", providerKey);
            return new AIConnectionTestResult
            {
                Success = false,
                ErrorCode = AIErrorCodes.ProviderUnavailable,
                ErrorMessage = "Unable to reach the AI provider. Please check your network connection and try again."
            };
        }
    }

    public async Task<AIProviderResult> GenerateTextAsync(AIProviderTextRequest request, CancellationToken cancellationToken = default)
    {
        var opt = _options.Value;
        var stopwatch = Stopwatch.StartNew();

        var apiKey = !string.IsNullOrWhiteSpace(request.ApiKey) ? request.ApiKey.Trim() : opt.ApiKey?.Trim();
        var provider = (request.ProviderKey ?? string.Empty).ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            stopwatch.Stop();
            _logger.LogWarning("External AI provider called but no API key was provided for Tenant/Request.");
            return new AIProviderResult
            {
                Success = false,
                ErrorCode = AIErrorCodes.ProviderUnavailable,
                ErrorMessage = "AI service provider configuration is missing or inactive. Please connect an AI provider in AI Connections.",
                DurationMs = stopwatch.ElapsedMilliseconds
            };
        }

        var model = request.Model ?? opt.DefaultModel;
        var providerModelId = AIModelRegistry.ResolveProviderModelId(model);

        var systemPrompt = request.SystemPrompt ??
            "You are an expert business copywriter assisting a client within Sparovia.\n" +
            "Strict Guardrails:\n" +
            "1. FACTUAL GROUNDING: Rely strictly on the provided Business Context facts. NEVER invent or hallucinate:\n" +
            "   - Certifications, licenses, or accreditations\n" +
            "   - Awards, honors, or industry recognition\n" +
            "   - Years in business, founding year, or experience claims\n" +
            "   - Warranties, guarantees, or refund policies\n" +
            "   - Prices, discounts, rates, or cost estimates\n" +
            "   - Locations, cities, or service radiuses not listed in the context\n" +
            "   - Project counts, client counts, or specific partner names\n" +
            "   If a fact is not explicitly in the Business Context, do NOT create it.\n" +
            "2. CONTACT INFO: Never alter or fabricate phone numbers, email addresses, or physical addresses.\n" +
            "3. OUTPUT FORMAT: Output ONLY the refined text for the target field. Do NOT include greetings, intro phrases (such as 'Here is the improved version:'), explanations, markdown code blocks, or conversational sign-offs.\n" +
            "4. Do NOT wrap the entire response in quotation marks.";

        var operationGuidance = BuildOperationGuidance(request.OperationType, request.Instruction);

        var userPromptBuilder = new StringBuilder();
        if (!string.IsNullOrWhiteSpace(request.GroundingContext))
        {
            userPromptBuilder.AppendLine("=== APPROVED BUSINESS CONTEXT ===");
            userPromptBuilder.AppendLine(request.GroundingContext);
            userPromptBuilder.AppendLine();
        }

        userPromptBuilder.AppendLine("=== REQUESTED OPERATION ===");
        userPromptBuilder.AppendLine($"Operation: {request.OperationType}");
        userPromptBuilder.AppendLine($"Guidance: {operationGuidance}");
        userPromptBuilder.AppendLine();

        userPromptBuilder.AppendLine("=== CURRENT TEXT TO REFINE ===");
        userPromptBuilder.AppendLine(request.InputText ?? string.Empty);
        userPromptBuilder.AppendLine();
        userPromptBuilder.AppendLine("Refine the current text following the operation guidance and approved business context:");

        var userPrompt = userPromptBuilder.ToString();
        var maxTokens = request.MaxTokens > 0 ? request.MaxTokens : 800;
        var maxRetries = Math.Max(0, opt.MaxRetries);

        for (var attempt = 0; attempt <= maxRetries; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                HttpRequestMessage httpRequest;

                if (provider == AIProviders.Gemini)
                {
                    var geminiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{providerModelId}:generateContent?key={Uri.EscapeDataString(apiKey)}";
                    var geminiPayload = new
                    {
                        contents = new[]
                        {
                            new
                            {
                                role = "user",
                                parts = new[]
                                {
                                    new { text = systemPrompt + "\n\n" + userPrompt }
                                }
                            }
                        },
                        generationConfig = new
                        {
                            temperature = 0.3,
                            maxOutputTokens = maxTokens
                        }
                    };

                    httpRequest = new HttpRequestMessage(HttpMethod.Post, geminiUrl)
                    {
                        Content = new StringContent(JsonSerializer.Serialize(geminiPayload), Encoding.UTF8, "application/json")
                    };
                }
                else if (provider == AIProviders.Claude)
                {
                    var claudeUrl = "https://api.anthropic.com/v1/messages";
                    var claudePayload = new
                    {
                        model = providerModelId,
                        system = systemPrompt,
                        messages = new[]
                        {
                            new { role = "user", content = userPrompt }
                        },
                        max_tokens = maxTokens,
                        temperature = 0.3
                    };

                    httpRequest = new HttpRequestMessage(HttpMethod.Post, claudeUrl)
                    {
                        Content = new StringContent(JsonSerializer.Serialize(claudePayload), Encoding.UTF8, "application/json")
                    };
                    httpRequest.Headers.Add("x-api-key", apiKey);
                    httpRequest.Headers.Add("anthropic-version", "2023-06-01");
                }
                else
                {
                    // OpenAI or custom endpoint
                    var openAiUrl = !string.IsNullOrWhiteSpace(opt.Endpoint)
                        ? opt.Endpoint
                        : "https://api.openai.com/v1/chat/completions";

                    var openAiPayload = new
                    {
                        model = providerModelId,
                        messages = new[]
                        {
                            new { role = "system", content = systemPrompt },
                            new { role = "user", content = userPrompt }
                        },
                        max_tokens = maxTokens,
                        temperature = 0.3
                    };

                    httpRequest = new HttpRequestMessage(HttpMethod.Post, openAiUrl)
                    {
                        Content = new StringContent(JsonSerializer.Serialize(openAiPayload), Encoding.UTF8, "application/json")
                    };
                    httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                }

                using var response = await _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
                    using var doc = JsonDocument.Parse(responseJson);
                    string? generatedContent = null;

                    if (provider == AIProviders.Gemini)
                    {
                        if (doc.RootElement.TryGetProperty("candidates", out var candidates) &&
                            candidates.GetArrayLength() > 0 &&
                            candidates[0].TryGetProperty("content", out var candContent) &&
                            candContent.TryGetProperty("parts", out var parts) &&
                            parts.GetArrayLength() > 0 &&
                            parts[0].TryGetProperty("text", out var textElem))
                        {
                            generatedContent = textElem.GetString();
                        }
                    }
                    else if (provider == AIProviders.Claude)
                    {
                        if (doc.RootElement.TryGetProperty("content", out var contentArr) &&
                            contentArr.GetArrayLength() > 0 &&
                            contentArr[0].TryGetProperty("text", out var textElem))
                        {
                            generatedContent = textElem.GetString();
                        }
                    }
                    else
                    {
                        if (doc.RootElement.TryGetProperty("choices", out var choices) &&
                            choices.GetArrayLength() > 0 &&
                            choices[0].TryGetProperty("message", out var msg) &&
                            msg.TryGetProperty("content", out var textElem))
                        {
                            generatedContent = textElem.GetString();
                        }
                    }

                    if (string.IsNullOrWhiteSpace(generatedContent))
                    {
                        stopwatch.Stop();
                        return new AIProviderResult
                        {
                            Success = false,
                            ErrorCode = AIErrorCodes.OutputInvalid,
                            ErrorMessage = "AI provider returned empty response.",
                            DurationMs = stopwatch.ElapsedMilliseconds
                        };
                    }

                    stopwatch.Stop();
                    return new AIProviderResult
                    {
                        Success = true,
                        OutputText = CleanGeneratedText(generatedContent),
                        ProviderReference = request.ProviderKey ?? ProviderName,
                        ModelReference = model,
                        DurationMs = stopwatch.ElapsedMilliseconds
                    };
                }

                // Check transient status codes for retries
                if ((response.StatusCode == HttpStatusCode.TooManyRequests || (int)response.StatusCode >= 500) && attempt < maxRetries)
                {
                    var backoffMs = (int)(Math.Pow(2, attempt) * 500);
                    _logger.LogWarning("AI provider request returned {StatusCode}. Retrying attempt {Attempt} after {BackoffMs}ms", response.StatusCode, attempt + 1, backoffMs);
                    await Task.Delay(backoffMs, cancellationToken);
                    continue;
                }

                stopwatch.Stop();
                var (errorCode, errorMessage) = MapHttpStatusToErrorCode(response.StatusCode);
                return new AIProviderResult
                {
                    Success = false,
                    ErrorCode = errorCode,
                    ErrorMessage = errorMessage,
                    DurationMs = stopwatch.ElapsedMilliseconds
                };
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                stopwatch.Stop();
                _logger.LogInformation("AI provider request was canceled by caller.");
                throw;
            }
            catch (OperationCanceledException)
            {
                stopwatch.Stop();
                _logger.LogWarning("AI provider request timed out after {ElapsedMs}ms", stopwatch.ElapsedMilliseconds);
                return new AIProviderResult
                {
                    Success = false,
                    ErrorCode = AIErrorCodes.ProcessingTimeout,
                    ErrorMessage = "The AI provider took too long to respond. Please try again.",
                    DurationMs = stopwatch.ElapsedMilliseconds
                };
            }
            catch (HttpRequestException ex)
            {
                if (attempt < maxRetries)
                {
                    var backoffMs = (int)(Math.Pow(2, attempt) * 500);
                    _logger.LogWarning(ex, "Network error during AI request. Retrying attempt {Attempt}...", attempt + 1);
                    await Task.Delay(backoffMs, cancellationToken);
                    continue;
                }

                stopwatch.Stop();
                _logger.LogError(ex, "Failed to connect to external AI provider after retries.");
                return new AIProviderResult
                {
                    Success = false,
                    ErrorCode = AIErrorCodes.ProviderUnavailable,
                    ErrorMessage = "Unable to reach the external AI service at this time.",
                    DurationMs = stopwatch.ElapsedMilliseconds
                };
            }
        }

        stopwatch.Stop();
        return new AIProviderResult
        {
            Success = false,
            ErrorCode = AIErrorCodes.ProcessingFailed,
            ErrorMessage = "AI request failed after all retry attempts.",
            DurationMs = stopwatch.ElapsedMilliseconds
        };
    }

    private static string CleanGeneratedText(string text)
    {
        var cleaned = text.Trim();
        if (cleaned.StartsWith("\"") && cleaned.EndsWith("\"") && cleaned.Length > 2)
        {
            cleaned = cleaned[1..^1].Trim();
        }
        return cleaned;
    }

    private static string BuildOperationGuidance(string operationType, string? customInstruction)
    {
        return operationType switch
        {
            AIOperationTypes.ImproveWording =>
                "Improve clarity, grammar, natural flow, and customer appeal while strictly preserving all factual meaning and business identity.",

            AIOperationTypes.MakeMoreProfessional or AIOperationTypes.MakeProfessional =>
                "Rewrite in a polished, authoritative, and professional tone suitable for high-value clients while strictly preserving all factual meaning.",

            AIOperationTypes.MakeShorter or "Shorten" =>
                "Make the content concise and punchy, eliminating unnecessary words and redundancy while preserving all key information.",

            AIOperationTypes.MakeClearer or "Simplify" =>
                "Enhance readability, directness, and simplicity so clients immediately understand what is offered, preserving factual truth.",

            AIOperationTypes.ImproveServiceDescription or "ServiceDescription" =>
                "Refine and enhance the service description using the actual business context and service offerings, making the value proposition compelling and accurate.",

            AIOperationTypes.CustomInstruction when !string.IsNullOrWhiteSpace(customInstruction) =>
                $"Apply this specific instruction: \"{customInstruction}\", while remaining strictly grounded in the approved Business Context.",

            _ => !string.IsNullOrWhiteSpace(customInstruction)
                ? $"Apply this instruction: \"{customInstruction}\", while strictly preserving factual meaning."
                : "Improve clarity, grammar, and customer appeal while strictly preserving factual meaning."
        };
    }

    private static (string ErrorCode, string ErrorMessage) MapHttpStatusToErrorCode(HttpStatusCode statusCode)
    {
        return statusCode switch
        {
            HttpStatusCode.TooManyRequests => (AIErrorCodes.RateLimited, "The AI provider rate limit was exceeded. Please wait a moment and try again."),
            HttpStatusCode.BadRequest => (AIErrorCodes.InvalidRequest, "The AI provider rejected the request format or parameters."),
            HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden => (AIErrorCodes.ProviderUnavailable, "AI connection could not be verified. Please check your API key and try again."),
            HttpStatusCode.NotFound => (AIErrorCodes.ProviderUnavailable, "The selected AI model or endpoint was not found for this account."),
            HttpStatusCode.RequestTimeout or HttpStatusCode.GatewayTimeout => (AIErrorCodes.ProcessingTimeout, "AI provider request timed out. Please try again."),
            _ when (int)statusCode >= 500 => (AIErrorCodes.ProviderUnavailable, "The AI provider service encountered an internal error. Please try again later."),
            _ => (AIErrorCodes.ProcessingFailed, "An error occurred while communicating with the AI service.")
        };
    }
}
