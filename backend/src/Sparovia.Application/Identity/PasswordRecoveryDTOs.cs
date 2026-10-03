using System.ComponentModel.DataAnnotations;

namespace Sparovia.Application.Identity;

public class ForgotPasswordRequest
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public required string Email { get; set; }
}

public class ForgotPasswordResult
{
    // Always true to prevent account enumeration
    public bool Success { get; set; } = true;
    public string Message { get; set; } = "If an account exists, a password reset link has been sent.";
}

public class ResetPasswordRequest
{
    [Required]
    public required string Email { get; set; }

    [Required]
    public required string Token { get; set; }

    [Required(ErrorMessage = "Password is required.")]
    [StringLength(100, MinimumLength = 12, ErrorMessage = "Password must be at least 12 characters.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,}$", 
        ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.")]
    public required string NewPassword { get; set; }

    [Required(ErrorMessage = "Confirm Password is required.")]
    [Compare("NewPassword", ErrorMessage = "The password and confirmation password do not match.")]
    public required string ConfirmPassword { get; set; }
}

public class ResetPasswordResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}
