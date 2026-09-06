using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Infrastructure;
using Sparovia.Infrastructure.Persistence;
using Xunit;

namespace Sparovia.IntegrationTests.Infrastructure;

public class DatabaseConnectivityTests
{
    [Fact]
    public async Task CanConnectToDatabase_ShouldReturnTrue_WhenConnectionIsConfigured()
    {
        // Arrange
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new[]
            {
                // In a real CI environment, this would read from environment variables or a real configuration source
                new System.Collections.Generic.KeyValuePair<string, string>("ConnectionStrings:DefaultConnection", "Host=localhost;Database=sparovia_test_db;Username=postgres;Password=password;Pooling=true")
            }!)
            .Build();

        var services = new ServiceCollection();
        
        // Add minimal required configuration for testing EF Core
        services.AddDbContext<SparoviaDbContext>(options =>
            options
                .UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                .UseSnakeCaseNamingConvention());
                
        var provider = services.BuildServiceProvider();
        var context = provider.GetRequiredService<SparoviaDbContext>();

        // We wrap in a try-catch to provide a descriptive skip if the database server isn't running locally
        try
        {
            // Act
            var canConnect = await context.Database.CanConnectAsync();

            // Assert
            Assert.True(canConnect, "Expected to be able to connect to the database. Ensure a PostgreSQL instance is running at the configured TestConnection string.");
        }
        catch (Npgsql.NpgsqlException)
        {
            // For CI environments without a database, we could gracefully skip, but for this explicit Foundation test, 
            // we will let it fail or log that the DB is unavailable locally.
            // Using Skip functionality in xUnit requires third-party packages, so we'll just assert it failed connecting.
            Assert.Fail("Could not connect to PostgreSQL. Is the database server running?");
        }
    }
}
