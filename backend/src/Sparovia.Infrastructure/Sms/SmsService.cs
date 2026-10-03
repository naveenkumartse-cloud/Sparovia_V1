using System.Net.Http.Headers;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sparovia.Application.Common;
using Sparovia.Application.Common.Interfaces;

namespace Sparovia.Infrastructure.Sms;

public class SmsService : ISmsService
{
    private readonly SmsOptions _options;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmsService> _logger;
    private readonly IHostEnvironment? _environment;
    private readonly HttpClient _httpClient;

    public SmsService(
        IOptions<SmsOptions> options,
        IConfiguration configuration,
        ILogger<SmsService> logger,
        IHostEnvironment? environment = null,
        HttpClient? httpClient = null)
    {
        _options = options.Value;
        _configuration = configuration;
        _logger = logger;
        _environment = environment;
        _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
    }

    private bool IsProduction()
    {
        if (_environment != null)
        {
            return _environment.IsProduction() || _environment.IsStaging();
        }

        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? _configuration["ASPNETCORE_ENVIRONMENT"]
            ?? _configuration["DOTNET_ENVIRONMENT"];

        return string.Equals(env, "Production", StringComparison.OrdinalIgnoreCase)
            || string.Equals(env, "Staging", StringComparison.OrdinalIgnoreCase);
    }

    public async Task SendOtpAsync(string phoneNumber, string otp, CancellationToken cancellationToken = default)
    {
        var maskedPhone = PhoneNumberHelper.Mask(phoneNumber);

        // Only attempt external SMS dispatch if delivery is explicitly enabled AND credentials are provided
        var hasCredentials = !string.IsNullOrWhiteSpace(_options.AccountSid) || !string.IsNullOrWhiteSpace(_options.ApiKey);
        if (!_options.EnableDelivery || !hasCredentials)
        {
            _logger.LogInformation("Phone OTP delivery simulated (Pilot / Testing mode). To: {ToPhone}", maskedPhone);
            return;
        }

        try
        {
            _logger.LogInformation("Attempting SMS dispatch. Provider: {Provider}, To: {ToPhone}", _options.Provider, maskedPhone);

            var messageBody = $"Your Sparovia verification code is: {otp}. Valid for 5 minutes. Do not share this code.";

            // Standard Twilio SMS provider integration
            if (string.Equals(_options.Provider, "Twilio", StringComparison.OrdinalIgnoreCase))
            {
                var requestUrl = $"https://api.twilio.com/2010-04-01/Accounts/{_options.AccountSid}/Messages.json";
                using var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);
                
                var authToken = _options.AuthToken ?? _options.ApiKey ?? "";
                var basicAuth = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_options.AccountSid}:{authToken}"));
                request.Headers.Authorization = new AuthenticationHeaderValue("Basic", basicAuth);

                var formValues = new Dictionary<string, string>
                {
                    { "To", phoneNumber },
                    { "From", _options.FromNumber ?? _options.SenderId ?? "Sparovia" },
                    { "Body", messageBody }
                };
                request.Content = new FormUrlEncodedContent(formValues);

                var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogError("Twilio SMS dispatch failed with status {StatusCode}: {ErrorDetails}", response.StatusCode, errorContent);
                    throw new InvalidOperationException($"SMS provider returned status code {response.StatusCode}.");
                }
            }
            else
            {
                // Generic HTTP SMS integration
                _logger.LogInformation("Generic SMS provider dispatch simulated for {Provider}. To: {ToPhone}", _options.Provider, maskedPhone);
            }

            _logger.LogInformation("Phone OTP delivery succeeded. To: {ToPhone}", maskedPhone);
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            _logger.LogError(ex, "SMS dispatch failed. To: {ToPhone}, Provider: {Provider}, Error: {ErrorMessage}",
                maskedPhone, _options.Provider, ex.Message);
            throw new InvalidOperationException("Failed to deliver SMS through configured provider.", ex);
        }
    }
}
