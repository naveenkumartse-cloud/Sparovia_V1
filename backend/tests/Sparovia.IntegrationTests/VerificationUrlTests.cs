using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Common.Interfaces;
using Sparovia.Application.Identity;

namespace Sparovia.IntegrationTests;

public class CapturingEmailService : IEmailService
{
    public string? LastVerificationEmail { get; private set; }
    public string? LastVerificationLink { get; private set; }
    public string? LastResetLink { get; private set; }

    public Task SendVerificationEmailAsync(string toEmail, string verificationLink, CancellationToken cancellationToken = default)
    {
        LastVerificationEmail = toEmail;
        LastVerificationLink = verificationLink;
        return Task.CompletedTask;
    }

    public Task SendPasswordResetEmailAsync(string toEmail, string resetLink, CancellationToken cancellationToken = default)
    {
        LastResetLink = resetLink;
        return Task.CompletedTask;
    }
}

public class VerificationUrlTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public VerificationUrlTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Register_GeneratesVerificationLink_TargetingAdminUrlNotPort3000NorLanding()
    {
        // Arrange
        var capturingEmailService = new CapturingEmailService();
        var customFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IEmailService));
                if (descriptor != null) services.Remove(descriptor);
                services.AddSingleton<IEmailService>(capturingEmailService);
            });
        });

        var client = customFactory.CreateClient();
        var email = $"verify-url-{Guid.NewGuid()}@sparovia.com";
        var request = new RegisterRequest
        {
            FullName = "Verify URL User",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(capturingEmailService.LastVerificationLink);
        
        var link = capturingEmailService.LastVerificationLink;
        // Verify link points to configured AdminUrl (port 3001)
        Assert.StartsWith("http://localhost:3001/verify-email", link);
        // Verify link NEVER points to port 3000 (public site) or /landing/*
        Assert.DoesNotContain("localhost:3000", link);
        Assert.DoesNotContain("/landing/", link);
        Assert.Contains($"email={Uri.EscapeDataString(email)}", link);
        Assert.Contains("token=", link);
    }

    [Fact]
    public async Task ResendVerification_GeneratesVerificationLink_TargetingAdminUrl()
    {
        // Arrange
        var capturingEmailService = new CapturingEmailService();
        var customFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IEmailService));
                if (descriptor != null) services.Remove(descriptor);
                services.AddSingleton<IEmailService>(capturingEmailService);
            });
        });

        var client = customFactory.CreateClient();
        var email = $"resend-url-{Guid.NewGuid()}@sparovia.com";
        await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            FullName = "Resend URL User",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        });

        // Act
        var resendResponse = await client.PostAsJsonAsync("/api/v1/auth/resend-verification", new ResendVerificationRequest
        {
            Email = email
        });

        // Assert
        Assert.Equal(HttpStatusCode.OK, resendResponse.StatusCode);
        Assert.NotNull(capturingEmailService.LastVerificationLink);
        
        var link = capturingEmailService.LastVerificationLink;
        Assert.StartsWith("http://localhost:3001/verify-email", link);
        Assert.DoesNotContain("localhost:3000", link);
        Assert.DoesNotContain("/landing/", link);
    }

    [Fact]
    public async Task Register_InDevelopmentEnvironment_SurfacesDevVerificationUrl()
    {
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
        }).CreateClient();

        var email = $"dev-env-{Guid.NewGuid()}@sparovia.com";
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            FullName = "Dev Env User",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains("devVerificationUrl", json);
        Assert.Contains("http://localhost:3001/verify-email", json);
    }

    [Fact]
    public async Task Register_InProductionEnvironment_DoesNotExposeDevVerificationUrl()
    {
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("ConnectionStrings:DefaultConnection", "Host=localhost;Database=sparovia_dev;Username=postgres;Password=Sparovia@16");
        }).CreateClient();

        var email = $"prod-env-{Guid.NewGuid()}@sparovia.com";
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            FullName = "Prod Env User",
            Email = email,
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!",
            AcceptedTerms = true
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("devVerificationUrl", json);
        Assert.DoesNotContain("DevVerificationUrl", json);
    }
}
