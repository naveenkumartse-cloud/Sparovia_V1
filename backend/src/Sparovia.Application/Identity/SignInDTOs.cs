namespace Sparovia.Application.Identity;

public class SignInRequest
{
    public string? Email { get; set; }
    public string? Identifier { get; set; }
    public required string Password { get; set; }

    public string GetIdentifier()
    {
        if (!string.IsNullOrWhiteSpace(Identifier))
            return Identifier.Trim();
        return Email?.Trim() ?? string.Empty;
    }
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
    public string? Email { get; set; }
}
