namespace Sparovia.Application;

using Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Core application validators and registries are registered here or as singletons
        return services;
    }
}
