namespace Sparovia.Application.DTOs.Auth;

public record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName
);

public record LoginRequest(
    string Email,
    string Password
);

public record AuthResponse(
    string Token,
    UserResponse User
);

public record UserResponse(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    bool IsActive
);
