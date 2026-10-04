using System.Diagnostics;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sparovia.Application.AI;
using Sparovia.Application.WebsiteContent;
using Sparovia.Domain.Constants;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;

namespace Sparovia.Infrastructure.AI;

/// <summary>
/// Core AI Service implementing provider-neutral orchestration,
/// tenant safety, persistence of AIRequest, audit logging, and failure isolation.
/// </summary>
public class AIService : IAIService
{
    private readonly IAIProvider _aiProvider;
    private readonly SparoviaDbContext _dbContext;
    private readonly IAICredentialEncryptionService _encryptionService;
    private readonly IOptions<AIOptions> _options;
    private readonly ILogger<AIService> _logger;

    public AIService(
        IAIProvider aiProvider,
        SparoviaDbContext dbContext,
        IAICredentialEncryptionService encryptionService,
        IOptions<AIOptions> options,
        ILogger<AIService> logger)
    {
        _aiProvider = aiProvider;
        _dbContext = dbContext;
        _encryptionService = encryptionService;
        _options = options;
        _logger = logger;
    }

    public async Task<AIExecutionResult> ExecuteAsync(AIExecutionRequest request, CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();

        // 1. Server-side validation
        var (isValid, valCode, valMsg) = AIRequestValidator.ValidateExecutionRequest(request);
        if (!isValid)
        {
            _logger.LogWarning("AIExecutionRequest rejected validation for TenantId={TenantId}: {Message}", request.TenantId, valMsg);
            return new AIExecutionResult
            {
                Success = false,
                Status = AIRequestStatus.Failed,
                ErrorCode = valCode,
                ErrorMessage = valMsg
            };
        }

        // 2. Validate Tenant exists
        var tenantExists = await _dbContext.Tenants.AnyAsync(t => t.Id == request.TenantId, cancellationToken);
        if (!tenantExists)
        {
            _logger.LogWarning("AIExecutionRequest for non-existent TenantId={TenantId}", request.TenantId);
            return new AIExecutionResult
            {
                Success = false,
                Status = AIRequestStatus.Failed,
                ErrorCode = AIErrorCodes.TenantMismatch,
                ErrorMessage = "Invalid tenant context."
            };
        }

        // 3. Resolve Tenant AI Configuration (Authoritative Server-Side Selection)
        var config = await _dbContext.TenantAIConfigurations
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == request.TenantId, cancellationToken);

        // Always resolve authoritative model from tenant configuration (ignore untrusted frontend model overrides)
        var providerKey = config?.ProviderKey ?? AIProviders.OpenAI;
        var selectedModelKey = config?.SelectedModelKey;

        // Ensure model belongs to the configured provider; if missing or mismatched, pick default model for this provider
        var candidateModel = AIModelRegistry.GetModelByKey(selectedModelKey ?? string.Empty);
        if (candidateModel == null || !string.Equals(candidateModel.ProviderKey, providerKey, StringComparison.OrdinalIgnoreCase))
        {
            selectedModelKey = AIModelRegistry.DefaultModelKeyFor(providerKey);
        }

        // Verify model is allowlisted and currently selectable in Sparovia
        if (!AIModelRegistry.IsSelectable(selectedModelKey, out var selectableCode, out var selectableMsg))
        {
            _logger.LogWarning("TenantId={TenantId} configured model '{ModelKey}' is not selectable: {Message}",
                request.TenantId, selectedModelKey, selectableMsg);

            return new AIExecutionResult
            {
                Success = false,
                Status = AIRequestStatus.Failed,
                ErrorCode = selectableCode ?? AIErrorCodes.ModelUnavailable,
                ErrorMessage = selectableMsg ?? $"The configured AI model '{selectedModelKey}' is not selectable."
            };
        }

        // 4. Validate Model Capability
        var requiredCapability = request.ResourceType == AIResourceTypes.ImageVariant 
            ? AIModelCapability.Image 
            : AIModelCapability.Content;

