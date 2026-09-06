using MediatR;
using Sparovia.Application.Common.Interfaces;
using Sparovia.Application.DTOs.Auth;
using Sparovia.Application.Interfaces;
using Sparovia.Domain.Entities;

namespace Sparovia.Application.UseCases.Auth;

public class RegisterUserCommand : IRequest<(bool Success, string? ErrorMessage)>
{
    public RegisterRequest Request { get; set; }

    public RegisterUserCommand(RegisterRequest request)
    {
        Request = request;
    }
}

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, (bool Success, string? ErrorMessage)>
{
    private readonly IIdentityService _identityService;
    private readonly IApplicationDbContext _context;

    public RegisterUserCommandHandler(IIdentityService identityService, IApplicationDbContext context)
    {
        _identityService = identityService;
        _context = context;
    }

    public async Task<(bool Success, string? ErrorMessage)> Handle(RegisterUserCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;

        // 1. Check if email exists locally (optional, Supabase will also check but it's good practice)
        // Leaving it out for now since we don't have the DbSet yet, but we will add it.
        // Wait, we need to add DbSet<User> to IApplicationDbContext soon.

        // 2. Create user in Identity Provider
        var (success, identityId, errorMessage) = await _identityService.CreateUserAsync(request.Email, request.Password, request.FullName, cancellationToken);

        if (!success || string.IsNullOrEmpty(identityId))
        {
            return (false, errorMessage ?? "Failed to create user in identity provider.");
        }

        // 3. Create user locally
        var user = new User
        {
            IdentityId = identityId,
            Email = request.Email,
            FullName = request.FullName
        };

        _context.AddUser(user);
        await _context.SaveChangesAsync(cancellationToken);

        return (true, null);
    }
}
