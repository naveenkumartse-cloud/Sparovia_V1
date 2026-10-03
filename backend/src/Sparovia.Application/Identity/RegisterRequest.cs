namespace Sparovia.Application.Identity;

public class RegisterRequest
{
    public required string FullName { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public required string Password { get; set; }
    public required string ConfirmPassword { get; set; }
    public bool AcceptedTerms { get; set; }
}

public class RegistrationResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? PhoneNumber { get; set; }
    public string? PhoneNumberNormalized { get; set; }
    public string? DevOtp { get; set; }
    public string? VerificationLink { get; set; }
}
