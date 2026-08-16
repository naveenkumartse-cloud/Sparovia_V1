using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Sparovia.Application.Services;
using Sparovia.Application.Validators;

namespace Sparovia.Application;

public static class ApplicationServiceRegistration
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<BusinessService>();

        // Register all validators in this assembly
        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

        return services;
    }
}
