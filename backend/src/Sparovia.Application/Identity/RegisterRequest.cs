namespace Sparovia.Application.Identity;

public class RegisterRequest
{
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required string ConfirmPassword { get; set; }
    public bool AcceptedTerms { get; set; }
}

public class RegistrationResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? VerificationLink { get; set; }
}
