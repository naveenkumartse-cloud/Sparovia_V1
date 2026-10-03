namespace Sparovia.Application.Identity;

public class PhoneOtpOptions
{
    public const string SectionName = "PhoneOtp";

    public int Length { get; set; } = 6;
    public int ExpiryMinutes { get; set; } = 5;
    public int MaxAttempts { get; set; } = 5;
    public int ResendCooldownSeconds { get; set; } = 60;
}
