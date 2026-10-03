using System.Diagnostics;
using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Sparovia.Application.AI;
using Sparovia.Domain.Constants;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.AI;
using Sparovia.Infrastructure.Data;

namespace Sparovia.UnitTests;

public class AIServiceTests
{
    private readonly IAICredentialEncryptionService _encryptionService;

    public AIServiceTests()
    {
        var configuration = new ConfigurationBuilder().Build();
        _encryptionService = new AesGcmAICredentialEncryptionService(configuration);
    }

    private static SparoviaDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<SparoviaDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new SparoviaDbContext(options);
    }

    [Fact]
    public void Validator_RejectsNullRequest()
    {
        var (isValid, code, msg) = AIRequestValidator.ValidateContentImprovementRequest(null!);
        Assert.False(isValid);
        Assert.Equal(AIErrorCodes.InvalidRequest, code);
    }

    [Fact]
    public void Validator_RejectsEmptySectionKey()
    {
        var req = new AIImproveContentRequest
        {
            SectionKey = "",
            Field = "headline",
            Operation = AIOperationTypes.MakeMoreProfessional,
            CurrentText = "Modern kitchen solutions."
        };
        var (isValid, code, _) = AIRequestValidator.ValidateContentImprovementRequest(req);
        Assert.False(isValid);
        Assert.Equal(AIErrorCodes.ValidationError, code);
    }

    [Fact]
    public void Validator_RejectsUnsupportedOperation()
    {
        var req = new AIImproveContentRequest
        {
            SectionKey = "BusinessHero",
            Field = "headline",
            Operation = "UnsupportedUnknownOperation123",
            CurrentText = "Modern kitchen solutions."
        };
        var (isValid, code, _) = AIRequestValidator.ValidateContentImprovementRequest(req);
        Assert.False(isValid);
        Assert.Equal(AIErrorCodes.UnsupportedOperation, code);
    }

    [Fact]
    public void Validator_RejectsOversizedCurrentText()
    {
        var req = new AIImproveContentRequest
        {
            SectionKey = "BusinessHero",
            Field = "headline",
            Operation = AIOperationTypes.MakeMoreProfessional,
            CurrentText = new string('A', 4001) // Exceeds 4000
        };
        var (isValid, code, _) = AIRequestValidator.ValidateContentImprovementRequest(req);
        Assert.False(isValid);
        Assert.Equal(AIErrorCodes.ValidationError, code);
    }

    [Fact]
    public void Validator_RejectsOversizedInstruction()
    {
        var req = new AIImproveContentRequest
        {
            SectionKey = "BusinessHero",
            Field = "headline",
            Operation = AIOperationTypes.CustomInstruction,
            CurrentText = "Modern kitchen solutions.",
            Instruction = new string('B', 1001) // Exceeds 1000
        };
        var (isValid, code, _) = AIRequestValidator.ValidateContentImprovementRequest(req);
        Assert.False(isValid);
        Assert.Equal(AIErrorCodes.ValidationError, code);
    }

    [Fact]
    public void Validator_AcceptsValidContentImprovementRequest()
    {
        var req = new AIImproveContentRequest
        {
            SectionKey = "BusinessHero",
            Field = "headline",
            Operation = AIOperationTypes.MakeMoreProfessional,
            CurrentText = "We do good interiors."
        };
        var (isValid, code, msg) = AIRequestValidator.ValidateContentImprovementRequest(req);
        Assert.True(isValid);
        Assert.Null(code);
        Assert.Null(msg);
    }

    [Fact]
    public async Task AIService_ExecuteAsync_RejectsNonExistentTenant()
    {
        using var dbContext = CreateInMemoryDbContext();
        var provider = new StubAIProviderAdapter();
        var options = Options.Create(new AIOptions());
        var service = new AIService(provider, dbContext, _encryptionService, options, NullLogger<AIService>.Instance);

        var execReq = new AIExecutionRequest
        {
            TenantId = Guid.NewGuid(), // Non-existent
            OperationType = AIOperationTypes.MakeMoreProfessional,
            ResourceType = AIResourceTypes.WebsiteContent,
            ResourceId = Guid.NewGuid(),
            InputText = "Sample text"
        };

        var result = await service.ExecuteAsync(execReq);
        Assert.False(result.Success);
        Assert.Equal(AIErrorCodes.TenantMismatch, result.ErrorCode);
    }

    [Fact]
    public async Task AIService_ExecuteAsync_PersistsAIRequestAndSucceeds()
    {
        using var dbContext = CreateInMemoryDbContext();
        var tenant = new Tenant { Name = "Test Design Studio" };
        dbContext.Tenants.Add(tenant);
        await dbContext.SaveChangesAsync();

        var provider = new StubAIProviderAdapter();
        var options = Options.Create(new AIOptions { TimeoutSeconds = 10 });
        var service = new AIService(provider, dbContext, _encryptionService, options, NullLogger<AIService>.Instance);

        var execReq = new AIExecutionRequest
        {
            TenantId = tenant.Id,
            OperationType = AIOperationTypes.MakeMoreProfessional,
            ResourceType = AIResourceTypes.WebsiteContent,
            ResourceId = Guid.NewGuid(),
            InputText = "Interior excellence",
            Context = new AIExecutionContext { BusinessName = tenant.Name }
        };

        var result = await service.ExecuteAsync(execReq);

        Assert.True(result.Success);
        Assert.Equal(AIRequestStatus.Succeeded, result.Status);
        Assert.NotNull(result.OutputText);

        // Verify entity persisted in DbContext
        var savedRecord = await dbContext.AIRequests.FirstOrDefaultAsync(r => r.Id == result.AIRequestId);
        Assert.NotNull(savedRecord);
        Assert.Equal(tenant.Id, savedRecord.TenantId);
        Assert.Equal(AIRequestStatus.Succeeded, savedRecord.Status);
        Assert.NotNull(savedRecord.CompletedAt);
    }

    [Fact]
    public async Task AIService_ExecuteAsync_ProviderFailure_PreservesFailureStatusWithoutThrowing()
    {
        using var dbContext = CreateInMemoryDbContext();
        var tenant = new Tenant { Name = "Test Design Studio" };
        dbContext.Tenants.Add(tenant);
        await dbContext.SaveChangesAsync();

        var provider = new StubAIProviderAdapter();
        var options = Options.Create(new AIOptions { TimeoutSeconds = 10 });
        var service = new AIService(provider, dbContext, _encryptionService, options, NullLogger<AIService>.Instance);

        var execReq = new AIExecutionRequest
        {
            TenantId = tenant.Id,
            OperationType = AIOperationTypes.MakeMoreProfessional,
            ResourceType = AIResourceTypes.WebsiteContent,
            ResourceId = Guid.NewGuid(),
            InputText = "Test text __SIMULATE_PROVIDER_ERROR__"
        };

        var result = await service.ExecuteAsync(execReq);

        Assert.False(result.Success);
        Assert.Equal(AIRequestStatus.Failed, result.Status);
        Assert.Equal(AIErrorCodes.ProviderUnavailable, result.ErrorCode);

        // Verify status persisted as Failed
        var savedRecord = await dbContext.AIRequests.FirstOrDefaultAsync(r => r.Id == result.AIRequestId);
        Assert.NotNull(savedRecord);
        Assert.Equal(AIRequestStatus.Failed, savedRecord.Status);
        Assert.Equal(AIErrorCodes.ProviderUnavailable, savedRecord.ErrorCode);
    }

    [Fact]
    public async Task AIService_TenantIsolation_GetRequestStatus_BlocksCrossTenantAccess()
    {
        using var dbContext = CreateInMemoryDbContext();
        var tenantA = new Tenant { Name = "Tenant A" };
        var tenantB = new Tenant { Name = "Tenant B" };
        dbContext.Tenants.AddRange(tenantA, tenantB);

        var aiRecordA = new AIRequest
        {
            TenantId = tenantA.Id,
            OperationType = AIOperationTypes.MakeMoreProfessional,
            ResourceType = AIResourceTypes.WebsiteContent,
            ResourceId = Guid.NewGuid(),
            Status = AIRequestStatus.Succeeded
        };
        dbContext.AIRequests.Add(aiRecordA);
        await dbContext.SaveChangesAsync();

        var provider = new StubAIProviderAdapter();
        var options = Options.Create(new AIOptions());
        var service = new AIService(provider, dbContext, _encryptionService, options, NullLogger<AIService>.Instance);

        // Tenant A can access its own record
        var statusA = await service.GetRequestStatusAsync(tenantA.Id, aiRecordA.Id);
        Assert.NotNull(statusA);
        Assert.Equal(aiRecordA.Id, statusA.Id);

        // Tenant B cannot access Tenant A's record (returns null -> 404 in controller)
        var statusB = await service.GetRequestStatusAsync(tenantB.Id, aiRecordA.Id);
        Assert.Null(statusB);
    }

    [Fact]
    public void AIModelRegistry_ContainsExpectedApprovedModels()
    {
        var models = AIModelRegistry.GetAllApprovedModels();
        Assert.NotEmpty(models);
        Assert.Contains(models, m => m.Key == "gpt-4o-mini" && m.Status == AIModelStatus.Available);
        Assert.Contains(models, m => m.Key == "gpt-4o" && m.Status == AIModelStatus.Available);
        Assert.Contains(models, m => m.Key == "gemini-1.5-flash" && m.Status == AIModelStatus.Available);
        Assert.Contains(models, m => m.Key == "claude-3-5-sonnet" && m.Status == AIModelStatus.Available);
    }

    [Fact]
    public void AIModelRegistry_IsSelectable_EnforcesAllowlistAndAvailability()
    {
        // 1. Available models can be selected
        Assert.True(AIModelRegistry.IsSelectable("gpt-4o-mini", out var code1, out _));
        Assert.Null(code1);
        Assert.True(AIModelRegistry.IsSelectable("gpt-4o", out var code2, out _));
        Assert.Null(code2);

        // 2. Arbitrary unknown model is rejected
        Assert.False(AIModelRegistry.IsSelectable("arbitrary-gpt-999-unapproved", out var codeUnknown, out var msgUnknown));
        Assert.Equal(AIErrorCodes.ModelNotApproved, codeUnknown);
        Assert.Contains("not an approved", msgUnknown, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void AIModelRegistry_SupportsCapability_ValidatesCorrectly()
    {
        // Content model
        Assert.True(AIModelRegistry.SupportsCapability("gpt-4o-mini", AIModelCapability.Content));
        Assert.False(AIModelRegistry.SupportsCapability("gpt-4o-mini", AIModelCapability.Image));

        // Multimodal ("Both") model
        Assert.True(AIModelRegistry.SupportsCapability("gpt-4o", AIModelCapability.Content));
        Assert.True(AIModelRegistry.SupportsCapability("gpt-4o", AIModelCapability.Image));
    }

    [Fact]
    public async Task AIService_RejectsExecution_WhenModelLacksRequiredCapability()
    {
        using var dbContext = CreateInMemoryDbContext();
        var tenant = new Tenant { Name = "Capability Test Studio" };
        dbContext.Tenants.Add(tenant);

        // Configure tenant with gpt-4o-mini (which is Content only)
        var config = new TenantAIConfiguration
        {
            TenantId = tenant.Id,
            ProviderKey = AIProviders.OpenAI,
            SelectedModelKey = "gpt-4o-mini",
            SupportedCapability = AIModelCapability.Content
        };
        dbContext.TenantAIConfigurations.Add(config);
        await dbContext.SaveChangesAsync();

        var provider = new StubAIProviderAdapter();
        var options = Options.Create(new AIOptions());
        var service = new AIService(provider, dbContext, _encryptionService, options, NullLogger<AIService>.Instance);

        // Request an image operation with a content-only model
        var execReq = new AIExecutionRequest
        {
            TenantId = tenant.Id,
            OperationType = AIOperationTypes.ImproveClarity,
            ResourceType = AIResourceTypes.ImageVariant,
            ResourceId = Guid.NewGuid(),
            InputText = "Image enhancement request"
        };

        var result = await service.ExecuteAsync(execReq);
        Assert.False(result.Success);
        Assert.Equal(AIErrorCodes.ModelCapabilityMismatch, result.ErrorCode);
    }

    [Fact]
    public async Task AIService_UsesTenantSelectedModel_WhenNotExplicitlyProvided()
    {
        using var dbContext = CreateInMemoryDbContext();
        var tenant = new Tenant { Name = "Model Test Studio" };
        dbContext.Tenants.Add(tenant);

        var config = new TenantAIConfiguration
        {
            TenantId = tenant.Id,
            ProviderKey = AIProviders.OpenAI,
            SelectedModelKey = "gpt-4o",
            SupportedCapability = AIModelCapability.Both
        };
        dbContext.TenantAIConfigurations.Add(config);
        await dbContext.SaveChangesAsync();

        var provider = new StubAIProviderAdapter();
        var options = Options.Create(new AIOptions());
        var service = new AIService(provider, dbContext, _encryptionService, options, NullLogger<AIService>.Instance);

        var execReq = new AIExecutionRequest
        {
            TenantId = tenant.Id,
            OperationType = AIOperationTypes.MakeMoreProfessional,
            ResourceType = AIResourceTypes.WebsiteContent,
            ResourceId = Guid.NewGuid(),
            InputText = "Sample interior headline"
        };

        var result = await service.ExecuteAsync(execReq);
        Assert.True(result.Success);

        // Verify model used was the tenant's selected model
        var record = await dbContext.AIRequests.FirstOrDefaultAsync(r => r.Id == result.AIRequestId);
        Assert.NotNull(record);
        Assert.Equal("gpt-4o", record.ModelReference);
    }

    [Fact]
    public void AIModelRegistry_ValidateModelSelection_EnforcesAllowlistAndProviderRules()
    {
        // 1. Valid matching combination succeeds
        var valid = AIModelRegistry.ValidateModelSelection(AIProviders.OpenAI, "gpt-4o-mini", out var model, out var errCode, out var errMsg);
        Assert.True(valid);
        Assert.NotNull(model);
        Assert.Equal("gpt-4o-mini", model.Key);
        Assert.Null(errCode);
        Assert.Null(errMsg);

        // 2. Unapproved provider fails with AI_PROVIDER_NOT_FOUND
        var badProvider = AIModelRegistry.ValidateModelSelection("fake-ai-network", "gpt-4o-mini", out _, out var provErr, out _);
        Assert.False(badProvider);
        Assert.Equal(AIErrorCodes.ProviderNotFound, provErr);

        // 3. Unknown model fails with AI_MODEL_NOT_FOUND
        var badModel = AIModelRegistry.ValidateModelSelection(AIProviders.OpenAI, "unapproved-random-model", out _, out var modelErr, out _);
        Assert.False(badModel);
        Assert.Equal(AIErrorCodes.ModelNotFound, modelErr);

        // 4. Cross-provider mismatch fails with AI_PROVIDER_MODEL_MISMATCH
        var mismatch = AIModelRegistry.ValidateModelSelection(AIProviders.Gemini, "gpt-4o", out _, out var mismatchErr, out _);
        Assert.False(mismatch);
        Assert.Equal(AIErrorCodes.ProviderModelMismatch, mismatchErr);
    }
}
