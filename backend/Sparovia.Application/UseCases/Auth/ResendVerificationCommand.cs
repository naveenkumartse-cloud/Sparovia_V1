using MediatR;
using Microsoft.Extensions.Caching.Memory;
using Sparovia.Application.Interfaces;

namespace Sparovia.Application.UseCases.Auth;

public class ResendVerificationCommand : IRequest<(bool Success, string? ErrorMessage)>
{
    public string Email { get; set; } = string.Empty;
}

public class ResendVerificationCommandHandler : IRequestHandler<ResendVerificationCommand, (bool Success, string? ErrorMessage)>
{
    private readonly IIdentityService _identityService;
    private readonly IMemoryCache _cache;

    public ResendVerificationCommandHandler(IIdentityService identityService, IMemoryCache cache)
    {
        _identityService = identityService;
        _cache = cache;
    }

    public async Task<(bool Success, string? ErrorMessage)> Handle(ResendVerificationCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Email))
        {
            return (false, "Email cannot be empty.");
        }

        // Basic in-memory rate limiting: max 3 requests per 15 minutes per email
        var cacheKey = $"ResendLimit_{command.Email}";
        if (_cache.TryGetValue(cacheKey, out int requestCount))
        {
            if (requestCount >= 3)
            {
                return (false, "Too many resend requests. Please try again later.");
            }
            _cache.Set(cacheKey, requestCount + 1, TimeSpan.FromMinutes(15));
        }
        else
        {
            _cache.Set(cacheKey, 1, TimeSpan.FromMinutes(15));
        }

        return await _identityService.ResendVerificationEmailAsync(command.Email, cancellationToken);
    }
}
