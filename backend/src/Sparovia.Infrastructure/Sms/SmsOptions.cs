using Microsoft.Extensions.Configuration;

namespace Sparovia.Infrastructure.Sms;

public class SmsOptions
{
    public const string SectionName = "Sms";

    public string Provider { get; set; } = "Twilio";
    public string? ApiKey { get; set; }
    public string? AccountSid { get; set; }
    public string? AuthToken { get; set; }
    public string? FromNumber { get; set; }
    public string? SenderId { get; set; }
    public bool EnableDelivery { get; set; } = false;

    public static SmsOptions FromConfiguration(IConfiguration configuration)
    {
        var options = new SmsOptions();
        var section = configuration.GetSection(SectionName);

        if (!string.IsNullOrWhiteSpace(section["Provider"]))
            options.Provider = section["Provider"]!.Trim();
        if (!string.IsNullOrWhiteSpace(section["ApiKey"]))
            options.ApiKey = section["ApiKey"]!.Trim();
        if (!string.IsNullOrWhiteSpace(section["AccountSid"]))
            options.AccountSid = section["AccountSid"]!.Trim();
        if (!string.IsNullOrWhiteSpace(section["AuthToken"]))
            options.AuthToken = section["AuthToken"];
        if (!string.IsNullOrWhiteSpace(section["FromNumber"]))
            options.FromNumber = section["FromNumber"]!.Trim();
        if (!string.IsNullOrWhiteSpace(section["SenderId"]))
            options.SenderId = section["SenderId"]!.Trim();
        if (bool.TryParse(section["EnableDelivery"], out var enableDelivery))
            options.EnableDelivery = enableDelivery;

        // Support standard Render flat environment variables (override if present)
        if (!string.IsNullOrWhiteSpace(configuration["SMS_PROVIDER"]))
            options.Provider = configuration["SMS_PROVIDER"]!.Trim();
        if (!string.IsNullOrWhiteSpace(configuration["SMS_API_KEY"]))
            options.ApiKey = configuration["SMS_API_KEY"]!.Trim();
        if (!string.IsNullOrWhiteSpace(configuration["SMS_ACCOUNT_SID"]))
            options.AccountSid = configuration["SMS_ACCOUNT_SID"]!.Trim();
        if (!string.IsNullOrWhiteSpace(configuration["SMS_AUTH_TOKEN"]))
            options.AuthToken = configuration["SMS_AUTH_TOKEN"];
        if (!string.IsNullOrWhiteSpace(configuration["SMS_FROM_NUMBER"]))
            options.FromNumber = configuration["SMS_FROM_NUMBER"]!.Trim();
        if (!string.IsNullOrWhiteSpace(configuration["SMS_SENDER_ID"]))
            options.SenderId = configuration["SMS_SENDER_ID"]!.Trim();
        if (bool.TryParse(configuration["SMS_ENABLE_DELIVERY"], out var renderDelivery))
            options.EnableDelivery = renderDelivery;

        return options;
    }
}