        if (!AIModelRegistry.SupportsCapability(selectedModelKey, requiredCapability))
        {
            _logger.LogWarning("TenantId={TenantId} requested AI workflow {Capability} but selected model '{ModelKey}' does not support it.",
                request.TenantId, requiredCapability, selectedModelKey);

            return new AIExecutionResult
            {
                Success = false,
                Status = AIRequestStatus.Failed,
                ErrorCode = AIErrorCodes.ModelCapabilityMismatch,
                ErrorMessage = $"The configured AI model '{selectedModelKey}' does not support {requiredCapability} workflows. Please select a compatible model in AI Connections."
            };
        }

        // 5. Decrypt API Key in memory if present
        string? decryptedApiKey = null;
        if (!string.IsNullOrWhiteSpace(config?.EncryptedApiKey))
        {
            try
            {
                decryptedApiKey = _encryptionService.Decrypt(config.EncryptedApiKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to decrypt API key for TenantId={TenantId}", request.TenantId);
                return new AIExecutionResult
                {
                    Success = false,
                    Status = AIRequestStatus.Failed,
                    ErrorCode = AIErrorCodes.ProviderUnavailable,
                    ErrorMessage = "Unable to authenticate with AI provider. Please re-enter your API key in AI Connections."
                };
            }
        }

        // 6. Persist initial AIRequest entity in "Processing" state
        var aiRecord = new AIRequest
        {
            Id = Guid.NewGuid(),
            TenantId = request.TenantId,
            UserId = request.UserId,
            OperationType = request.OperationType,
            ResourceType = request.ResourceType,
            ResourceId = request.ResourceId,
            TargetSectionKey = request.TargetSectionKey,
            TargetFieldKey = request.TargetFieldKey,
            TargetResourceVersion = request.TargetResourceVersion,
            OriginalText = request.InputText,
            ReviewStatus = AIReviewStatus.PendingReview,
            ProviderReference = providerKey,
            ModelReference = selectedModelKey,
            Status = AIRequestStatus.Processing,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.AIRequests.Add(aiRecord);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: AIRequest created. Id={AIRequestId}, TenantId={TenantId}, UserId={UserId}, Operation={Operation}, ResourceType={ResourceType}, ResourceId={ResourceId}, Provider={Provider}, Model={Model}",
            aiRecord.Id, request.TenantId, request.UserId, request.OperationType, request.ResourceType, request.ResourceId, providerKey, selectedModelKey);

        // 7. Build trusted context and prompts
        var groundingContext = BuildGroundingContext(request.Context);

        var providerRequest = new AIProviderTextRequest
        {
            OperationType = request.OperationType,
            InputText = request.InputText ?? string.Empty,
            Instruction = request.Instruction,
            GroundingContext = groundingContext,
            Model = selectedModelKey,
            ProviderKey = providerKey,
            ApiKey = decryptedApiKey
        };

        // 8. Enforce configured timeout protection
        var timeoutSeconds = Math.Max(5, _options.Value.TimeoutSeconds);
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));

        AIProviderResult providerResult;
        try
        {
            providerResult = await _aiProvider.GenerateTextAsync(providerRequest, cts.Token);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            aiRecord.Status = AIRequestStatus.Failed;
            aiRecord.ErrorCode = AIErrorCodes.ProcessingFailed;
            aiRecord.ErrorMessage = "The AI request was canceled by user.";
            aiRecord.CompletedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(CancellationToken.None);

            _logger.LogInformation("AI request {AIRequestId} was canceled by caller.", aiRecord.Id);
            throw;
        }
        catch (OperationCanceledException)
        {
            stopwatch.Stop();
            aiRecord.Status = AIRequestStatus.Failed;
            aiRecord.ErrorCode = AIErrorCodes.ProcessingTimeout;
            aiRecord.ErrorMessage = "The AI operation timed out while communicating with the provider.";
            aiRecord.CompletedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(CancellationToken.None);

            _logger.LogWarning("AUDIT: AIRequest timed out. Id={AIRequestId}, TenantId={TenantId}, ElapsedMs={ElapsedMs}",
                aiRecord.Id, request.TenantId, stopwatch.ElapsedMilliseconds);

            return new AIExecutionResult
            {
                Success = false,
                AIRequestId = aiRecord.Id,
                Status = AIRequestStatus.Failed,
                ReviewStatus = AIReviewStatus.PendingReview,
                ErrorCode = AIErrorCodes.ProcessingTimeout,
                ErrorMessage = "We couldn't complete the AI request right now because it timed out. Please try again."
            };
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            aiRecord.Status = AIRequestStatus.Failed;
            aiRecord.ErrorCode = AIErrorCodes.ProcessingFailed;
            aiRecord.ErrorMessage = "An unexpected error occurred during AI processing.";
            aiRecord.CompletedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(CancellationToken.None);

            _logger.LogError(ex, "AUDIT: AIRequest encountered unexpected failure. Id={AIRequestId}, TenantId={TenantId}",
                aiRecord.Id, request.TenantId);

            return new AIExecutionResult
            {
                Success = false,
                AIRequestId = aiRecord.Id,
                Status = AIRequestStatus.Failed,
                ReviewStatus = AIReviewStatus.PendingReview,
                ErrorCode = AIErrorCodes.ProcessingFailed,
                ErrorMessage = "We couldn't complete the AI request right now. Please try again."
            };
        }

        stopwatch.Stop();

        // 6. Update AIRequest status and metadata
        aiRecord.CompletedAt = DateTime.UtcNow;
        aiRecord.ProviderReference = providerResult.ProviderReference;
        aiRecord.ModelReference = providerResult.ModelReference;

        if (providerResult.Success && !string.IsNullOrWhiteSpace(providerResult.OutputText))
        {
            var (isOutputValid, sanitizedOutput, outErrCode, outErrMsg) = AIRequestValidator.ValidateAndSanitizeAIOutput(
                providerResult.OutputText,
                request.OperationType,
                request.InputText ?? string.Empty);

            if (!isOutputValid)
            {
                aiRecord.Status = AIRequestStatus.Failed;
                aiRecord.ErrorCode = outErrCode ?? AIErrorCodes.OutputInvalid;
                aiRecord.ErrorMessage = outErrMsg ?? "Generated output did not pass validation.";
                await _dbContext.SaveChangesAsync(cancellationToken);

                _logger.LogWarning(
                    "AUDIT: AIRequest output validation failed. Id={AIRequestId}, TenantId={TenantId}, ErrorCode={ErrorCode}",
                    aiRecord.Id, request.TenantId, aiRecord.ErrorCode);

                return new AIExecutionResult
                {
                    Success = false,
                    AIRequestId = aiRecord.Id,
                    Status = AIRequestStatus.Failed,
                    ReviewStatus = AIReviewStatus.PendingReview,
                    ErrorCode = aiRecord.ErrorCode,
                    ErrorMessage = aiRecord.ErrorMessage
                };
            }

            aiRecord.Status = AIRequestStatus.Succeeded;
            aiRecord.ReviewStatus = AIReviewStatus.PendingReview;
            aiRecord.OutputText = sanitizedOutput;
            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "AUDIT: AIRequest completed successfully. Id={AIRequestId}, TenantId={TenantId}, DurationMs={DurationMs}, Provider={Provider}, Model={Model}",
                aiRecord.Id, request.TenantId, stopwatch.ElapsedMilliseconds, providerResult.ProviderReference, providerResult.ModelReference);

            return new AIExecutionResult
            {
                Success = true,
                AIRequestId = aiRecord.Id,
                OutputText = sanitizedOutput,
                Status = AIRequestStatus.Succeeded,
                ReviewStatus = AIReviewStatus.PendingReview,
                Metadata = new AIMetadata
                {
                    ProcessingDurationMs = stopwatch.ElapsedMilliseconds,
                    ModelReference = providerResult.ModelReference,
                    ProviderReference = providerResult.ProviderReference
                }
            };
        }
        else
        {
            aiRecord.Status = AIRequestStatus.Failed;
            aiRecord.ErrorCode = providerResult.ErrorCode ?? AIErrorCodes.ProcessingFailed;
            aiRecord.ErrorMessage = providerResult.ErrorMessage ?? "AI processing failed.";
            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogWarning(
                "AUDIT: AIRequest failed. Id={AIRequestId}, TenantId={TenantId}, ErrorCode={ErrorCode}, DurationMs={DurationMs}",
                aiRecord.Id, request.TenantId, aiRecord.ErrorCode, stopwatch.ElapsedMilliseconds);

            return new AIExecutionResult
            {
                Success = false,
                AIRequestId = aiRecord.Id,
                Status = AIRequestStatus.Failed,
                ReviewStatus = AIReviewStatus.PendingReview,
                ErrorCode = aiRecord.ErrorCode,
                ErrorMessage = aiRecord.ErrorMessage
            };
        }
    }

    public async Task<AIRequestDto?> GetRequestStatusAsync(Guid tenantId, Guid aiRequestId, CancellationToken cancellationToken = default)
    {
        // Enforce strict tenant isolation: query includes TenantId
        var record = await _dbContext.AIRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == aiRequestId && r.TenantId == tenantId, cancellationToken);

        if (record == null)
        {
            return null;
        }

        return new AIRequestDto
        {
            Id = record.Id,
            TenantId = record.TenantId,
            UserId = record.UserId,
            OperationType = record.OperationType,
            ResourceType = record.ResourceType,
            ResourceId = record.ResourceId,
            Status = record.Status,
            ReviewStatus = record.ReviewStatus,
            OutputText = record.OutputText,
            OriginalText = record.OriginalText,
            ProviderReference = record.ProviderReference,
            ModelReference = record.ModelReference,
            CreatedAt = record.CreatedAt,
            CompletedAt = record.CompletedAt,
            ReviewedAt = record.ReviewedAt,
            ReviewedByUserId = record.ReviewedByUserId,
            ErrorCode = record.ErrorCode,
            ErrorMessage = record.ErrorMessage
        };
    }

    public async Task<AIReviewDetailDto?> GetReviewDetailAsync(Guid tenantId, Guid aiRequestId, CancellationToken cancellationToken = default)
    {
        // Enforce strict tenant isolation
        var record = await _dbContext.AIRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == aiRequestId && r.TenantId == tenantId, cancellationToken);

        if (record == null)
        {
            return null;
        }

        return new AIReviewDetailDto
        {
            Id = record.Id,
            TenantId = record.TenantId,
            UserId = record.UserId,
            OperationType = record.OperationType,
            ResourceType = record.ResourceType,
            ResourceId = record.ResourceId,
            Status = record.Status,
            ReviewStatus = record.ReviewStatus,
            OutputText = record.OutputText,
            OriginalText = record.OriginalText,
            TargetSectionKey = record.TargetSectionKey,
            TargetFieldKey = record.TargetFieldKey,
            TargetResourceVersion = record.TargetResourceVersion,
            CreatedAt = record.CreatedAt,
            CompletedAt = record.CompletedAt,
            ReviewedAt = record.ReviewedAt,
            ReviewedByUserId = record.ReviewedByUserId,
            ErrorCode = record.ErrorCode,
            ErrorMessage = record.ErrorMessage
        };
    }

    public async Task<AIReviewResultDto> AcceptOutputAsync(
        Guid tenantId,
        Guid aiRequestId,
        string? editedText,
        Guid? userId,
        CancellationToken cancellationToken = default)
    {
        // 1. Enforce strict tenant isolation
        var record = await _dbContext.AIRequests
            .FirstOrDefaultAsync(r => r.Id == aiRequestId && r.TenantId == tenantId, cancellationToken);

        if (record == null)
        {
            return new AIReviewResultDto
            {
                Success = false,
                AiRequestId = aiRequestId,
                ErrorCode = AIErrorCodes.ResourceNotFound,
                ErrorMessage = "AI request not found."
            };
        }

        // 2. State transition and idempotency checks
        if (string.Equals(record.ReviewStatus, AIReviewStatus.Accepted, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(record.ReviewStatus, AIReviewStatus.EditedBeforeAcceptance, StringComparison.OrdinalIgnoreCase))
        {
            return new AIReviewResultDto
            {
                Success = true,
                AiRequestId = record.Id,
                ReviewStatus = record.ReviewStatus,
                Message = "AI suggestion was already accepted."
            };
        }

        if (string.Equals(record.ReviewStatus, AIReviewStatus.Rejected, StringComparison.OrdinalIgnoreCase))
        {
            return new AIReviewResultDto
            {
                Success = false,
                AiRequestId = record.Id,
                ReviewStatus = record.ReviewStatus,
                ErrorCode = AIErrorCodes.ReviewStateInvalid,
                ErrorMessage = "Cannot accept an AI suggestion that has already been rejected. Please generate a new suggestion."
            };
        }

        // 3. Resolve and validate final text to apply
        var finalText = !string.IsNullOrWhiteSpace(editedText)
            ? editedText.Trim()
            : record.OutputText ?? string.Empty;

        var (isValValid, sanitizedFinalText, valCode, valMsg) = AIRequestValidator.ValidateAndSanitizeAIOutput(
            finalText,
            record.OperationType,
            record.OriginalText ?? string.Empty);

        if (!isValValid)
        {
            return new AIReviewResultDto
            {
                Success = false,
                AiRequestId = record.Id,
                ReviewStatus = record.ReviewStatus,
                ErrorCode = valCode ?? AIErrorCodes.OutputValidationFailed,
                ErrorMessage = valMsg ?? "Content validation failed."
            };
        }

        finalText = sanitizedFinalText ?? finalText;
        var wasEdited = !string.IsNullOrWhiteSpace(editedText) && editedText.Trim() != record.OutputText;

        // 4. Resource Application: Apply to Draft ONLY (never auto-publish)
        int? updatedVersion = null;
        if (string.Equals(record.ResourceType, AIResourceTypes.WebsiteContent, StringComparison.OrdinalIgnoreCase))
        {
            // Lookup WebsiteContent
            Sparovia.Domain.Entities.WebsiteContent? websiteContent = null;
            if (record.ResourceId != Guid.Empty)
            {
                websiteContent = await _dbContext.WebsiteContents
                    .FirstOrDefaultAsync(c => c.Id == record.ResourceId && c.TenantId == tenantId, cancellationToken);
            }

            if (websiteContent == null && !string.IsNullOrWhiteSpace(record.TargetSectionKey))
            {
                var normKey = WebsiteTemplateRegistry.NormalizeSectionKey(record.TargetSectionKey);
                websiteContent = await _dbContext.WebsiteContents
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId && (c.SectionKey == record.TargetSectionKey || c.SectionKey == normKey), cancellationToken);
            }

            if (websiteContent == null && !string.IsNullOrWhiteSpace(record.TargetSectionKey))
            {
                var normKey = WebsiteTemplateRegistry.NormalizeSectionKey(record.TargetSectionKey);
                var website = await _dbContext.Websites
                    .FirstOrDefaultAsync(w => w.TenantId == tenantId, cancellationToken);

                if (website == null)
                {
                    var businessContext = await _dbContext.BusinessContexts
                        .AsNoTracking()
                        .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

                    website = new Website
                    {
                        TenantId = tenantId,
                        Name = !string.IsNullOrWhiteSpace(businessContext?.BusinessName) ? businessContext.BusinessName : "Sparovia Website",
                        Domain = "sparovia-site.local",
                        ConnectionStatus = "Connected",
                        TemplateId = WebsiteTemplateRegistry.DefaultTemplateId,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _dbContext.Websites.Add(website);
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }

                websiteContent = new Domain.Entities.WebsiteContent
                {
                    TenantId = tenantId,
                    WebsiteId = website.Id,
                    SectionKey = normKey,
                    DraftContentJson = "{}",
                    PublishedContentJson = "{}",
                    Status = "Draft",
                    Version = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _dbContext.WebsiteContents.Add(websiteContent);
            }

            if (websiteContent != null)
            {
                // Concurrency & Stale Draft Protection:
                // If draft version has advanced past the version when AI generated this suggestion, reject unsafe overwrite!
                if (record.TargetResourceVersion.HasValue && websiteContent.Version > record.TargetResourceVersion.Value)
                {
                    _logger.LogWarning(
                        "CONFLICT: AI suggestion acceptance prevented for TenantId={TenantId}, Section={Section}. CapturedVersion={OldVer}, CurrentVersion={CurrentVer}",
                        tenantId, record.TargetSectionKey, record.TargetResourceVersion.Value, websiteContent.Version);

                    return new AIReviewResultDto
                    {
                        Success = false,
                        AiRequestId = record.Id,
                        ReviewStatus = record.ReviewStatus,
                        ErrorCode = AIErrorCodes.ResultStaleConflict,
                        ErrorMessage = "The website section draft was modified after this AI suggestion was generated. To prevent overwriting newer changes, please refresh and review again."
                    };
                }

                // Update Draft Json field safely (Never touches PublishedContentJson)
                var updatedDraftJson = UpdateDraftJsonField(websiteContent.DraftContentJson, record.TargetFieldKey, finalText);
                websiteContent.DraftContentJson = updatedDraftJson;
                websiteContent.UpdatedAt = DateTime.UtcNow;
                websiteContent.UpdatedByUserId = userId;
                updatedVersion = websiteContent.Version;
            }
        }

        // 5. Update AIRequest status
        record.ReviewStatus = wasEdited ? AIReviewStatus.EditedBeforeAcceptance : AIReviewStatus.Accepted;
        record.ReviewedAt = DateTime.UtcNow;
        record.ReviewedByUserId = userId;
        if (wasEdited)
        {
            record.OutputText = finalText;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: AI_OUTPUT_ACCEPTED. TenantId={TenantId}, UserId={UserId}, AIRequestId={AIRequestId}, ResourceType={ResourceType}, ResourceId={ResourceId}, ReviewStatus={ReviewStatus}, WasEdited={WasEdited}",
            tenantId, userId, record.Id, record.ResourceType, record.ResourceId, record.ReviewStatus, wasEdited);

        return new AIReviewResultDto
        {
            Success = true,
            AiRequestId = record.Id,
            ReviewStatus = record.ReviewStatus,
            Message = wasEdited ? "AI suggestion was edited and accepted into draft." : "AI suggestion was accepted into draft.",
            AppliedVersion = updatedVersion
        };
    }

    public async Task<AIReviewResultDto> RejectOutputAsync(
        Guid tenantId,
        Guid aiRequestId,
        string? reason,
        Guid? userId,
        CancellationToken cancellationToken = default)
    {
        // 1. Enforce strict tenant isolation
        var record = await _dbContext.AIRequests
            .FirstOrDefaultAsync(r => r.Id == aiRequestId && r.TenantId == tenantId, cancellationToken);

        if (record == null)
        {
            return new AIReviewResultDto
            {
                Success = false,
                AiRequestId = aiRequestId,
                ErrorCode = AIErrorCodes.ResourceNotFound,
                ErrorMessage = "AI request not found."
            };
        }

        // 2. State transition and idempotency checks
        if (string.Equals(record.ReviewStatus, AIReviewStatus.Rejected, StringComparison.OrdinalIgnoreCase))
        {
            return new AIReviewResultDto
            {
                Success = true,
                AiRequestId = record.Id,
                ReviewStatus = AIReviewStatus.Rejected,
                Message = "AI suggestion was already rejected."
            };
        }

        if (string.Equals(record.ReviewStatus, AIReviewStatus.Accepted, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(record.ReviewStatus, AIReviewStatus.EditedBeforeAcceptance, StringComparison.OrdinalIgnoreCase))
        {
            return new AIReviewResultDto
            {
                Success = false,
                AiRequestId = record.Id,
                ReviewStatus = record.ReviewStatus,
                ErrorCode = AIErrorCodes.ReviewStateInvalid,
                ErrorMessage = "Cannot reject an AI suggestion that has already been accepted into draft."
            };
        }

        // 3. Mark rejected (Existing drafts and published content remain completely unchanged)
        record.ReviewStatus = AIReviewStatus.Rejected;
        record.ReviewedAt = DateTime.UtcNow;
        record.ReviewedByUserId = userId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: AI_OUTPUT_REJECTED. TenantId={TenantId}, UserId={UserId}, AIRequestId={AIRequestId}, ResourceType={ResourceType}, ResourceId={ResourceId}",
            tenantId, userId, record.Id, record.ResourceType, record.ResourceId);

        return new AIReviewResultDto
        {
            Success = true,
            AiRequestId = record.Id,
            ReviewStatus = AIReviewStatus.Rejected,
            Message = "AI suggestion was rejected and discarded."
        };
    }

    private static string UpdateDraftJsonField(string draftJson, string? fieldKey, string newValue)
    {
        if (string.IsNullOrWhiteSpace(fieldKey) || string.IsNullOrWhiteSpace(draftJson))
        {
            return draftJson;
        }

        try
        {
            var root = System.Text.Json.Nodes.JsonNode.Parse(draftJson);
            if (root is not System.Text.Json.Nodes.JsonObject obj)
            {
                return draftJson;
            }

            var parts = fieldKey.Split('.');
            if (parts.Length == 1)
            {
                obj[parts[0]] = newValue;
            }
            else if (parts.Length == 3 && int.TryParse(parts[1], out var itemIndex))
            {
                var listKey = parts[0];
                var subKey = parts[2];
                if (obj[listKey] is System.Text.Json.Nodes.JsonArray arr && itemIndex >= 0 && itemIndex < arr.Count)
                {
                    if (arr[itemIndex] is System.Text.Json.Nodes.JsonObject itemObj)
                    {
                        itemObj[subKey] = newValue;
                    }
                }
            }
            else
            {
                obj[fieldKey] = newValue;
            }

            return root.ToJsonString();
        }
        catch
        {
            return draftJson;
        }
    }

    private static string BuildGroundingContext(AIExecutionContext ctx)
    {
        var sb = new StringBuilder();

        if (!string.IsNullOrWhiteSpace(ctx.BusinessName))
            sb.AppendLine($"Business Name: {ctx.BusinessName}");

        if (!string.IsNullOrWhiteSpace(ctx.BusinessType))
            sb.AppendLine($"Business Type: {ctx.BusinessType}");

        if (!string.IsNullOrWhiteSpace(ctx.PrimaryCategory))
            sb.AppendLine($"Category: {ctx.PrimaryCategory}");

        if (!string.IsNullOrWhiteSpace(ctx.Location))
            sb.AppendLine($"Location: {ctx.Location}");

        if (!string.IsNullOrWhiteSpace(ctx.BusinessDescription))
            sb.AppendLine($"Description: {ctx.BusinessDescription}");

        if (!string.IsNullOrWhiteSpace(ctx.Differentiators))
            sb.AppendLine($"Differentiators: {ctx.Differentiators}");

        if (ctx.Services.Count > 0)
            sb.AppendLine($"Services: {string.Join(", ", ctx.Services)}");

        if (ctx.ApprovedFacts.Count > 0)
            sb.AppendLine($"Approved Facts & Claims: {string.Join("; ", ctx.ApprovedFacts)}");

        if (!string.IsNullOrWhiteSpace(ctx.SectionKey))
            sb.AppendLine($"Section: {ctx.SectionKey}");

        if (!string.IsNullOrWhiteSpace(ctx.FieldName))
            sb.AppendLine($"Field: {ctx.FieldName}");

        return sb.ToString().Trim();
    }
}
