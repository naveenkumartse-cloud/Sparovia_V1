using System.Threading;
using System.Threading.Tasks;
using FluentValidation.TestHelper;
using Moq;
using Sparovia.Application.Common.Interfaces;
using Sparovia.Application.DTOs.Auth;
using Sparovia.Application.Interfaces;
using Sparovia.Application.UseCases.Auth;
using Sparovia.Application.Validators.Auth;
using Sparovia.Domain.Entities;
using Xunit;

namespace Sparovia.UnitTests.Application.Auth;

public class RegisterUserCommandTests
{
    private readonly Mock<IIdentityService> _mockIdentityService;
    private readonly Mock<IApplicationDbContext> _mockDbContext;
    private readonly RegisterRequestValidator _validator;

    public RegisterUserCommandTests()
    {
        _mockIdentityService = new Mock<IIdentityService>();
        _mockDbContext = new Mock<IApplicationDbContext>();
        _validator = new RegisterRequestValidator();
    }

    [Fact]
    public void Validator_ShouldHaveError_WhenEmailIsInvalid()
    {
        var request = new RegisterRequest { Email = "invalid_email", FullName = "Test User", Password = "StrongPassword123!" };
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Validator_ShouldHaveError_WhenPasswordIsTooShort()
    {
        var request = new RegisterRequest { Email = "test@example.com", FullName = "Test User", Password = "short" };
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public async Task Handler_ShouldReturnSuccess_WhenIdentityCreationSucceeds()
    {
        // Arrange
        var request = new RegisterRequest { Email = "test@example.com", FullName = "Test User", Password = "StrongPassword123!" };
        var command = new RegisterUserCommand(request);
        
        _mockIdentityService
            .Setup(x => x.CreateUserAsync(request.Email, request.Password, request.FullName, It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, "some-identity-id", null));

        var handler = new RegisterUserCommandHandler(_mockIdentityService.Object, _mockDbContext.Object);

        // Act
        var (success, errorMessage) = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(success);
        Assert.Null(errorMessage);
        _mockDbContext.Verify(x => x.AddUser(It.Is<User>(u => u.Email == request.Email && u.IdentityId == "some-identity-id")), Times.Once);
        _mockDbContext.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handler_ShouldReturnFailure_WhenIdentityCreationFails()
    {
        // Arrange
        var request = new RegisterRequest { Email = "test@example.com", FullName = "Test User", Password = "StrongPassword123!" };
        var command = new RegisterUserCommand(request);
        
        _mockIdentityService
            .Setup(x => x.CreateUserAsync(request.Email, request.Password, request.FullName, It.IsAny<CancellationToken>()))
            .ReturnsAsync((false, null, "Email already exists"));

        var handler = new RegisterUserCommandHandler(_mockIdentityService.Object, _mockDbContext.Object);

        // Act
        var (success, errorMessage) = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(success);
        Assert.Equal("Email already exists", errorMessage);
        _mockDbContext.Verify(x => x.AddUser(It.IsAny<User>()), Times.Never);
        _mockDbContext.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
