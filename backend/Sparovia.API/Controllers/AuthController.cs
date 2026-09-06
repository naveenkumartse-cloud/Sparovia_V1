using MediatR;
using Microsoft.AspNetCore.Mvc;
using Sparovia.Application.DTOs.Auth;
using Sparovia.Application.UseCases.Auth;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var command = new RegisterUserCommand(request);
            var (success, errorMessage) = await _mediator.Send(command);

            if (success)
            {
                return Created(string.Empty, new { message = "User registered successfully." });
            }

            return BadRequest(new { message = errorMessage });
        }
        catch (FluentValidation.ValidationException ex)
        {
            return BadRequest(new { message = "Validation failed.", errors = ex.Errors.Select(e => e.ErrorMessage) });
        }
        catch (Exception ex)
        {
            // Normally handled by a global exception handler, but explicitly catching here for safety
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred during registration." });
        }
    }

    [HttpPost("verify")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        try
        {
            var command = new VerifyEmailCommand { Token = request.Token };
            var (success, errorMessage) = await _mediator.Send(command);

            if (success)
            {
                return Ok(new { message = "Email verified successfully." });
            }

            return BadRequest(new { message = errorMessage });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred during verification." });
        }
    }

    [HttpPost("resend-verification")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
    {
        try
        {
            var command = new ResendVerificationCommand { Email = request.Email };
            var (success, errorMessage) = await _mediator.Send(command);

            if (success)
            {
                return Ok(new { message = "Verification email sent." });
            }

            if (errorMessage == "Too many resend requests. Please try again later.")
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, new { message = errorMessage });
            }

            return BadRequest(new { message = errorMessage });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred during resend." });
        }
    }
}
