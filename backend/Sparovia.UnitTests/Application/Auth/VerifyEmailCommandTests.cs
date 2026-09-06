using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Sparovia.Application.Interfaces;
using Sparovia.Application.UseCases.Auth;
using Xunit;

namespace Sparovia.UnitTests.Application.Auth;

public class VerifyEmailCommandTests
{
    private readonly Mock<IIdentityService> _mockIdentityService;

    public VerifyEmailCommandTests()
    {
        _mockIdentityService = new Mock<IIdentityService>();
    }

    [Fact]
    public async Task Handler_ShouldReturnFailure_WhenTokenIsEmpty()
    {
        var command = new VerifyEmailCommand { Token = "" };
        var handler = new VerifyEmailCommandHandler(_mockIdentityService.Object);

        var (success, error) = await handler.Handle(command, CancellationToken.None);

        Assert.False(success);
        Assert.Equal("Token cannot be empty.", error);
    }

    [Fact]
    public async Task Handler_ShouldReturnSuccess_WhenIdentityVerifiesSuccessfully()
    {
        var command = new VerifyEmailCommand { Token = "valid-token" };
        var handler = new VerifyEmailCommandHandler(_mockIdentityService.Object);

        _mockIdentityService.Setup(x => x.VerifyEmailAsync("valid-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, null));

        var (success, error) = await handler.Handle(command, CancellationToken.None);

        Assert.True(success);
        Assert.Null(error);
    }

    [Fact]
    public async Task Handler_ShouldReturnFailure_WhenIdentityFailsToVerify()
    {
        var command = new VerifyEmailCommand { Token = "invalid-token" };
        var handler = new VerifyEmailCommandHandler(_mockIdentityService.Object);

        _mockIdentityService.Setup(x => x.VerifyEmailAsync("invalid-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync((false, "expired"));

        var (success, error) = await handler.Handle(command, CancellationToken.None);

        Assert.False(success);
        Assert.Equal("expired", error);
    }
}
