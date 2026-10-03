using Microsoft.Extensions.Configuration;

namespace Sparovia.Infrastructure.Email;

public class SmtpOptions
{
    public const string SectionName = "Email:Smtp";

    public string? Host { get; set; }
    public int Port { get; set; } = 587;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? FromEmail { get; set; }
    public string? FromName { get; set; } = "Sparovia";
    public bool EnableSsl { get; set; } = true;
    public bool EnableDelivery { get; set; } = true;

    /// <summary>
    /// Binds settings from the standard "Email:Smtp" section and also supports
    /// flat Render environment variables (SMTP_HOST, SMTP_PORT, etc.).
    /// </summary>
    public static SmtpOptions FromConfiguration(IConfiguration configuration)
    {
        var options = new SmtpOptions();
        var section = configuration.GetSection(SectionName);

        if (!string.IsNullOrWhiteSpace(section["Host"]))
            options.Host = section["Host"]!.Trim();
        if (int.TryParse(section["Port"], out var sPort) && sPort > 0)
            options.Port = sPort;
        if (!string.IsNullOrWhiteSpace(section["Username"]))
            options.Username = section["Username"]!.Trim();
        if (!string.IsNullOrWhiteSpace(section["Password"]))
            options.Password = section["Password"];
        if (!string.IsNullOrWhiteSpace(section["FromEmail"]))
            options.FromEmail = section["FromEmail"]!.Trim();
        if (!string.IsNullOrWhiteSpace(section["FromName"]))
            options.FromName = section["FromName"]!.Trim();
        if (bool.TryParse(section["EnableSsl"], out var sSsl))
            options.EnableSsl = sSsl;
        if (bool.TryParse(section["EnableDelivery"], out var sDelivery))
            options.EnableDelivery = sDelivery;

        // Support standard Render flat environment variables (override if present)
        if (!string.IsNullOrWhiteSpace(configuration["SMTP_HOST"]))
            options.Host = configuration["SMTP_HOST"]!.Trim();

        if (int.TryParse(configuration["SMTP_PORT"], out var port) && port > 0)
            options.Port = port;

        if (!string.IsNullOrWhiteSpace(configuration["SMTP_USERNAME"]))
            options.Username = configuration["SMTP_USERNAME"]!.Trim();

        if (!string.IsNullOrWhiteSpace(configuration["SMTP_PASSWORD"]))
            options.Password = configuration["SMTP_PASSWORD"];

        if (!string.IsNullOrWhiteSpace(configuration["SMTP_FROM_EMAIL"]))
            options.FromEmail = configuration["SMTP_FROM_EMAIL"]!.Trim();

        if (!string.IsNullOrWhiteSpace(configuration["SMTP_FROM_NAME"]))
            options.FromName = configuration["SMTP_FROM_NAME"]!.Trim();

        if (bool.TryParse(configuration["SMTP_ENABLE_SSL"], out var enableSsl))
            options.EnableSsl = enableSsl;

        if (bool.TryParse(configuration["SMTP_ENABLE_DELIVERY"], out var enableDelivery))
            options.EnableDelivery = enableDelivery;

        return options;
    }
}
