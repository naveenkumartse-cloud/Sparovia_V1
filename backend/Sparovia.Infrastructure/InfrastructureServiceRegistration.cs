using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Common.Interfaces;
using Sparovia.Application.Interfaces;
using Sparovia.Infrastructure.Identity;
using Sparovia.Infrastructure.Persistence;
using Sparovia.Infrastructure.Storage;

namespace Sparovia.Infrastructure;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<SparoviaDbContext>(options =>
            options
                .UseNpgsql(
                    configuration.GetConnectionString("DefaultConnection"),
                    b =>
                    {
                        b.MigrationsAssembly(typeof(SparoviaDbContext).Assembly.FullName);
                        b.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(15), errorCodesToAdd: null);
                        b.CommandTimeout(30);
                    })
                .UseSnakeCaseNamingConvention());

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<SparoviaDbContext>());

        services.AddSingleton<IStorageService, LocalStorageService>();

        var supabaseUrl = configuration["Supabase:Url"] ?? "";
        var supabaseKey = configuration["Supabase:ServiceRoleKey"] ?? "";

        services.AddScoped(provider => new Supabase.Client(supabaseUrl, supabaseKey, new Supabase.SupabaseOptions
        {
            AutoRefreshToken = false,
            AutoConnectRealtime = false
        }));

        services.AddScoped<IIdentityService, SupabaseIdentityService>();

        return services;
    }
}
