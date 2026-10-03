using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sparovia.Application.Common.Interfaces;

namespace Sparovia.Infrastructure.Email;

public class SmtpEmailService : IEmailService
{
    private readonly SmtpOptions _options;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IOptions<SmtpOptions> options, ILogger<SmtpEmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendVerificationEmailAsync(string toEmail, string verificationLink, CancellationToken cancellationToken = default)
    {
        var subject = "Verify your Sparovia account";
        var (htmlBody, plainTextBody) = EmailTemplates.GetVerificationEmail(verificationLink);

        await SendEmailAsync(toEmail, subject, htmlBody, plainTextBody, "Verification", cancellationToken);
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink, CancellationToken cancellationToken = default)
    {
        var subject = "Reset your Sparovia password";
        var (htmlBody, plainTextBody) = EmailTemplates.GetPasswordResetEmail(resetLink);

        await SendEmailAsync(toEmail, subject, htmlBody, plainTextBody, "PasswordReset", cancellationToken);
    }

    private async Task SendEmailAsync(
        string toEmail,
        string subject,
        string htmlBody,
        string plainTextBody,
        string emailType,
        CancellationToken cancellationToken)
    {
        ValidateConfiguration();

        using var message = new MailMessage
        {
            From = new MailAddress(_options.FromEmail!, _options.FromName ?? "Sparovia"),
            Subject = subject
        };
        message.To.Add(toEmail);

        // Add plain-text fallback view
        var plainTextView = AlternateView.CreateAlternateViewFromString(plainTextBody, System.Text.Encoding.UTF8, "text/plain");
        message.AlternateViews.Add(plainTextView);

        // Add rich HTML view
        var htmlView = AlternateView.CreateAlternateViewFromString(htmlBody, System.Text.Encoding.UTF8, "text/html");
        message.AlternateViews.Add(htmlView);

        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.EnableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false
        };

        if (!string.IsNullOrWhiteSpace(_options.Username) && !string.IsNullOrWhiteSpace(_options.Password))
        {
            client.Credentials = new NetworkCredential(_options.Username, _options.Password);
        }

        try
        {
            _logger.LogInformation("Attempting email dispatch. Type: {EmailType}, To: {ToEmail}", emailType, MaskEmail(toEmail));
            await client.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("Email dispatch succeeded. Type: {EmailType}, To: {ToEmail}", emailType, MaskEmail(toEmail));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email dispatch failed. Type: {EmailType}, To: {ToEmail}, Host: {Host}, Port: {Port}",
                emailType, MaskEmail(toEmail), _options.Host, _options.Port);
            throw new InvalidOperationException("Failed to deliver email through configured SMTP provider.", ex);
        }
    }

    private void ValidateConfiguration()
    {
        if (string.IsNullOrWhiteSpace(_options.Host))
        {
            throw new InvalidOperationException("SMTP host is not configured. Please ensure SMTP_HOST is set.");
        }

        if (string.IsNullOrWhiteSpace(_options.FromEmail))
        {
            throw new InvalidOperationException("SMTP FromEmail is not configured. Please ensure SMTP_FROM_EMAIL is set.");
        }
    }

    public static string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return "unknown";
        var parts = email.Split('@');
        if (parts.Length != 2) return "***";
        var name = parts[0];
        var domain = parts[1];
        var maskedName = name.Length <= 2 ? name[0] + "*" : name[0] + new string('*', Math.Max(1, name.Length - 2)) + name[^1];
        return $"{maskedName}@{domain}";
    }
}
