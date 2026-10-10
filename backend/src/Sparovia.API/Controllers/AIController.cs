using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Sparovia.Application.AI;
using Sparovia.Application.Images;
using Sparovia.Domain.Constants;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/v1/ai")]
public class AIController : ControllerBase
{
    private readonly IAIService _aiService;
    private readonly IAIProvider _aiProvider;
    private readonly IAICredentialEncryptionService _encryptionService;
    private readonly IWebsiteImageService _imageService;
    private readonly SparoviaDbContext _dbContext;
    private readonly ILogger<AIController> _logger;

    public AIController(
        IAIService aiService,
        IAIProvider aiProvider,
        IAICredentialEncryptionService encryptionService,
        IWebsiteImageService imageService,
        SparoviaDbContext dbContext,
        ILogger<AIController> logger)
    {
        _aiService = aiService;
        _aiProvider = aiProvider;
        _encryptionService = encryptionService;
        _imageService = imageService;
        _dbContext = dbContext;
        _logger = logger;
    }

    private bool TryGetTenantId(out Guid tenantId, out IActionResult? failureResult)
    {
        var tenantIdStr = User.FindFirst("TenantId")?.Value;
        if (!Guid.TryParse(tenantIdStr, out tenantId))
        {
            failureResult = Unauthorized(new { Error = "Tenant context not found in session." });
            return false;
        }

        failureResult = null;
        return true;
    }

