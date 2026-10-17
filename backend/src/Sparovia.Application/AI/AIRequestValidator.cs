using System.Text.Json;
using System.Text.RegularExpressions;
using Sparovia.Domain.Constants;

namespace Sparovia.Application.AI;

public static class AIRequestValidator
{
    public const int MaxInputTextLength = 4000;
    public const int MaxInstructionLength = 1000;
    public const int MaxSectionKeyLength = 100;
    public const int MaxFieldLength = 100;

    public static (bool IsValid, string? ErrorCode, string? ErrorMessage) ValidateContentImprovementRequest(AIImproveContentRequest request)
    {
        if (request == null)
        {
            return (false, AIErrorCodes.InvalidRequest, "Request body cannot be null.");
        }

        if (string.IsNullOrWhiteSpace(request.SectionKey) || request.SectionKey.Length > MaxSectionKeyLength)
        {
            return (false, AIErrorCodes.ValidationError, $"SectionKey is required and cannot exceed {MaxSectionKeyLength} characters.");
        }

        if (string.IsNullOrWhiteSpace(request.Field) || request.Field.Length > MaxFieldLength)
        {
            return (false, AIErrorCodes.ValidationError, $"Field is required and cannot exceed {MaxFieldLength} characters.");
        }

        if (string.IsNullOrWhiteSpace(request.Operation))
        {
            return (false, AIErrorCodes.ValidationError, "Operation is required.");
        }

        if (!AIOperationTypes.SupportedContentOperations.Contains(request.Operation))
        {
            return (false, AIErrorCodes.UnsupportedOperation, $"Operation '{request.Operation}' is not supported for content assistance.");
        }

        if (string.IsNullOrWhiteSpace(request.CurrentText))
        {
            return (false, AIErrorCodes.ValidationError, "CurrentText is required.");
        }

        if (request.CurrentText.Length > MaxInputTextLength)
        {
            return (false, AIErrorCodes.ValidationError, $"CurrentText length exceeds the maximum allowed limit of {MaxInputTextLength} characters.");
        }

        if (!string.IsNullOrEmpty(request.Instruction) && request.Instruction.Length > MaxInstructionLength)
        {
            return (false, AIErrorCodes.ValidationError, $"Instruction length exceeds the maximum allowed limit of {MaxInstructionLength} characters.");
        }

        return (true, null, null);
    }

