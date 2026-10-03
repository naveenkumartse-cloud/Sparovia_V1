using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Sparovia.Application.Identity;
using Sparovia.Infrastructure.Data;
using System.Security.Claims;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IIdentityService _identityService;
    private readonly IWebHostEnvironment _environment;
    private readonly SparoviaDbContext _dbContext;

    public AuthController(
        IIdentityService identityService, 
        IWebHostEnvironment environment,
        SparoviaDbContext dbContext)
    {
        _identityService = identityService;
        _environment = environment;
        _dbContext = dbContext;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!request.AcceptedTerms)
        {
            return BadRequest(new { Error = "You must accept the terms and conditions." });
        }

        if (request.Password.Length < 8)
        {
            return BadRequest(new { Error = "Password must be at least 8 characters long." });
        }

        var result = await _identityService.RegisterUserAsync(request, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage });
        }

        if (_environment.IsDevelopment() && !string.IsNullOrEmpty(result.VerificationLink))
        {
            return Ok(new 
            { 
                Message = "Account created successfully. Please verify your email to continue.",
                DevVerificationUrl = result.VerificationLink 
            });
        }

        return Ok(new { Message = "Account created successfully. Please verify your email to continue." });
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _identityService.VerifyEmailAsync(request, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage });
        }

        // Establish authenticated session for the verified user so they immediately enter onboarding
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var user = await _dbContext.Users
            .Include(u => u.Memberships)
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

        if (user != null && user.Memberships.Any())
        {
            var primaryMembership = user.Memberships.First();
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, primaryMembership.Role),
                new Claim("TenantId", primaryMembership.TenantId.ToString()),
                new Claim("FullName", user.FullName ?? "")
            };

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7)
            };

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                authProperties);
        }

        return Ok(new 
        { 
            Message = !string.IsNullOrWhiteSpace(result.ErrorMessage) ? result.ErrorMessage : "Email verified successfully.",
            RequiresOnboarding = true,
            OnboardingStep = "/admin/onboarding/business-basics"
        });
    }

    [HttpPost("resend-verification")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("ResendVerification")]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _identityService.ResendVerificationEmailAsync(request, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage });
        }

        if (_environment.IsDevelopment() && !string.IsNullOrEmpty(result.VerificationLink))
        {
            return Ok(new 
            { 
                Message = "If an unverified account exists, a verification email has been sent.",
                DevVerificationUrl = result.VerificationLink 
            });
        }

        return Ok(new { Message = "If an unverified account exists, a verification email has been sent." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] SignInRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _identityService.SignInAsync(request, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage });
        }

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, result.UserId.ToString()!),
            new Claim(ClaimTypes.Email, request.Email),
            new Claim(ClaimTypes.Role, result.Role!),
            new Claim("TenantId", result.TenantId.ToString()!),
            new Claim("FullName", result.FullName ?? "")
        };

        var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

        var authProperties = new AuthenticationProperties
        {
            IsPersistent = true,
            ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7)
        };

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme, 
            new ClaimsPrincipal(claimsIdentity), 
            authProperties);

        return Ok(new { Message = "Signed in successfully." });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok(new { Message = "Signed out successfully." });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
    {
        var tenantId = User.FindFirst("TenantId")?.Value;
        var fullName = User.FindFirst("FullName")?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;

        bool isOnboardingConfirmed = false;
        if (Guid.TryParse(tenantId, out var tid))
        {
            isOnboardingConfirmed = await _dbContext.BusinessContexts
                .AnyAsync(b => b.TenantId == tid && b.IsConfirmed, cancellationToken);
        }

        return Ok(new
        {
            Email = email,
            FullName = fullName,
            TenantId = tenantId,
            IsOnboardingConfirmed = isOnboardingConfirmed
        });
    }

    [HttpPost("forgot-password")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("ForgotPassword")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _identityService.ForgotPasswordAsync(request, cancellationToken);
        
        // Always return OK with the same message
        return Ok(new { Message = result.Message });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _identityService.ResetPasswordAsync(request, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(new { Error = result.ErrorMessage });
        }

        // Invalidate current session if the user happens to be logged in
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        return Ok(new { Message = "Your password has been reset successfully." });
    }
}