    private Guid? TryGetUserId()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdStr, out var userId) ? userId : null;
    }

    private async Task<bool> IsOnboardingCompleteAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        return await _dbContext.BusinessContexts
            .AnyAsync(b => b.TenantId == tenantId && b.IsConfirmed, cancellationToken);
    }

    /// <summary>
    /// Returns the list of Sparovia-approved AI providers.
    /// Providers are authoritative and controlled by Sparovia.
    /// </summary>
    [HttpGet("providers")]
    [Authorize]
    public IActionResult GetApprovedProviders()
    {
        var providers = AIProviderRegistry.GetAllApprovedProviders().Select(p => new AIProviderDto
        {
            Key = p.Key,
            DisplayName = p.DisplayName,
            Description = p.Description,
            SupportedCapabilities = p.SupportedCapabilities,
            DefaultModelKey = p.DefaultModelKey,
            DocumentationUrl = p.DocumentationUrl,
            Placeholder = p.Placeholder
        }).ToList();

        return Ok(new
        {
            data = providers,
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// Returns approved models, optionally filtered by provider and capability.
    /// Internal provider model IDs and secrets are never exposed.
    /// </summary>
    [HttpGet("models")]
    [Authorize]
    public async Task<IActionResult> GetApprovedModels(
        [FromQuery] string? providerKey,
        [FromQuery] string? capability,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var config = await _dbContext.TenantAIConfigurations
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == tenantId, cancellationToken);

        var selectedKey = config?.SelectedModelKey ?? AIModelRegistry.DefaultOpenAIModel;

        var allModels = AIModelRegistry.GetAllApprovedModels();

        if (!string.IsNullOrWhiteSpace(providerKey))
        {
            var normProv = providerKey.Trim();
            if (string.Equals(normProv, "nvidia", StringComparison.OrdinalIgnoreCase)) normProv = AIProviders.NvidiaNim;
            else if (string.Equals(normProv, "google", StringComparison.OrdinalIgnoreCase)) normProv = AIProviders.Gemini;
            allModels = allModels.Where(m => string.Equals(m.ProviderKey, normProv, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(capability))
        {
            allModels = allModels.Where(m => AIModelRegistry.SupportsCapability(m.Key, capability)).ToList();
        }

        var modelDtos = allModels.Select(m => new AIModelDto
        {
            Key = m.Key,
            ProviderKey = m.ProviderKey,
            DisplayName = m.DisplayName,
            Description = m.Description,
            Capability = m.Capability,
            Status = m.Status,
            IsDefault = m.IsDefault,
            IsRecommended = m.IsRecommended,
            IsFreeTier = m.IsFreeTier,
            IsSelected = string.Equals(m.Key, selectedKey, StringComparison.OrdinalIgnoreCase)
        }).ToList();

        return Ok(new
        {
            data = new AIModelsResponseDto
            {
                Models = modelDtos,
                SelectedModelKey = selectedKey
            },
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// Returns the current tenant's AI provider connection status and selected model.
    /// API keys are strictly masked and never returned in plaintext.
    /// </summary>
    [HttpGet("connection")]
    [Authorize]
    public async Task<IActionResult> GetConnection(CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var config = await _dbContext.TenantAIConfigurations
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == tenantId, cancellationToken);

        if (config == null || string.Equals(config.Status, AIConnectionStatus.NotConnected, StringComparison.OrdinalIgnoreCase))
        {
            return Ok(new
            {
                data = new AIConnectionDto
                {
                    Status = AIConnectionStatus.NotConnected,
                    ProviderKey = null,
                    SelectedModelKey = null
                },
                requestId = HttpContext.TraceIdentifier
            });
        }

        var provider = AIProviderRegistry.GetProviderByKey(config.ProviderKey);
        var model = AIModelRegistry.GetModelByKey(config.SelectedModelKey);

        var isContentAvailable = !string.IsNullOrWhiteSpace(config.SelectedModelKey) &&
            AIModelRegistry.SupportsCapability(config.SelectedModelKey, AIModelCapability.Content);
        var isImageAvailable = !string.IsNullOrWhiteSpace(config.SelectedModelKey) &&
            AIModelRegistry.SupportsCapability(config.SelectedModelKey, AIModelCapability.Image);

        var dto = new AIConnectionDto
        {
            Status = config.Status,
            ProviderKey = config.ProviderKey,
            ProviderDisplayName = provider?.DisplayName ?? config.ProviderKey,
            SelectedModelKey = config.SelectedModelKey,
            SelectedModelDisplayName = model?.DisplayName ?? config.SelectedModelKey,
            IsFreeTier = model?.IsFreeTier ?? false,
            MaskedApiKey = config.MaskedApiKey,
            SupportedCapability = config.SupportedCapability ?? model?.Capability,
            IsContentAIAvailable = isContentAvailable,
            IsImageEnhancementAvailable = isImageAvailable,
            LastValidatedAt = config.LastValidatedAt,
            UpdatedAt = config.UpdatedAt
        };

        return Ok(new
        {
            data = dto,
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// Tests a provider connection using the supplied API credential (or existing stored credential).
    /// </summary>
    [HttpPost("connection/test")]
    [Authorize]
    [EnableRateLimiting("AiOperations")]
    public async Task<IActionResult> TestConnection([FromBody] TestAIConnectionRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        if (string.IsNullOrWhiteSpace(request?.ProviderKey))
        {
            return BadRequest(new { Error = "ProviderKey is required.", Code = AIErrorCodes.ValidationError });
        }

        if (!AIProviderRegistry.IsApproved(request.ProviderKey))
        {
            return BadRequest(new { Error = $"Provider '{request.ProviderKey}' is not an approved Sparovia provider.", Code = AIErrorCodes.ProviderNotApproved });
        }

        var provider = AIProviderRegistry.GetProviderByKey(request.ProviderKey)!;

        var apiKeyToTest = request.ApiKey;
        if (string.IsNullOrWhiteSpace(apiKeyToTest))
        {
            var config = await _dbContext.TenantAIConfigurations
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.TenantId == tenantId, cancellationToken);

            if (config != null && !string.IsNullOrWhiteSpace(config.EncryptedApiKey))
            {
                apiKeyToTest = _encryptionService.Decrypt(config.EncryptedApiKey);
            }
        }

        if (string.IsNullOrWhiteSpace(apiKeyToTest))
        {
            return BadRequest(new { Error = "API key is required to test the connection.", Code = AIErrorCodes.ValidationError });
        }

        var testResult = await _aiProvider.TestConnectionDetailedAsync(provider.Key, apiKeyToTest, request.SelectedModelKey, cancellationToken);

        if (!testResult.Success)
        {
            _logger.LogWarning("AUDIT: AI_CONNECTION_FAILED. TenantId={TenantId}, ProviderKey={ProviderKey}, ModelKey={ModelKey}, ErrorCode={ErrorCode}",
                tenantId, provider.Key, request.SelectedModelKey, testResult.ErrorCode);

            return BadRequest(new
            {
                error = new
                {
                    code = testResult.ErrorCode ?? AIErrorCodes.ConnectionTestFailed,
                    message = testResult.ErrorMessage ?? $"Connection failed. The API key could not be verified with {provider.DisplayName}. Please check your credentials and try again."
                },
                requestId = HttpContext.TraceIdentifier
            });
        }

        _logger.LogInformation("AUDIT: AI_CONNECTION_TESTED. TenantId={TenantId}, ProviderKey={ProviderKey}, ModelKey={ModelKey}, Success=True",
            tenantId, provider.Key, request.SelectedModelKey);

        return Ok(new
        {
            data = new TestAIConnectionResponse
            {
                Success = true,
                ProviderKey = provider.Key,
                Message = $"Connection to {provider.DisplayName} verified successfully.",
                Status = "CONNECTED",
                Provider = provider.DisplayName,
                Model = request.SelectedModelKey ?? AIModelRegistry.DefaultModelKeyFor(provider.Key)
            },
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// Connects an approved external AI provider with the tenant's API credential and selected model.
    /// Validates authentication, encrypts credentials at rest, and updates the shared tenant AI configuration.
    /// </summary>
    [HttpPost("connection")]
    [Authorize]
    [EnableRateLimiting("AiOperations")]
    public async Task<IActionResult> ConnectProvider([FromBody] ConnectAIProviderRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        if (string.IsNullOrWhiteSpace(request?.ProviderKey))
        {
            return BadRequest(new { Error = "ProviderKey is required.", Code = AIErrorCodes.ValidationError });
        }

        if (string.IsNullOrWhiteSpace(request?.ApiKey))
        {
            return BadRequest(new { Error = "ApiKey is required.", Code = AIErrorCodes.ValidationError });
        }

        if (string.IsNullOrWhiteSpace(request?.SelectedModelKey))
        {
            return BadRequest(new { Error = "SelectedModelKey is required.", Code = AIErrorCodes.ValidationError });
        }

        if (!AIModelRegistry.ValidateModelSelection(request.ProviderKey, request.SelectedModelKey, out var model, out var errCode, out var errMsg))
        {
            return BadRequest(new 
            { 
                error = new { code = errCode, message = errMsg },
                code = errCode,
                message = errMsg 
            });
        }

        var provider = AIProviderRegistry.GetProviderByKey(request.ProviderKey)!;

        // Test connection with external provider before saving
        var testResult = await _aiProvider.TestConnectionDetailedAsync(request.ProviderKey, request.ApiKey, request.SelectedModelKey, cancellationToken);
        if (!testResult.Success)
        {
            return BadRequest(new
            {
                error = new
                {
                    code = testResult.ErrorCode ?? AIErrorCodes.ConnectionTestFailed,
                    message = testResult.ErrorMessage ?? $"Connection failed. The API key could not be verified with {provider.DisplayName}. Please check your credentials and try again."
                },
                requestId = HttpContext.TraceIdentifier
            });
        }

        // Encrypt credential & generate display mask
        var encryptedKey = _encryptionService.Encrypt(request.ApiKey.Trim());
        var maskedKey = _encryptionService.MaskApiKey(request.ApiKey.Trim());
        var userId = TryGetUserId();

        var config = await _dbContext.TenantAIConfigurations
            .FirstOrDefaultAsync(c => c.TenantId == tenantId, cancellationToken);

        if (config == null)
        {
            config = new TenantAIConfiguration
            {
                TenantId = tenantId,
                ProviderKey = request.ProviderKey,
                EncryptedApiKey = encryptedKey,
                MaskedApiKey = maskedKey,
                SelectedModelKey = model.Key,
                SupportedCapability = model.Capability,
                Status = AIConnectionStatus.Connected,
                LastValidatedAt = DateTime.UtcNow,
                UpdatedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.TenantAIConfigurations.Add(config);
        }
        else
        {
            config.ProviderKey = request.ProviderKey;
            config.EncryptedApiKey = encryptedKey;
            config.MaskedApiKey = maskedKey;
            config.SelectedModelKey = model.Key;
            config.SupportedCapability = model.Capability;
            config.Status = AIConnectionStatus.Connected;
            config.LastValidatedAt = DateTime.UtcNow;
            config.UpdatedByUserId = userId;
            config.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "AUDIT: AIProviderConnectionCreated. TenantId={TenantId}, UserId={UserId}, ProviderKey={ProviderKey}, ModelKey={ModelKey}, Capability={Capability}",
            tenantId, userId, request.ProviderKey, model.Key, model.Capability);

        var dto = new AIConnectionDto
        {
            Status = config.Status,
            ProviderKey = config.ProviderKey,
            ProviderDisplayName = provider.DisplayName,
            SelectedModelKey = config.SelectedModelKey,
            SelectedModelDisplayName = model.DisplayName,
            IsFreeTier = model.IsFreeTier,
            MaskedApiKey = config.MaskedApiKey,
            SupportedCapability = config.SupportedCapability ?? model.Capability,
            IsContentAIAvailable = AIModelRegistry.SupportsCapability(model.Key, AIModelCapability.Content),
            IsImageEnhancementAvailable = AIModelRegistry.SupportsCapability(model.Key, AIModelCapability.Image),
            LastValidatedAt = config.LastValidatedAt,
            UpdatedAt = config.UpdatedAt
        };

        return Ok(new
        {
            data = dto,
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// Updates the selected model or rotates the stored API credential.
    /// </summary>
    [HttpPut("connection")]
    [Authorize]
    public async Task<IActionResult> UpdateConnection([FromBody] UpdateAIConnectionRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var config = await _dbContext.TenantAIConfigurations
            .FirstOrDefaultAsync(c => c.TenantId == tenantId, cancellationToken);

        if (config == null || string.Equals(config.Status, AIConnectionStatus.NotConnected, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new 
            { 
                error = new 
                { 
                    code = AIErrorCodes.ProviderConnectionRequired, 
                    message = "An active AI provider connection is required before selecting or updating an AI model." 
                },
                code = AIErrorCodes.ProviderConnectionRequired,
                message = "An active AI provider connection is required before selecting or updating an AI model." 
            });
        }

        var userId = TryGetUserId();

        // 1. If rotating API Key, test and encrypt
        if (!string.IsNullOrWhiteSpace(request.ApiKey))
        {
            var testModelKey = request.ResolvedModelKey ?? config.SelectedModelKey;
            var testResult = await _aiProvider.TestConnectionDetailedAsync(config.ProviderKey, request.ApiKey, testModelKey, cancellationToken);
            if (!testResult.Success)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = testResult.ErrorCode ?? AIErrorCodes.ConnectionTestFailed,
                        message = testResult.ErrorMessage ?? "Could not authenticate with provider using the new API key. Please check your credentials and try again."
                    },
                    requestId = HttpContext.TraceIdentifier
                });
            }

            config.EncryptedApiKey = _encryptionService.Encrypt(request.ApiKey.Trim());
            config.MaskedApiKey = _encryptionService.MaskApiKey(request.ApiKey.Trim());
            config.LastValidatedAt = DateTime.UtcNow;
        }

        // 2. If changing model, validate server allowlist strictly
        var targetModelKey = request.ResolvedModelKey;
        if (!string.IsNullOrWhiteSpace(targetModelKey))
        {
            if (!AIModelRegistry.ValidateModelSelection(config.ProviderKey, targetModelKey, out var model, out var errCode, out var errMsg))
            {
                // CRUCIAL: Do NOT modify existing configuration on failure!
                return BadRequest(new 
                { 
                    error = new { code = errCode, message = errMsg },
                    code = errCode,
                    message = errMsg 
                });
            }

            var previousModelKey = config.SelectedModelKey;
            config.SelectedModelKey = model!.Key;
            config.SupportedCapability = model.Capability;

            _logger.LogInformation(
                "AUDIT: AI_MODEL_CHANGED. TenantId={TenantId}, UserId={UserId}, PreviousModelKey={PreviousModelKey}, NewModelKey={NewModelKey}, ProviderKey={ProviderKey}, Capability={Capability}",
                tenantId, userId, previousModelKey, model.Key, config.ProviderKey, model.Capability);
        }

        config.UpdatedAt = DateTime.UtcNow;
        config.UpdatedByUserId = userId;

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new
            {
                error = new
                {
                    code = AIErrorCodes.ConfigurationUpdateFailed,
                    message = "The AI configuration was modified concurrently by another operation. Please refresh and try again."
                },
                Error = "The AI configuration was modified concurrently by another operation. Please refresh and try again.",
                Code = AIErrorCodes.ConfigurationUpdateFailed
            });
        }

        _logger.LogInformation(
            "AUDIT: AIProviderConnectionUpdated. TenantId={TenantId}, UserId={UserId}, ProviderKey={ProviderKey}, ModelKey={ModelKey}",
            tenantId, userId, config.ProviderKey, config.SelectedModelKey);

        var provider = AIProviderRegistry.GetProviderByKey(config.ProviderKey);
        var activeModel = AIModelRegistry.GetModelByKey(config.SelectedModelKey);

        var isContentAvailable = activeModel != null &&
            AIModelRegistry.SupportsCapability(activeModel.Key, AIModelCapability.Content);
        var isImageAvailable = activeModel != null &&
            AIModelRegistry.SupportsCapability(activeModel.Key, AIModelCapability.Image);

        var dto = new AIConnectionDto
        {
            Status = config.Status,
            ProviderKey = config.ProviderKey,
            ProviderDisplayName = provider?.DisplayName ?? config.ProviderKey,
            SelectedModelKey = config.SelectedModelKey,
            SelectedModelDisplayName = activeModel?.DisplayName ?? config.SelectedModelKey,
            IsFreeTier = activeModel?.IsFreeTier ?? false,
            MaskedApiKey = config.MaskedApiKey,
            SupportedCapability = config.SupportedCapability ?? activeModel?.Capability,
            IsContentAIAvailable = isContentAvailable,
            IsImageEnhancementAvailable = isImageAvailable,
            LastValidatedAt = config.LastValidatedAt,
            UpdatedAt = config.UpdatedAt
        };

        return Ok(new
        {
            data = dto,
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// Disconnects the tenant's external AI provider and clears encrypted credentials safely.
    /// </summary>
    [HttpDelete("connection")]
    [Authorize]
    public async Task<IActionResult> DisconnectConnection(CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var config = await _dbContext.TenantAIConfigurations
            .FirstOrDefaultAsync(c => c.TenantId == tenantId, cancellationToken);

        if (config != null)
        {
            config.Status = AIConnectionStatus.NotConnected;
            config.EncryptedApiKey = null;
            config.MaskedApiKey = null;
            config.UpdatedAt = DateTime.UtcNow;
            config.UpdatedByUserId = TryGetUserId();

            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("AUDIT: AIProviderConnectionRemoved. TenantId={TenantId}, UserId={UserId}",
                tenantId, config.UpdatedByUserId);
        }

        return Ok(new
        {
            data = new
            {
                status = AIConnectionStatus.NotConnected,
                message = "AI provider disconnected successfully."
            },
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// Returns the current tenant's selected AI model.
    /// Maintained for backwards compatibility.
    /// </summary>
    [HttpGet("models/selection")]
    [Authorize]
    public async Task<IActionResult> GetModelSelection(CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var config = await _dbContext.TenantAIConfigurations
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == tenantId, cancellationToken);

        var selectedKey = config?.SelectedModelKey ?? AIModelRegistry.DefaultOpenAIModel;
        var model = AIModelRegistry.GetModelByKey(selectedKey) ?? AIModelRegistry.GetModelByKey(AIModelRegistry.DefaultOpenAIModel)!;

        var dto = new AIModelSelectionDto
        {
            SelectedModelKey = model.Key,
            Model = new AIModelDto
            {
                Key = model.Key,
                ProviderKey = model.ProviderKey,
                DisplayName = model.DisplayName,
                Description = model.Description,
                Capability = model.Capability,
                Status = model.Status,
                IsDefault = model.IsDefault,
                IsRecommended = model.IsRecommended,
                IsSelected = true
            },
            UpdatedAt = config?.UpdatedAt
        };

        return Ok(new
        {
            data = dto,
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// Updates the selected AI model for the tenant.
    /// Maintained for backwards compatibility.
    /// </summary>
    [HttpPut("models/selection")]
    [Authorize]
    public async Task<IActionResult> UpdateModelSelection([FromBody] UpdateModelSelectionRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var targetModelKey = request?.ResolvedModelKey;
        if (string.IsNullOrWhiteSpace(targetModelKey))
        {
            return BadRequest(new { Error = "Model identifier is required.", Code = AIErrorCodes.ValidationError });
        }

        var config = await _dbContext.TenantAIConfigurations
            .FirstOrDefaultAsync(c => c.TenantId == tenantId, cancellationToken);

        if (config == null || string.Equals(config.Status, AIConnectionStatus.NotConnected, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new 
            { 
                error = new 
                { 
                    code = AIErrorCodes.ProviderConnectionRequired, 
                    message = "An active AI provider connection is required before selecting an AI model." 
                },
                code = AIErrorCodes.ProviderConnectionRequired,
                message = "An active AI provider connection is required before selecting an AI model." 
            });
        }

        if (!AIModelRegistry.ValidateModelSelection(config.ProviderKey, targetModelKey, out var targetModel, out var errCode, out var errMsg))
        {
            // CRUCIAL: Preserve existing configuration on failure!
            return BadRequest(new 
            { 
                error = new { code = errCode, message = errMsg },
                code = errCode,
                message = errMsg 
            });
        }

        var userId = TryGetUserId();
        var previousModelKey = config.SelectedModelKey;

        config.SelectedModelKey = targetModel!.Key;
        config.SupportedCapability = targetModel.Capability;
        config.UpdatedByUserId = userId;
        config.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new
            {
                error = new
                {
                    code = AIErrorCodes.ConfigurationUpdateFailed,
                    message = "The AI configuration was modified concurrently by another operation. Please refresh and try again."
                },
                Error = "The AI configuration was modified concurrently by another operation. Please refresh and try again.",
                Code = AIErrorCodes.ConfigurationUpdateFailed
            });
        }

        _logger.LogInformation(
            "AUDIT: AI_MODEL_CHANGED. TenantId={TenantId}, UserId={UserId}, PreviousModelKey={PreviousModelKey}, NewModelKey={NewModelKey}, ProviderKey={ProviderKey}, Capability={Capability}",
            tenantId, userId, previousModelKey, targetModel.Key, config.ProviderKey, targetModel.Capability);

        var dto = new AIModelSelectionDto
        {
            SelectedModelKey = targetModel.Key,
            Model = new AIModelDto
            {
                Key = targetModel.Key,
                ProviderKey = targetModel.ProviderKey,
                DisplayName = targetModel.DisplayName,
                Description = targetModel.Description,
                Capability = targetModel.Capability,
                Status = targetModel.Status,
                IsDefault = targetModel.IsDefault,
                IsRecommended = targetModel.IsRecommended,
                IsSelected = true
            },
            UpdatedAt = config.UpdatedAt
        };

        return Ok(new
        {
            data = dto,
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// Content AI improvement endpoint.
    /// Uses trusted Business Context and requested operation to produce a draft suggestion.
    /// Does NOT automatically publish or alter Business Context.
    /// </summary>
    [HttpPost("content/improve")]
    [Authorize]
    [EnableRateLimiting("AiOperations")]
    public async Task<IActionResult> ImproveContent([FromBody] AIImproveContentRequest request, CancellationToken cancellationToken)
    {
        // 1. Authorize & Resolve Tenant
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        // 2. Validate input schema & boundaries
        var (isValid, valCode, valMsg) = AIRequestValidator.ValidateContentImprovementRequest(request);
        if (!isValid)
        {
            return BadRequest(new 
            { 
                error = new { code = valCode, message = valMsg },
                code = valCode,
                message = valMsg
            });
        }

        // 3. Verify confirmed Business Context (Onboarding check)
        // Website content generation requires full confirmed business context.
        // Self-refining business description, differentiators, or services allows in-progress onboarding context.
        var isBusinessContextRefinement =
            string.Equals(request.SectionKey, "business-context", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(request.SectionKey, "services", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(request.SectionKey, "onboarding", StringComparison.OrdinalIgnoreCase);

        var isConfirmed = await IsOnboardingCompleteAsync(tenantId, cancellationToken);
        if (!isConfirmed && !isBusinessContextRefinement)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                error = new { code = AIErrorCodes.OnboardingRequired, message = "Onboarding incomplete. Business Context must be confirmed before using AI assistance." },
                code = AIErrorCodes.OnboardingRequired,
                message = "Onboarding incomplete. Business Context must be confirmed before using AI assistance.",
                redirectUrl = "/admin/onboarding/business-basics"
            });
        }

        // 4. Retrieve trusted Business Context server-side
        var businessContext = await _dbContext.BusinessContexts
            .Include(b => b.Services)
            .FirstOrDefaultAsync(b => b.TenantId == tenantId, cancellationToken);

        if (businessContext == null)
        {
            return BadRequest(new 
            { 
                error = new { code = AIErrorCodes.ValidationError, message = "Business Context not found for tenant." },
                code = AIErrorCodes.ValidationError,
                message = "Business Context not found for tenant."
            });
        }

        // 5. Retrieve connected Website and Section if existing
        var website = await _dbContext.Websites
            .FirstOrDefaultAsync(w => w.TenantId == tenantId, cancellationToken);

        var websiteContent = website != null
            ? await _dbContext.WebsiteContents.FirstOrDefaultAsync(c => c.TenantId == tenantId && c.WebsiteId == website.Id && c.SectionKey == request.SectionKey, cancellationToken)
            : null;

        var resourceId = websiteContent?.Id ?? website?.Id ?? tenantId;

        // 6. Build trusted context
        var approvedFacts = new List<string>();
        if (businessContext.YearsInBusiness.HasValue) approvedFacts.Add($"Years in business: {businessContext.YearsInBusiness.Value}");
        if (businessContext.Certifications?.Count > 0) approvedFacts.Add($"Certifications: {string.Join(", ", businessContext.Certifications)}");
        if (businessContext.Awards?.Count > 0) approvedFacts.Add($"Awards: {string.Join(", ", businessContext.Awards)}");
        if (businessContext.Accreditations?.Count > 0) approvedFacts.Add($"Accreditations: {string.Join(", ", businessContext.Accreditations)}");
        if (businessContext.Warranties?.Count > 0) approvedFacts.Add($"Warranties: {string.Join(", ", businessContext.Warranties)}");
        if (businessContext.AuthorizedStatuses?.Count > 0) approvedFacts.Add($"Authorized: {string.Join(", ", businessContext.AuthorizedStatuses)}");
        if (businessContext.OtherClaims?.Count > 0) approvedFacts.Add($"Claims: {string.Join(", ", businessContext.OtherClaims)}");

        var executionContext = new AIExecutionContext
        {
            BusinessName = businessContext.BusinessName,
            BusinessType = businessContext.BusinessType,
            PrimaryCategory = businessContext.PrimaryCategory,
            BusinessDescription = businessContext.BusinessDescription,
            Differentiators = businessContext.Differentiators,
            Location = $"{businessContext.City}, {businessContext.State}, {businessContext.Country}".Trim(',', ' '),
            Services = businessContext.Services.Select(s => s.ServiceName).ToList(),
            ApprovedFacts = approvedFacts,
            SectionKey = request.SectionKey,
            FieldName = request.Field,
            CurrentDraftContent = websiteContent?.DraftContentJson,
            ExistingPublishedContent = websiteContent?.PublishedContentJson
        };

        var aiConfig = await _dbContext.TenantAIConfigurations
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == tenantId, cancellationToken);
        var selectedModelKey = aiConfig?.SelectedModelKey ?? AIModelRegistry.DefaultOpenAIModel;

        var currentVersion = websiteContent?.Version ?? 1;

        var executionRequest = new AIExecutionRequest
        {
            TenantId = tenantId,
            UserId = TryGetUserId(),
            OperationType = request.Operation,
            ResourceType = isBusinessContextRefinement ? AIResourceTypes.General : AIResourceTypes.WebsiteContent,
            ResourceId = resourceId,
            InputText = request.CurrentText,
            Instruction = request.Instruction,
            TargetSectionKey = request.SectionKey,
            TargetFieldKey = request.Field,
            TargetResourceVersion = currentVersion,
            Context = executionContext,
            Options = new AIOperationOptions { ModelKey = selectedModelKey }
        };

        _logger.LogInformation(
            "AUDIT: AI_GENERATION_STARTED. TenantId={TenantId}, UserId={UserId}, Operation={Operation}, SectionKey={SectionKey}, FieldKey={FieldKey}",
            tenantId, executionRequest.UserId, request.Operation, request.SectionKey, request.Field);

        // 7. Execute AI Operation via AI Service
        var result = await _aiService.ExecuteAsync(executionRequest, cancellationToken);

        if (!result.Success)
        {
            _logger.LogWarning(
                "AUDIT: AI_GENERATION_FAILED. TenantId={TenantId}, AIRequestId={AIRequestId}, Operation={Operation}, ErrorCode={ErrorCode}",
                tenantId, result.AIRequestId, request.Operation, result.ErrorCode);

            return result.ErrorCode switch
            {
                AIErrorCodes.ModelCapabilityMismatch => BadRequest(new
                {
                    error = new { code = result.ErrorCode, message = result.ErrorMessage ?? "The configured model does not support this workflow." },
                    code = result.ErrorCode,
                    message = result.ErrorMessage ?? "The configured model does not support this workflow.",
                    aiRequestId = result.AIRequestId
                }),
                AIErrorCodes.ModelUnavailable or AIErrorCodes.ModelNotFound => BadRequest(new
                {
                    error = new { code = result.ErrorCode, message = result.ErrorMessage ?? "The configured AI model is unavailable. Please verify the selected model in AI Connections." },
                    code = result.ErrorCode,
                    message = result.ErrorMessage ?? "The configured AI model is unavailable. Please verify the selected model in AI Connections.",
                    aiRequestId = result.AIRequestId
                }),
                AIErrorCodes.ConnectionTestFailed => StatusCode(StatusCodes.Status401Unauthorized, new
                {
                    error = new { code = result.ErrorCode, message = result.ErrorMessage ?? "AI connection could not be authenticated. Please verify your API key in AI Connections." },
                    code = result.ErrorCode,
                    message = result.ErrorMessage ?? "AI connection could not be authenticated. Please verify your API key in AI Connections.",
                    aiRequestId = result.AIRequestId
                }),
                AIErrorCodes.RateLimited => StatusCode(StatusCodes.Status429TooManyRequests, new
                {
                    error = new { code = result.ErrorCode, message = result.ErrorMessage ?? "The AI provider is temporarily rate limited. Please try again later." },
                    code = result.ErrorCode,
                    message = result.ErrorMessage ?? "The AI provider is temporarily rate limited. Please try again later.",
                    aiRequestId = result.AIRequestId
                }),
                AIErrorCodes.ProviderUnavailable => StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    error = new { code = result.ErrorCode, message = result.ErrorMessage ?? "The AI provider is temporarily unavailable. Please try again shortly." },
                    code = result.ErrorCode,
                    message = result.ErrorMessage ?? "The AI provider is temporarily unavailable. Please try again shortly.",
                    aiRequestId = result.AIRequestId
                }),
                AIErrorCodes.ProcessingTimeout => StatusCode(StatusCodes.Status504GatewayTimeout, new
                {
                    error = new { code = result.ErrorCode, message = result.ErrorMessage ?? "The AI request timed out. Please try again." },
                    code = result.ErrorCode,
                    message = result.ErrorMessage ?? "The AI request timed out. Please try again.",
                    aiRequestId = result.AIRequestId
                }),
                AIErrorCodes.ValidationError or AIErrorCodes.InvalidRequest or AIErrorCodes.OutputInvalid or AIErrorCodes.OutputProhibitedContent or AIErrorCodes.OutputValidationFailed or AIErrorCodes.ContentValidationFailed or AIErrorCodes.ContentOperationNotSupported or AIErrorCodes.ContentFieldNotSupported or AIErrorCodes.UnsupportedOperation => BadRequest(new
                {
                    error = new { code = result.ErrorCode, message = result.ErrorMessage ?? "Invalid AI request." },
                    code = result.ErrorCode,
                    message = result.ErrorMessage ?? "Invalid AI request.",
                    aiRequestId = result.AIRequestId
                }),
                _ => StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    error = new { code = result.ErrorCode ?? AIErrorCodes.ProcessingFailed, message = result.ErrorMessage ?? "An error occurred while processing the AI request." },
                    code = result.ErrorCode ?? AIErrorCodes.ProcessingFailed,
                    message = result.ErrorMessage ?? "An error occurred while processing the AI request.",
                    aiRequestId = result.AIRequestId
                })
            };
        }

        _logger.LogInformation(
            "AUDIT: AI_GENERATION_SUCCEEDED. TenantId={TenantId}, AIRequestId={AIRequestId}, Operation={Operation}",
            tenantId, result.AIRequestId, request.Operation);

        return Ok(new
        {
            data = new AIContentResponseDto
            {
                AiRequestId = result.AIRequestId,
                Suggestion = result.OutputText ?? string.Empty,
                Status = result.Status,
                ReviewStatus = result.ReviewStatus,
                OriginalText = request.CurrentText,
                SectionKey = request.SectionKey,
                Field = request.Field,
                TargetResourceVersion = currentVersion
            },
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// Gets the status and metadata of an AI request by ID.
    /// Strictly tenant-isolated: requests belonging to other tenants return 404.
    /// </summary>
    [HttpGet("requests/{aiRequestId:guid}")]
    [Authorize]
    public async Task<IActionResult> GetRequestStatus(Guid aiRequestId, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var statusDto = await _aiService.GetRequestStatusAsync(tenantId, aiRequestId, cancellationToken);
        if (statusDto == null)
        {
            return NotFound(new { Error = "AI request not found." });
        }

        return Ok(new
        {
            data = statusDto,
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// Gets detailed review metadata for an AI request including output, original baseline,
    /// and current review state. Strictly tenant-isolated.
    /// </summary>
    [HttpGet("requests/{aiRequestId:guid}/review")]
    [Authorize]
    public async Task<IActionResult> GetReviewDetail(Guid aiRequestId, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var detail = await _aiService.GetReviewDetailAsync(tenantId, aiRequestId, cancellationToken);
        if (detail == null)
        {
            return NotFound(new { Error = "AI request not found." });
        }

        return Ok(new
        {
            data = detail,
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// Explicit human review acceptance endpoint.
    /// Re-validates server-side, verifies optimistic concurrency against stale drafts,
    /// updates the draft only (never auto-publishes), and transitions state to Accepted
    /// or EditedBeforeAcceptance.
    /// </summary>
    [HttpPost("requests/{aiRequestId:guid}/accept")]
    [Authorize]
    [EnableRateLimiting("AiOperations")]
    public async Task<IActionResult> AcceptOutput(
        Guid aiRequestId,
        [FromBody] AIReviewRequestDto? request,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var userId = TryGetUserId();
        var result = await _aiService.AcceptOutputAsync(tenantId, aiRequestId, request?.EditedText, userId, cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == AIErrorCodes.ResultStaleConflict)
            {
                return Conflict(new
                {
                    error = new { code = result.ErrorCode, message = result.ErrorMessage },
                    code = result.ErrorCode,
                    message = result.ErrorMessage,
                    aiRequestId
                });
            }

            if (result.ErrorCode == AIErrorCodes.ResourceNotFound)
            {
                return NotFound(new
                {
                    error = new { code = result.ErrorCode, message = result.ErrorMessage },
                    code = result.ErrorCode,
                    message = result.ErrorMessage,
                    aiRequestId
                });
            }

            return BadRequest(new
            {
                error = new { code = result.ErrorCode ?? AIErrorCodes.ValidationError, message = result.ErrorMessage },
                code = result.ErrorCode ?? AIErrorCodes.ValidationError,
                message = result.ErrorMessage,
                aiRequestId
            });
        }

        return Ok(new
        {
            data = result,
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// Explicit human review rejection endpoint.
    /// Discards the AI proposal, marks the request Rejected, and preserves existing drafts
    /// and published content completely unchanged. Safe and idempotent.
    /// </summary>
    [HttpPost("requests/{aiRequestId:guid}/reject")]
    [Authorize]
    [EnableRateLimiting("AiOperations")]
    public async Task<IActionResult> RejectOutput(
        Guid aiRequestId,
        [FromBody] AIRejectRequestDto? request,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        var userId = TryGetUserId();
        var result = await _aiService.RejectOutputAsync(tenantId, aiRequestId, request?.Reason, userId, cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == AIErrorCodes.ResourceNotFound)
            {
                return NotFound(new
                {
                    error = new { code = result.ErrorCode, message = result.ErrorMessage },
                    code = result.ErrorCode,
                    message = result.ErrorMessage,
                    aiRequestId
                });
            }

            return BadRequest(new
            {
                error = new { code = result.ErrorCode ?? AIErrorCodes.ValidationError, message = result.ErrorMessage },
                code = result.ErrorCode ?? AIErrorCodes.ValidationError,
                message = result.ErrorMessage,
                aiRequestId
            });
        }

        return Ok(new
        {
            data = result,
            requestId = HttpContext.TraceIdentifier
        });
    }

    /// <summary>
    /// AI Image Enhancement endpoint per PILOT_V1_API_SPECIFICATION section 42.
    /// Strictly verifies tenant ownership, validates capability, creates derived variant, and preserves original image.
    /// </summary>
    [HttpPost("images/{imageId:guid}/enhance")]
    [Authorize]
    [EnableRateLimiting("AiOperations")]
    [Consumes("application/json", "multipart/form-data", "application/x-www-form-urlencoded")]
    public async Task<IActionResult> EnhanceImage(
        Guid imageId,
        CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId, out var authError))
        {
            return authError!;
        }

        string? operation = null;
        if (Request.HasJsonContentType())
        {
            try
            {
                var body = await Request.ReadFromJsonAsync<EnhanceImageRequest>(cancellationToken: cancellationToken);
                operation = body?.Operation;
            }
            catch
            {
                // Json parsing error
            }
        }
        else if (Request.HasFormContentType)
        {
            operation = Request.Form["operation"].ToString();
            if (string.IsNullOrWhiteSpace(operation))
            {
                operation = Request.Form["Operation"].ToString();
            }
        }

        if (string.IsNullOrWhiteSpace(operation) && Request.Query.ContainsKey("operation"))
        {
            operation = Request.Query["operation"].ToString();
        }

        if (string.IsNullOrWhiteSpace(operation))
        {
            return BadRequest(new { Error = "Enhancement operation is required.", Code = "OPERATION_REQUIRED" });
        }

        var userId = TryGetUserId();
        var result = await _imageService.EnhanceImageAsync(tenantId, imageId, operation, userId, cancellationToken);

        if (!result.Success)
        {
            if (result.ErrorCode == "IMAGE_NOT_FOUND")
            {
                return NotFound(new { error = new { code = result.ErrorCode, message = result.ErrorMessage }, code = result.ErrorCode, message = result.ErrorMessage });
            }

            return BadRequest(new
            {
                error = new { code = result.ErrorCode, message = result.ErrorMessage },
                code = result.ErrorCode,
                message = result.ErrorMessage
            });
        }

        return StatusCode(StatusCodes.Status202Accepted, new
        {
            data = new
            {
                imageId = imageId,
                variantId = result.Variant?.Id,
                status = "Processing",
                operation = operation
            },
            requestId = HttpContext.TraceIdentifier
        });
    }
}
