using DotNet.Testcontainers.Builders;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Sparovia.Infrastructure.Persistence;
using Testcontainers.PostgreSql;
using Xunit;

namespace Sparovia.IntegrationTests.Infrastructure;

public class IntegrationTestFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("sparovia_test")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    public HttpClient Client { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        Client = CreateClient();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the real DbContext registration
            services.RemoveAll<DbContextOptions<SparoviaDbContext>>();
            services.RemoveAll<SparoviaDbContext>();

            // Add test DbContext pointing at the Testcontainer PostgreSQL
            services.AddDbContext<SparoviaDbContext>(options =>
                options.UseNpgsql(_postgres.GetConnectionString()));

            // Add test JWT config
            services.Configure<Microsoft.Extensions.Options.IOptions<object>>(_ => { });
        });

        builder.UseEnvironment("Test");

        builder.UseSetting("Jwt:Secret", "integration-test-secret-at-least-32-chars!");
        builder.UseSetting("Jwt:Issuer", "sparovia-api");
        builder.UseSetting("Jwt:Audience", "sparovia-client");
        builder.UseSetting("Jwt:ExpiryMinutes", "60");
    }

    public new async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
    }
}
