using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Sparovia.Application.Interfaces;
using Sparovia.Application.UseCases.Auth;
using Xunit;

namespace Sparovia.UnitTests.Application.Auth;

public class ResendVerificationCommandTests
{
    private readonly Mock<IIdentityService> _mockIdentityService;
    private readonly IMemoryCache _cache;

    public ResendVerificationCommandTests()
    {
        _mockIdentityService = new Mock<IIdentityService>();
        
        var options = new Microsoft.Extensions.Options.OptionsWrapper<MemoryCacheOptions>(new MemoryCacheOptions());
        _cache = new MemoryCache(options);
    }

    [Fact]
    public async Task Handler_ShouldReturnFailure_WhenEmailIsEmpty()
    {
        var command = new ResendVerificationCommand { Email = "" };
        var handler = new ResendVerificationCommandHandler(_mockIdentityService.Object, _cache);

        var (success, error) = await handler.Handle(command, CancellationToken.None);

        Assert.False(success);
        Assert.Equal("Email cannot be empty.", error);
    }

    [Fact]
    public async Task Handler_ShouldRateLimit_WhenCalledMoreThan3Times()
    {
        var command = new ResendVerificationCommand { Email = "test@example.com" };
        var handler = new ResendVerificationCommandHandler(_mockIdentityService.Object, _cache);
        
        _mockIdentityService.Setup(x => x.ResendVerificationEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, null));

        // Call 1
        await handler.Handle(command, CancellationToken.None);
        // Call 2
        await handler.Handle(command, CancellationToken.None);
        // Call 3
        await handler.Handle(command, CancellationToken.None);
        
        // Call 4 should fail
        var (success, error) = await handler.Handle(command, CancellationToken.None);

        Assert.False(success);
        Assert.Equal("Too many resend requests. Please try again later.", error);
        
        // Identity service should have only been called 3 times
        _mockIdentityService.Verify(x => x.ResendVerificationEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Exactly(3));
    }
}
