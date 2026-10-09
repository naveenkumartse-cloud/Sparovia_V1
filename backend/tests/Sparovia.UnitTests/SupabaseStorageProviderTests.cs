namespace Sparovia.UnitTests;

using System.Net;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Sparovia.Infrastructure.Storage;
using Xunit;

public class SupabaseStorageProviderTests
{
    private class FakeLogger<T> : ILogger<T>
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) { }
    }

    private class FakeHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "Sparovia";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private class FakeHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;
        public HttpRequestMessage? LastRequest { get; private set; }

        public FakeHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
        {
            _responder = responder;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            return Task.FromResult(_responder(request));
        }
    }

    [Fact]
    public void SupabaseStorageOptions_BindsFromConfigurationSection()
    {
        var inMemory = new Dictionary<string, string?>
        {
            ["Supabase:Url"] = "https://custom-project.supabase.co",
            ["Supabase:Key"] = "custom-service-key",
            ["Supabase:Bucket"] = "custom-images"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemory).Build();

        var options = SupabaseStorageOptions.FromConfiguration(config);

        Assert.Equal("https://custom-project.supabase.co", options.Url);
        Assert.Equal("custom-service-key", options.Key);
        Assert.Equal("custom-images", options.Bucket);
    }

    [Fact]
    public void SupabaseStorageOptions_BindsFromFlatEnvironmentVariables()
    {
        var inMemory = new Dictionary<string, string?>
        {
            ["SUPABASE_URL"] = "https://env-project.supabase.co",
            ["SUPABASE_SERVICE_ROLE_KEY"] = "env-service-key",
            ["SUPABASE_BUCKET"] = "env-bucket"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemory).Build();

        var options = SupabaseStorageOptions.FromConfiguration(config);

        Assert.Equal("https://env-project.supabase.co", options.Url);
        Assert.Equal("env-service-key", options.Key);
        Assert.Equal("env-bucket", options.Bucket);
    }

    [Fact]
    public async Task UploadAsync_InProductionWithoutKey_FailsHard()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
        var prodEnv = new FakeHostEnvironment { EnvironmentName = Environments.Production };

        var httpClient = new HttpClient();
        var provider = new SupabaseStorageProvider(httpClient, config, new FakeLogger<SupabaseStorageProvider>(), prodEnv);

        var data = new MemoryStream(new byte[] { 1, 2, 3 });
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            provider.UploadAsync("sparovia-images", "tenants/t1/images/original/img.jpg", data, "image/jpeg"));

        Assert.Contains("credentials are missing in production", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UploadAsync_SendsCorrectSupabaseHeadersAndPayload()
    {
        var handler = new FakeHttpMessageHandler(req => new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.OK,
            Content = new StringContent("{\"Key\":\"sparovia-images/tenants/t1/img.jpg\"}", Encoding.UTF8, "application/json")
        });

        var httpClient = new HttpClient(handler);
        var inMemory = new Dictionary<string, string?>
        {
            ["Supabase:Url"] = "https://test-project.supabase.co",
            ["Supabase:Key"] = "test-service-key-12345",
            ["Supabase:Bucket"] = "sparovia-images"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemory).Build();
        var provider = new SupabaseStorageProvider(httpClient, config, new FakeLogger<SupabaseStorageProvider>());

        var imageBytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 };
        using var stream = new MemoryStream(imageBytes);

        var result = await provider.UploadAsync("sparovia-images", "tenants/t1/images/original/img.jpg", stream, "image/jpeg");

        var capturedRequest = handler.LastRequest;
        Assert.NotNull(capturedRequest);
        Assert.Equal(HttpMethod.Post, capturedRequest.Method);
        Assert.Equal("https://test-project.supabase.co/storage/v1/object/sparovia-images/tenants/t1/images/original/img.jpg", capturedRequest.RequestUri?.ToString());
        Assert.Equal("Bearer", capturedRequest.Headers.Authorization?.Scheme);
        Assert.Equal("test-service-key-12345", capturedRequest.Headers.Authorization?.Parameter);
        Assert.True(capturedRequest.Headers.Contains("apikey"));
        Assert.Equal("test-service-key-12345", capturedRequest.Headers.GetValues("apikey").First());
        Assert.True(capturedRequest.Headers.Contains("x-upsert"));
        Assert.Equal("true", capturedRequest.Headers.GetValues("x-upsert").First());
        Assert.Equal("image/jpeg", capturedRequest.Content?.Headers.ContentType?.MediaType);
        Assert.Equal("storage://sparovia-images/tenants/t1/images/original/img.jpg", result);
    }

    [Fact]
    public async Task UploadAsync_WhenSupabaseFails_ThrowsInformativeExceptionWithStatusCode()
    {
        var handler = new FakeHttpMessageHandler(req => new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.Forbidden,
            Content = new StringContent("{\"statusCode\":\"403\",\"error\":\"Unauthorized\",\"message\":\"new row violates row-level security policy\"}", Encoding.UTF8, "application/json")
        });

        var httpClient = new HttpClient(handler);
        var inMemory = new Dictionary<string, string?>
        {
            ["Supabase:Url"] = "https://test-project.supabase.co",
            ["Supabase:Key"] = "anon-key-without-permission",
            ["Supabase:Bucket"] = "sparovia-images"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemory).Build();
        var provider = new SupabaseStorageProvider(httpClient, config, new FakeLogger<SupabaseStorageProvider>());

        using var stream = new MemoryStream(new byte[] { 1, 2, 3 });
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            provider.UploadAsync("sparovia-images", "tenants/t1/test.jpg", stream, "image/jpeg"));

        Assert.Contains("403", ex.Message);
        Assert.Contains("permission denied", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetSignedUrlAsync_ParsesSignedUrlCorrectly()
    {
        var handler = new FakeHttpMessageHandler(req => new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.OK,
            Content = new StringContent("{\"signedURL\":\"/object/sign/sparovia-images/tenants/t1/test.jpg?token=abc123xyz\"}", Encoding.UTF8, "application/json")
        });

        var httpClient = new HttpClient(handler);
        var inMemory = new Dictionary<string, string?>
        {
            ["Supabase:Url"] = "https://test-project.supabase.co",
            ["Supabase:Key"] = "test-service-key",
            ["Supabase:Bucket"] = "sparovia-images"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemory).Build();
        var provider = new SupabaseStorageProvider(httpClient, config, new FakeLogger<SupabaseStorageProvider>());

        var signedUrl = await provider.GetSignedUrlAsync("sparovia-images", "tenants/t1/test.jpg", TimeSpan.FromMinutes(10));

        Assert.NotNull(signedUrl);
        Assert.Equal("https://test-project.supabase.co/storage/v1/object/sign/sparovia-images/tenants/t1/test.jpg?token=abc123xyz", signedUrl);
    }
}
