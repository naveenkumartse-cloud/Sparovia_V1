using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Interfaces;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Infrastructure.Persistence;
using Sparovia.Infrastructure.Repositories;
using Sparovia.Infrastructure.Services;

namespace Sparovia.Infrastructure;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'DefaultConnection' is not configured. " +
                "Set it in appsettings.json or via the CONNECTIONSTRINGS__DEFAULTCONNECTION environment variable.");

        services.AddDbContext<SparoviaDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
        });

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IBusinessRepository, BusinessRepository>();
        services.AddScoped<IMembershipRepository, MembershipRepository>();

        // Services
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenService, JwtTokenService>();

        return services;
    }
}
