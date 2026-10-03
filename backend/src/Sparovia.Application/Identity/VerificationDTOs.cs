namespace Sparovia.Application.Identity;

public class VerifyEmailRequest
{
    public required string Email { get; set; }
    public required string Token { get; set; }
}

public class ResendVerificationRequest
{
    public required string Email { get; set; }
}

public class VerificationResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? VerificationLink { get; set; }
}

public class SendPhoneOtpRequest
{
    public required string PhoneNumber { get; set; }
}

public class SendPhoneOtpResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public int? CooldownRemainingSeconds { get; set; }
    public string? DevOtp { get; set; }
}

public class VerifyPhoneOtpRequest
{
    public required string PhoneNumber { get; set; }
    public required string Otp { get; set; }
}

public class VerifyPhoneOtpResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public bool RequiresOnboarding { get; set; } = true;
    public string OnboardingStep { get; set; } = "/admin/onboarding/business-basics";
    public Guid? UserId { get; set; }
}
