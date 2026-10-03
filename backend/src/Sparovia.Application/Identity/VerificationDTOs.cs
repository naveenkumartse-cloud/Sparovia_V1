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
