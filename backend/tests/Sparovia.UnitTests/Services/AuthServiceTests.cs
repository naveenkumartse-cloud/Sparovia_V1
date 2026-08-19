using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Sparovia.Application.DTOs.Auth;
using Sparovia.Application.Exceptions;
using Sparovia.Application.Interfaces;
using Sparovia.Application.Interfaces.Repositories;
using Sparovia.Application.Services;
using Sparovia.Domain.Entities;
using Xunit;

namespace Sparovia.UnitTests.Services;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IPasswordHasher> _hasherMock = new();
    private readonly Mock<ITokenService> _tokenMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();
    private readonly Mock<ILogger<AuthService>> _loggerMock = new();

    private AuthService CreateService() => new(
        _userRepoMock.Object,
        _hasherMock.Object,
        _tokenMock.Object,
        _uowMock.Object,
        _loggerMock.Object);

    // Test 1: Successful registration
    [Fact]
    public async Task Register_ValidRequest_ReturnsAuthResponse()
    {
        // Arrange
        _userRepoMock.Setup(r => r.ExistsByEmailAsync(It.IsAny<string>(), default)).ReturnsAsync(false);
        _hasherMock.Setup(h => h.Hash(It.IsAny<string>())).Returns("hashed_password");
        _uowMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);
        _tokenMock.Setup(t => t.GenerateToken(It.IsAny<User>())).Returns("jwt_token");

        var service = CreateService();
        var request = new RegisterRequest("test@example.com", "Password1!", "John", "Doe");

        // Act
        var result = await service.RegisterAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().Be("jwt_token");
        result.User.Email.Should().Be("test@example.com");
        result.User.FirstName.Should().Be("John");
    }

    // Test 2: Duplicate registration
    [Fact]
    public async Task Register_DuplicateEmail_ThrowsConflictException()
    {
        _userRepoMock.Setup(r => r.ExistsByEmailAsync(It.IsAny<string>(), default)).ReturnsAsync(true);

        var service = CreateService();
        var request = new RegisterRequest("duplicate@example.com", "Password1!", "Jane", "Smith");

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() => service.RegisterAsync(request));
    }

    // Test 3: Valid login
    [Fact]
    public async Task Login_ValidCredentials_ReturnsAuthResponse()
    {
        var user = User.Create("user@test.com", "hashed_pw", "Alice", "Wonder");
        _userRepoMock.Setup(r => r.GetByEmailAsync("user@test.com", default)).ReturnsAsync(user);
        _hasherMock.Setup(h => h.Verify("Password1!", "hashed_pw")).Returns(true);
        _tokenMock.Setup(t => t.GenerateToken(user)).Returns("valid_token");

        var service = CreateService();
        var result = await service.LoginAsync(new LoginRequest("user@test.com", "Password1!"));

        result.Token.Should().Be("valid_token");
        result.User.Email.Should().Be("user@test.com");
    }

    // Test 4: Invalid login — wrong password
    [Fact]
    public async Task Login_WrongPassword_ThrowsUnauthorizedException()
    {
        var user = User.Create("user@test.com", "hashed_pw", "Alice", "Wonder");
        _userRepoMock.Setup(r => r.GetByEmailAsync("user@test.com", default)).ReturnsAsync(user);
        _hasherMock.Setup(h => h.Verify("WrongPass1!", "hashed_pw")).Returns(false);

        var service = CreateService();

        await Assert.ThrowsAsync<UnauthorizedException>(
            () => service.LoginAsync(new LoginRequest("user@test.com", "WrongPass1!")));
    }

    // Test 4b: Invalid login — user not found
    [Fact]
    public async Task Login_UnknownEmail_ThrowsUnauthorizedException()
    {
        _userRepoMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>(), default)).ReturnsAsync((User?)null);
        _hasherMock.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(false);

        var service = CreateService();

        await Assert.ThrowsAsync<UnauthorizedException>(
            () => service.LoginAsync(new LoginRequest("nobody@test.com", "Password1!")));
    }

    // Test: Password hash is never exposed
    [Fact]
    public async Task Register_PasswordHashIsNeverInResponse()
    {
        _userRepoMock.Setup(r => r.ExistsByEmailAsync(It.IsAny<string>(), default)).ReturnsAsync(false);
        _hasherMock.Setup(h => h.Hash(It.IsAny<string>())).Returns("very_secret_hash");
        _uowMock.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);
        _tokenMock.Setup(t => t.GenerateToken(It.IsAny<User>())).Returns("tok");

        var service = CreateService();
        var result = await service.RegisterAsync(new RegisterRequest("a@b.com", "Password1!", "A", "B"));

        // The UserResponse type must not contain PasswordHash
        var props = result.User.GetType().GetProperties().Select(p => p.Name);
        props.Should().NotContain("PasswordHash");
    }
}
