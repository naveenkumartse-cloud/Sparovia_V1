using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Infrastructure.Data;

namespace Sparovia.IntegrationTests;

public class DatabaseConnectionTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public DatabaseConnectionTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task HealthCheck_ReturnsHealthy_WhenDatabaseIsAccessible()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/health");

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        Assert.Equal("Healthy", content);
    }

    [Fact]
    public async Task DbContext_CanConnectToDatabase()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SparoviaDbContext>();

        // Act
        var canConnect = await dbContext.Database.CanConnectAsync();

        // Assert
        Assert.True(canConnect);
    }
}
