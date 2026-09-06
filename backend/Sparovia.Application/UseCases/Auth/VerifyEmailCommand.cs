using MediatR;
using Sparovia.Application.Interfaces;

namespace Sparovia.Application.UseCases.Auth;

public class VerifyEmailCommand : IRequest<(bool Success, string? ErrorMessage)>
{
    public string Token { get; set; } = string.Empty;
}

public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, (bool Success, string? ErrorMessage)>
{
    private readonly IIdentityService _identityService;

    public VerifyEmailCommandHandler(IIdentityService identityService)
    {
        _identityService = identityService;
    }

    public async Task<(bool Success, string? ErrorMessage)> Handle(VerifyEmailCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Token))
        {
            return (false, "Token cannot be empty.");
        }

        return await _identityService.VerifyEmailAsync(command.Token, cancellationToken);
    }
}
