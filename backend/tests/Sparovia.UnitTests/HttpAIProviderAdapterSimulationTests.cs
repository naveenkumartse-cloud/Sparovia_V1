using System.Net;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Sparovia.Domain.Constants;
using Sparovia.Infrastructure.AI;

namespace Sparovia.UnitTests;

public class HttpAIProviderAdapterSimulationTests
{
    private class MockHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ApplicationName { get; set; } = "Sparovia.API";
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }

    private class MockHttpMessageHandler : HttpMessageHandler
    {
        public HttpRequestMessage? LastRequest { get; private set; }
        public HttpResponseMessage ResponseToReturn { get; set; } = new(HttpStatusCode.Unauthorized)
        {
            Content = new StringContent("{\"error\":\"Real external provider called and rejected\"}")
        };

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            return Task.FromResult(ResponseToReturn);
        }
    }

    [Fact]
    public async Task TestConnectionDetailed_InProduction_BypassesSimulationHooksAndCallsRealProvider()
    {
        var prodEnv = new MockHostEnvironment { EnvironmentName = Environments.Production };
        var handler = new MockHttpMessageHandler();
        var httpClient = new HttpClient(handler);
        var options = Options.Create(new AIOptions());
        var logger = NullLogger<HttpAIProviderAdapter>.Instance;

        var adapter = new HttpAIProviderAdapter(httpClient, options, logger, prodEnv);

        // When passing __SIMULATE_VALID_KEY__ in Production, it must NOT return simulated 200 OK.
        // It must make a real HTTP call to the provider endpoint (handled by our MockHttpMessageHandler).
        var result = await adapter.TestConnectionDetailedAsync(AIProviders.OpenAI, "sk-__SIMULATE_VALID_KEY__");

        Assert.NotNull(handler.LastRequest);
        Assert.Equal("https://api.openai.com/v1/chat/completions", handler.LastRequest.RequestUri?.ToString());
        Assert.False(result.Success);
        Assert.Equal(401, result.StatusCode);
    }

    [Fact]
    public async Task TestConnectionDetailed_InProduction_BypassesQuotaSimulationHook()
    {
        var prodEnv = new MockHostEnvironment { EnvironmentName = Environments.Production };
        var handler = new MockHttpMessageHandler();
        var httpClient = new HttpClient(handler);
        var options = Options.Create(new AIOptions());
        var logger = NullLogger<HttpAIProviderAdapter>.Instance;

        var adapter = new HttpAIProviderAdapter(httpClient, options, logger, prodEnv);

        // In Production, __SIMULATE_QUOTA_EXCEEDED__ must NOT short-circuit. It must call the HTTP endpoint.
        var result = await adapter.TestConnectionDetailedAsync(AIProviders.OpenAI, "sk-__SIMULATE_QUOTA_EXCEEDED__");

        Assert.NotNull(handler.LastRequest);
        Assert.Equal("https://api.openai.com/v1/chat/completions", handler.LastRequest.RequestUri?.ToString());
        Assert.False(result.Success);
        Assert.Equal(401, result.StatusCode);
    }

    [Fact]
    public async Task TestConnectionDetailed_InDevelopment_ExecutesSimulationHooks()
    {
        var devEnv = new MockHostEnvironment { EnvironmentName = Environments.Development };
        var handler = new MockHttpMessageHandler();
        var httpClient = new HttpClient(handler);
        var options = Options.Create(new AIOptions());
        var logger = NullLogger<HttpAIProviderAdapter>.Instance;

        var adapter = new HttpAIProviderAdapter(httpClient, options, logger, devEnv);

        // In Development, simulation hooks return simulated responses without network calls
        var validResult = await adapter.TestConnectionDetailedAsync(AIProviders.OpenAI, "sk-__SIMULATE_VALID_KEY__");
        Assert.True(validResult.Success);
        Assert.Equal(200, validResult.StatusCode);
        Assert.Null(handler.LastRequest); // Never called external HTTP endpoint

        var quotaResult = await adapter.TestConnectionDetailedAsync(AIProviders.OpenAI, "sk-__SIMULATE_QUOTA_EXCEEDED__");
        Assert.False(quotaResult.Success);
        Assert.Equal(AIErrorCodes.QuotaExceeded, quotaResult.ErrorCode);
        Assert.Equal(429, quotaResult.StatusCode);
        Assert.Null(handler.LastRequest); // Never called external HTTP endpoint

        var invalidResult = await adapter.TestConnectionDetailedAsync(AIProviders.OpenAI, "sk-__SIMULATE_INVALID_KEY__");
        Assert.False(invalidResult.Success);
        Assert.Equal(AIErrorCodes.ConnectionTestFailed, invalidResult.ErrorCode);
        Assert.Equal(401, invalidResult.StatusCode);
        Assert.Null(handler.LastRequest);
    }
}
