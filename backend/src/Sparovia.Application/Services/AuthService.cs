using Microsoft.Extensions.Logging;
using Sparovia.Application.DTOs.Auth;
using Sparovia.Application.Exceptions;
using Sparovia.Application.Interfaces;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Domain.Entities;

namespace Sparovia.Application.Services;

public class AuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IUnitOfWork unitOfWork,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var exists = await _userRepository.ExistsByEmailAsync(request.Email, cancellationToken);
        if (exists)
        {
            _logger.LogWarning("Registration failed: email already registered. Email={Email}", MaskEmail(request.Email));
            throw new ConflictException("A user with this email address already exists.");
        }

        var passwordHash = _passwordHasher.Hash(request.Password);
        var user = User.Create(request.Email, passwordHash, request.FirstName, request.LastName);

        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User registered successfully. UserId={UserId}", user.Id);

        var token = _tokenService.GenerateToken(user);
        return new AuthResponse(token, MapToUserResponse(user));
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        // Always attempt hash verify even on unknown user to prevent timing attacks
        var hashToVerify = user?.PasswordHash ?? "$2a$12$dummyhashtopreventtimingattacks.x12345678901234";
        var isValid = user is not null && _passwordHasher.Verify(request.Password, hashToVerify);

        if (!isValid || user is null || !user.IsActive)
        {
            _logger.LogWarning("Login failed: invalid credentials. Email={Email}", MaskEmail(request.Email));
            throw new UnauthorizedException("Invalid email or password.");
        }

        _logger.LogInformation("User logged in successfully. UserId={UserId}", user.Id);

        var token = _tokenService.GenerateToken(user);
        return new AuthResponse(token, MapToUserResponse(user));
    }

    public async Task<UserResponse> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
            throw new NotFoundException("User not found.");

        return MapToUserResponse(user);
    }

    private static UserResponse MapToUserResponse(User user) =>
        new(user.Id, user.Email, user.FirstName, user.LastName, user.IsActive);

    private static string MaskEmail(string email)
    {
        var atIndex = email.IndexOf('@');
        if (atIndex <= 1) return "***";
        return email[0] + "***" + email[atIndex..];
    }
}
