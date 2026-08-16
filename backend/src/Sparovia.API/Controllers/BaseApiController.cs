using Microsoft.AspNetCore.Mvc;

namespace Sparovia.API.Controllers;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");

        if (claim is null || !Guid.TryParse(claim.Value, out var userId))
            throw new Application.Exceptions.UnauthorizedException("Invalid or missing user identity.");

        return userId;
    }
}
