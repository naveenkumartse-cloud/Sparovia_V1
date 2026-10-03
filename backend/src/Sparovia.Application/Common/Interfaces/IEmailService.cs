namespace Sparovia.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string toEmail, string verificationLink, CancellationToken cancellationToken = default);
    Task SendPasswordResetEmailAsync(string toEmail, string resetLink, CancellationToken cancellationToken = default);
}
