using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Sparovia.Application.Identity;
using Sparovia.Infrastructure.Data;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Sparovia.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IIdentityService _identityService;
    private readonly IWebHostEnvironment _environment;
    private readonly SparoviaDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public AuthController(
        IIdentityService identityService, 
        IWebHostEnvironment environment,
        SparoviaDbContext dbContext,
        IConfiguration configuration)
    {
        _identityService = identityService;
        _environment = environment;
        _dbContext = dbContext;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new
            {
                error = new { code = "VALIDATION_ERROR", message = "One or more fields are invalid.", fields = ModelState },
                requestId = HttpContext.TraceIdentifier
            });
        }

        if (!request.AcceptedTerms)
        {
            return BadRequest(new
            {
                error = new { code = "VALIDATION_ERROR", message = "You must accept the terms and conditions.", fields = new { } },
                requestId = HttpContext.TraceIdentifier
            });
        }

        if (request.Password.Length < 8)
        {
            return BadRequest(new
            {
                error = new { code = "VALIDATION_ERROR", message = "Password must be at least 8 characters long.", fields = new { } },
                requestId = HttpContext.TraceIdentifier
            });
        }

        var result = await _identityService.RegisterUserAsync(request, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(new
            {
                error = new { code = "VALIDATION_ERROR", message = result.ErrorMessage, fields = new { } },
                requestId = HttpContext.TraceIdentifier
            });
        }

        var data = new Dictionary<string, object?>
        {
            { "verificationRequired", true },
            { "phoneNumber", result.PhoneNumber },
            { "message", "Account created successfully. Please verify your phone number to continue." }
        };

        if (!string.IsNullOrEmpty(result.DevOtp))
        {
            data["devOtp"] = result.DevOtp;
        }

        return Ok(new
        {
            data,
            requestId = HttpContext.TraceIdentifier
        });
    }

    [HttpPost("phone/send-otp")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("PhoneOtpSend")]
    public async Task<IActionResult> SendPhoneOtp([FromBody] SendPhoneOtpRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request?.PhoneNumber))
        {
            return BadRequest(new 
            { 
                error = new { code = "VALIDATION_ERROR", message = "Phone number is required.", fields = new { } },
                requestId = HttpContext.TraceIdentifier 
            });
        }

        var result = await _identityService.SendPhoneOtpAsync(request, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(new 
            { 
                error = new { code = "VALIDATION_ERROR", message = result.ErrorMessage, fields = new { } },
                cooldownRemainingSeconds = result.CooldownRemainingSeconds,
                requestId = HttpContext.TraceIdentifier 
            });
        }

        var data = new Dictionary<string, object?>
        {
            { "verificationRequired", true },
            { "message", "Verification code sent successfully." },
            { "cooldownRemainingSeconds", result.CooldownRemainingSeconds }
        };

        if (!string.IsNullOrEmpty(result.DevOtp))
        {
            data["devOtp"] = result.DevOtp;
        }

        return Ok(new 
        { 
            data,
            requestId = HttpContext.TraceIdentifier 
        });
    }

    [HttpPost("phone/verify-otp")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("PhoneOtpVerify")]
    public async Task<IActionResult> VerifyPhoneOtp([FromBody] VerifyPhoneOtpRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid || string.IsNullOrWhiteSpace(request?.PhoneNumber) || string.IsNullOrWhiteSpace(request?.Otp))
        {
            return BadRequest(new 
            { 
                error = new { code = "VALIDATION_ERROR", message = "Phone number and 6-digit code are required.", fields = new { } },
                requestId = HttpContext.TraceIdentifier 
            });
        }

        var result = await _identityService.VerifyPhoneOtpAsync(request, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(new 
            { 
                error = new { code = "VALIDATION_ERROR", message = result.ErrorMessage, fields = new { } },
                requestId = HttpContext.TraceIdentifier 
            });
        }

        // Establish authenticated session for the verified user so they immediately enter onboarding
        var normalizedPhone = Sparovia.Application.Common.PhoneNumberHelper.Normalize(request.PhoneNumber);
        var user = await _dbContext.Users
            .Include(u => u.Memberships)
            .FirstOrDefaultAsync(u => (result.UserId.HasValue && u.Id == result.UserId.Value) || 
                                      (normalizedPhone != null && u.PhoneNumberNormalized == normalizedPhone), cancellationToken);

        string? token = null;
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

            token = GenerateJwtToken(user.Id, user.Email, primaryMembership.Role, primaryMembership.TenantId, user.FullName ?? "");
        }

        return Ok(new 
        { 
            data = new
            {
                message = "Phone number verified successfully.",
                requiresOnboarding = true,
                onboardingStep = "/admin/onboarding/business-basics",
                accessToken = token,
                tokenType = "Bearer"
            },
            accessToken = token,
            tokenType = "Bearer",
            requestId = HttpContext.TraceIdentifier 
        });
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

        string? token = null;
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

            token = GenerateJwtToken(user.Id, user.Email, primaryMembership.Role, primaryMembership.TenantId, user.FullName ?? "");
        }

        return Ok(new 
        { 
            Message = !string.IsNullOrWhiteSpace(result.ErrorMessage) ? result.ErrorMessage : "Email verified successfully.",
            RequiresOnboarding = true,
            OnboardingStep = "/admin/onboarding/business-basics",
            AccessToken = token,
            TokenType = "Bearer"
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
            new Claim(ClaimTypes.Email, result.Email ?? request.GetIdentifier()),
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

        var token = GenerateJwtToken(
            result.UserId!.Value, 
            result.Email ?? request.GetIdentifier(), 
            result.Role!, 
            result.TenantId!.Value, 
            result.FullName ?? "");

        return Ok(new 
        { 
            Message = "Signed in successfully.",
            AccessToken = token,
            TokenType = "Bearer",
            ExpiresIn = 7 * 24 * 3600,
            Data = new
            {
                AccessToken = token,
                TokenType = "Bearer",
                ExpiresIn = 7 * 24 * 3600
            }
        });
    }

    private string GenerateJwtToken(Guid userId, string email, string role, Guid tenantId, string fullName)
    {
        var jwtSecret = _configuration["Jwt:Secret"] 
            ?? "SparoviaDefaultProductionGradeJwtSigningKey2026_EnterpriseGradeSecretKey!";
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "Sparovia.API";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "Sparovia.Client";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim("TenantId", tenantId.ToString()),
            new Claim("FullName", fullName ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
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
        string? phoneNumber = null;

        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdStr, out var userId))
        {
            var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user != null)
            {
                fullName = user.FullName;
                email = user.Email;
                phoneNumber = user.PhoneNumber;
            }
        }

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
            PhoneNumber = phoneNumber,
            TenantId = tenantId,
            IsOnboardingConfirmed = isOnboardingConfirmed
        });
    }

    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateCurrentUser([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "User session is invalid." } });
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null)
        {
            return NotFound(new { error = new { code = "USER_NOT_FOUND", message = "User not found." } });
        }

        if (string.IsNullOrWhiteSpace(request?.FullName))
        {
            return BadRequest(new { error = new { code = "VALIDATION_ERROR", message = "Account name is required." } });
        }

        var trimmedName = request.FullName.Trim();
        if (trimmedName.Length < 2 || trimmedName.Length > 100)
        {
            return BadRequest(new { error = new { code = "VALIDATION_ERROR", message = "Account name must be between 2 and 100 characters." } });
        }

        user.FullName = trimmedName;

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            var digitsOnly = System.Text.RegularExpressions.Regex.Replace(request.PhoneNumber.Trim(), @"\D", "");
            if (digitsOnly.Length != 10 || !System.Text.RegularExpressions.Regex.IsMatch(digitsOnly, @"^[6-9]\d{9}$"))
            {
                return BadRequest(new { error = new { code = "VALIDATION_ERROR", message = "Phone number must be a valid 10-digit Indian mobile number." } });
            }
            user.PhoneNumber = digitsOnly;
            user.PhoneNumberNormalized = digitsOnly;
        }
        else
        {
            user.PhoneNumber = null;
            user.PhoneNumberNormalized = null;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Refresh authentication cookie with updated FullName claim
        var tenantId = User.FindFirst("TenantId")?.Value;
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("FullName", user.FullName)
        };
        if (!string.IsNullOrWhiteSpace(tenantId))
        {
            claims.Add(new Claim("TenantId", tenantId));
        }

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

        bool isOnboardingConfirmed = false;
        if (Guid.TryParse(tenantId, out var tid))
        {
            isOnboardingConfirmed = await _dbContext.BusinessContexts
                .AnyAsync(b => b.TenantId == tid && b.IsConfirmed, cancellationToken);
        }

        return Ok(new
        {
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
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