    public static (bool IsValid, string? ErrorCode, string? ErrorMessage) ValidateExecutionRequest(AIExecutionRequest request)
    {
        if (request == null)
        {
            return (false, AIErrorCodes.InvalidRequest, "Execution request cannot be null.");
        }

        if (request.TenantId == Guid.Empty)
        {
            return (false, AIErrorCodes.ValidationError, "Valid TenantId is required.");
        }

        if (string.IsNullOrWhiteSpace(request.OperationType))
        {
            return (false, AIErrorCodes.ValidationError, "OperationType is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ResourceType))
        {
            return (false, AIErrorCodes.ValidationError, "ResourceType is required.");
        }

        if (request.ResourceId == Guid.Empty)
        {
            return (false, AIErrorCodes.ValidationError, "Valid ResourceId is required.");
        }

        if (!string.IsNullOrEmpty(request.InputText) && request.InputText.Length > MaxInputTextLength)
        {
            return (false, AIErrorCodes.ValidationError, $"InputText exceeds the maximum allowed limit of {MaxInputTextLength} characters.");
        }

        if (!string.IsNullOrEmpty(request.Instruction) && request.Instruction.Length > MaxInstructionLength)
        {
            return (false, AIErrorCodes.ValidationError, $"Instruction exceeds the maximum allowed limit of {MaxInstructionLength} characters.");
        }

        return (true, null, null);
    }

    private static readonly Regex SafetyMetadataPattern = new(
        @"^\s*(User\s*Safety|Response\s*Safety|Content\s*Safety|Safety\s*Rating|Safety\s*Classification|Safety|Moderation|Guardrail(\s*Status)?|Status|Request\s*Id|Response\s*Id)\s*:\s*([^\r\n]*)$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly HashSet<string> IsolatedStatusTokens = new(StringComparer.OrdinalIgnoreCase)
    {
        "safe",
        "unsafe",
        "ok",
        "null",
        "true",
        "false",
        "none",
        "pass",
        "flagged"
    };

    private static string FilterSafetyAndDiagnosticLines(string text)
    {
        var lines = text.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
        var contentLines = new List<string>();

        foreach (var line in lines)
        {
            var trimmed = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
            {
                if (contentLines.Count > 0)
                {
                    contentLines.Add(string.Empty);
                }
                continue;
            }

            if (SafetyMetadataPattern.IsMatch(trimmed))
            {
                // Pure safety or diagnostic metadata line, skip
                continue;
            }

            contentLines.Add(trimmed);
        }

        return string.Join("\n", contentLines).Trim();
    }

    private static bool IsIsolatedStatusToken(string text)
    {
        var trimmed = text.Trim();
        if (IsolatedStatusTokens.Contains(trimmed)) return true;
        if (SafetyMetadataPattern.IsMatch(trimmed)) return true;
        return false;
    }

    /// <summary>
    /// Validates and cleanses raw AI provider output before presenting to the client.
    /// Rejects empty responses, provider metadata, safety classifications, excessive lengths,
    /// and strips accidental conversational filler, thought blocks, and internal status headers.
    /// </summary>
    public static (bool IsValid, string? SanitizedOutput, string? ErrorCode, string? ErrorMessage) ValidateAndSanitizeAIOutput(
        string? outputText,
        string operationType,
        string originalText)
    {
        if (string.IsNullOrWhiteSpace(outputText))
        {
            return (false, null, AIErrorCodes.OutputInvalid, "The AI provider generated an empty response. Please try again.");
        }

        var cleaned = outputText.Trim();

        // 1. Strip reasoning blocks (<think>...</think> or <thought>...</thought>)
        cleaned = Regex.Replace(cleaned, @"<(think|thought)>[\s\S]*?</(think|thought)>", string.Empty, RegexOptions.IgnoreCase).Trim();

        // 2. Strip markdown code fence if output is wrapped in ``` or ```json
        if (cleaned.StartsWith("```", StringComparison.Ordinal))
        {
            var firstNewline = cleaned.IndexOf('\n');
            var lastFence = cleaned.LastIndexOf("```", StringComparison.Ordinal);
            if (firstNewline > 0 && lastFence > firstNewline)
            {
                cleaned = cleaned.Substring(firstNewline + 1, lastFence - firstNewline - 1).Trim();
            }
        }

        // 3. Handle structured JSON envelope / objects if returned instead of raw text
        if (cleaned.StartsWith('{') && cleaned.EndsWith('}'))
        {
            try
            {
                using var doc = JsonDocument.Parse(cleaned);
                var root = doc.RootElement;
                if (root.ValueKind == JsonValueKind.Object)
                {
                    string? extractedText = null;
                    string[] contentPropNames = { "suggestion", "text", "content", "improvedText", "revisedText", "output", "result" };
                    foreach (var prop in contentPropNames)
                    {
                        if (root.TryGetProperty(prop, out var val) && val.ValueKind == JsonValueKind.String)
                        {
                            var s = val.GetString();
                            if (!string.IsNullOrWhiteSpace(s))
                            {
                                extractedText = s.Trim();
                                break;
                            }
                        }
                    }

                    if (extractedText != null)
                    {
                        cleaned = extractedText;
                    }
                    else
                    {
                        // JSON contained only metadata (e.g. {"user_safety":"safe"}, {"status":"ok"})
                        return (false, null, AIErrorCodes.OutputInvalid, "The AI response contained provider metadata rather than usable website content.");
                    }
                }
            }
            catch (JsonException)
            {
                // Not valid JSON, continue with string processing
            }
        }

        // 4. Strip enclosing quotes if the model wrapped the entire response in quotes
        if (cleaned.Length >= 2 &&
            ((cleaned.StartsWith('"') && cleaned.EndsWith('"')) ||
             (cleaned.StartsWith('\'') && cleaned.EndsWith('\''))))
        {
            cleaned = cleaned[1..^1].Trim();
        }

        // 5. Strip leading conversational fillers if present
        string[] conversationalPrefixes =
        {
            "Here is the improved wording:",
            "Here is the refined text:",
            "Here is a professional version:",
            "Here is the shorter version:",
            "Here is the clearer version:",
            "Here is an improved service description:",
            "Here's the improved wording:",
            "Here's the refined text:",
            "Here's a more professional version:",
            "Sure, here is your improved text:",
            "Sure! Here is the revised text:",
            "Sure, here's the revised text:",
            "Certainly! Here is the improved copy:"
        };

        foreach (var prefix in conversationalPrefixes)
        {
            if (cleaned.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                cleaned = cleaned[prefix.Length..].Trim().TrimStart(':', '\n', '\r', '"', ' ');
                break;
            }
        }

        // 6. Filter out provider safety classification, guardrail lines, and diagnostic status headers
        cleaned = FilterSafetyAndDiagnosticLines(cleaned);

        if (string.IsNullOrWhiteSpace(cleaned))
        {
            return (false, null, AIErrorCodes.OutputInvalid, "The AI response contained provider safety metadata rather than usable website content.");
        }

        // 7. Reject isolated metadata/status tokens (e.g., "safe", "unsafe", "ok", "null", "true", "false")
        if (IsIsolatedStatusToken(cleaned))
        {
            return (false, null, AIErrorCodes.OutputInvalid, "The AI response contained a status indicator rather than usable website content.");
        }

        if (cleaned.Length > MaxInputTextLength)
        {
            return (false, null, AIErrorCodes.OutputInvalid, $"The AI response exceeded the maximum allowed length of {MaxInputTextLength} characters.");
        }

        // 8. Prohibited markup / script tag injection check
        var lowerCleaned = cleaned.ToLowerInvariant();
        string[] prohibitedTags =
        {
            "<script", "</script", "<iframe", "</iframe", "<embed", "<object",
            "javascript:", "onload=", "onerror=", "onclick=", "onmouseover=", "<form", "<input"
        };

        foreach (var tag in prohibitedTags)
        {
            if (lowerCleaned.Contains(tag, StringComparison.OrdinalIgnoreCase))
            {
                return (false, null, AIErrorCodes.OutputProhibitedContent, "The AI response contained prohibited HTML markup or script tags.");
            }
        }

        // 9. Prompt leakage & Developer instruction disclosure check
        string[] promptLeakagePhrases =
        {
            "system prompt",
            "developer instruction",
            "ignore previous instructions",
            "ignore all instructions",
            "you are an ai language model",
            "as an ai language model",
            "as a large language model",
            "my system prompt",
            "internal prompt"
        };

        foreach (var phrase in promptLeakagePhrases)
        {
            if (lowerCleaned.Contains(phrase, StringComparison.OrdinalIgnoreCase))
            {
                return (false, null, AIErrorCodes.OutputValidationFailed, "The AI response contained internal system prompt leakage.");
            }
        }

        // 10. API keys & secrets detection check
        if (Regex.IsMatch(cleaned, @"sk-[a-zA-Z0-9]{20,}") ||
            Regex.IsMatch(cleaned, @"AIzaSy[a-zA-Z0-9_-]{33}") ||
            cleaned.Contains("-----BEGIN PRIVATE KEY-----", StringComparison.OrdinalIgnoreCase) ||
            cleaned.Contains("-----BEGIN RSA PRIVATE KEY-----", StringComparison.OrdinalIgnoreCase))
        {
            return (false, null, AIErrorCodes.OutputValidationFailed, "The AI response contained sensitive credentials or secrets.");
        }

        // 11. For "MakeShorter", if the output is significantly longer than the original, flag it
        if (string.Equals(operationType, AIOperationTypes.MakeShorter, StringComparison.OrdinalIgnoreCase) &&
            cleaned.Length > originalText.Length + 50 && originalText.Length > 30)
        {
            return (false, null, AIErrorCodes.OutputInvalid, "The AI model failed to produce a shorter version of the text.");
        }

        return (true, cleaned, null, null);
    }

    /// <summary>
    /// Validates AI image enhancement output according to Sparovia Pilot V1 image specifications.
    /// Strictly guarantees original image immutability, format compatibility, size limits, and tenant isolation.
    /// </summary>
    public static (bool IsValid, string? ErrorCode, string? ErrorMessage) ValidateImageEnhancementOutput(AIImageValidationRequest? request)
    {
        if (request == null)
        {
            return (false, AIErrorCodes.InvalidRequest, "Image validation request cannot be null.");
        }

        if (request.TenantId == Guid.Empty)
        {
            return (false, AIErrorCodes.ValidationError, "Valid TenantId is required.");
        }

        if (request.OriginalImageId == Guid.Empty)
        {
            return (false, AIErrorCodes.ValidationError, "Valid OriginalImageId reference is required.");
        }

        // Strict tenant isolation check: Source image must belong to the same tenant
        if (request.SourceImageTenantId != request.TenantId)
        {
            return (false, AIErrorCodes.TenantMismatch, "Cross-tenant image enhancement references are strictly prohibited.");
        }

        // Core immutability rule: The original image must NEVER be modified or overwritten by AI
        if (request.IsOriginalModified)
        {
            return (false, AIErrorCodes.OutputValidationFailed, "Original images are strictly immutable and cannot be overwritten by AI enhancements.");
        }

        if (!request.IsVariant)
        {
            return (false, AIErrorCodes.OutputValidationFailed, "AI enhancement output must be marked as a derived variant and not as the original image.");
        }

        if (string.IsNullOrWhiteSpace(request.OperationType) || !AIOperationTypes.SupportedImageOperations.Contains(request.OperationType))
        {
            return (false, AIErrorCodes.UnsupportedOperation, $"Operation '{request.OperationType}' is not a supported AI image enhancement operation.");
        }

        // Supported formats: JPEG, PNG, WebP
        var allowedFormats = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "jpeg", "jpg", "png", "webp" };
        if (string.IsNullOrWhiteSpace(request.Format) || !allowedFormats.Contains(request.Format.TrimStart('.')))
        {
            return (false, AIErrorCodes.OutputValidationFailed, $"Unsupported image format '{request.Format}'. Only JPEG, PNG, and WebP are allowed.");
        }

        // Dimensions limits
        if (request.Width <= 0 || request.Height <= 0)
        {
            return (false, AIErrorCodes.OutputValidationFailed, "Enhanced image must have positive non-zero dimensions.");
        }

        if (request.Width > 8192 || request.Height > 8192)
        {
            return (false, AIErrorCodes.OutputValidationFailed, "Enhanced image dimensions exceed the maximum allowed limit of 8192x8192 pixels.");
        }

        // Size limit: 10 MB
        const long maxSizeBytes = 10 * 1024 * 1024;
        if (request.FileSizeBytes <= 0 || request.FileSizeBytes > maxSizeBytes)
        {
            return (false, AIErrorCodes.OutputValidationFailed, $"Enhanced image file size must be between 1 byte and 10 MB (received {request.FileSizeBytes} bytes).");
        }

        return (true, null, null);
    }
}
