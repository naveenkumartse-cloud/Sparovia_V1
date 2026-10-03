namespace Sparovia.Application.Identity;

public class SignInRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}

public class SignInResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    
    // Core identity properties returned safely to the controller to build the claims
    public Guid? UserId { get; set; }
    public Guid? TenantId { get; set; }
    public string? Role { get; set; }
    public string? FullName { get; set; }
}
