using Microsoft.Extensions.Logging;
using Sparovia.Application.Common.Interfaces;

namespace Sparovia.Infrastructure.Email;

public class StubEmailService : IEmailService
{
    private readonly ILogger<StubEmailService> _logger;

    public StubEmailService(ILogger<StubEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendVerificationEmailAsync(string toEmail, string verificationLink, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("=================================================");
        _logger.LogInformation("EMAIL DISPATCH: Verification Email");
        _logger.LogInformation("TO: {ToEmail}", toEmail);
        _logger.LogInformation("LINK: {VerificationLink}", verificationLink);
        _logger.LogInformation("=================================================");
        
        return Task.CompletedTask;
    }

    public Task SendPasswordResetEmailAsync(string toEmail, string resetLink, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("=================================================");
        _logger.LogInformation("EMAIL DISPATCH: Password Reset Email");
        _logger.LogInformation("TO: {ToEmail}", toEmail);
        _logger.LogInformation("LINK: {ResetLink}", resetLink);
        _logger.LogInformation("=================================================");

        return Task.CompletedTask;
    }
}
