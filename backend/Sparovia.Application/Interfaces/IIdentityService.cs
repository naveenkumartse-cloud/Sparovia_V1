namespace Sparovia.Application.Interfaces;

public interface IIdentityService
{
    Task<(bool Success, string? IdentityId, string? ErrorMessage)> CreateUserAsync(string email, string password, string fullName, CancellationToken cancellationToken = default);
    Task<(bool Success, string? ErrorMessage)> VerifyEmailAsync(string token, CancellationToken cancellationToken = default);
    Task<(bool Success, string? ErrorMessage)> ResendVerificationEmailAsync(string email, CancellationToken cancellationToken = default);
}
