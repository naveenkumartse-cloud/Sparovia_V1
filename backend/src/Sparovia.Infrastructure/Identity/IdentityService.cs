using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Sparovia.Application.Common.Interfaces;
using Sparovia.Application.Identity;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;

using Microsoft.Extensions.Logging;

namespace Sparovia.Infrastructure.Identity;

public class IdentityService : IIdentityService
{
    private readonly SparoviaDbContext _dbContext;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<IdentityService> _logger;

    public IdentityService(
        SparoviaDbContext dbContext, 
        IEmailService emailService, 
        IConfiguration configuration,
        ILogger<IdentityService> logger)
    {
        _dbContext = dbContext;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    private string GetAdminBaseUrl()
    {
        var adminUrl = _configuration["FRONTEND_BASE_URL"]
            ?? _configuration["Frontend:BaseUrl"]
            ?? _configuration["AdminUrl"]
            ?? "http://localhost:3001";
        return adminUrl.TrimEnd('/');
    }

    private static string GenerateToken()
    {
        var randomBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }
        return Convert.ToBase64String(randomBytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }

    private static string HashToken(string token)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hashedBytes);
    }

    public async Task<RegistrationResult> RegisterUserAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Password != request.ConfirmPassword)
            return new RegistrationResult { Success = false, ErrorMessage = "Passwords do not match." };

        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var exists = await _dbContext.Users.AnyAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);
        if (exists)
            return new RegistrationResult { Success = false, ErrorMessage = "An account with this email already exists." };

        var passwordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(request.Password);
        
        var rawToken = GenerateToken();
        var tokenHash = HashToken(rawToken);
        var tokenExpiry = DateTime.UtcNow.AddHours(24);

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email.Trim(),
                NormalizedEmail = normalizedEmail,
                PasswordHash = passwordHash,
                EmailVerified = false,
                VerificationTokenHash = tokenHash,
                VerificationTokenExpiresAt = tokenExpiry
            };
            _dbContext.Users.Add(user);

            var tenant = new Tenant
            {
                Name = $"{request.FullName}'s Workspace"
            };
            _dbContext.Tenants.Add(tenant);

            var membership = new Membership
            {
                UserId = user.Id,
                User = user,
                TenantId = tenant.Id,
                Tenant = tenant,
                Role = "Owner"
            };
            _dbContext.Memberships.Add(membership);

            await _dbContext.SaveChangesAsync(cancellationToken);

            var adminBaseUrl = GetAdminBaseUrl();
            var link = $"{adminBaseUrl}/verify-email?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(rawToken)}";
            await _emailService.SendVerificationEmailAsync(user.Email, link, cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return new RegistrationResult 
            { 
                Success = true,
                VerificationLink = link
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed during account creation or email dispatch for email {Email}", request.Email);
            try
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            catch
            {
                // Transaction may already be closed
            }
            return new RegistrationResult { Success = false, ErrorMessage = "An unexpected error occurred during registration. Please try again." };
        }
    }

    public async Task<VerificationResult> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

        if (user == null)
            return new VerificationResult { Success = false, ErrorMessage = "This verification link is invalid or has expired." };

        if (user.EmailVerified)
            return new VerificationResult { Success = true, ErrorMessage = "Your email is already verified." };

        if (user.VerificationTokenExpiresAt < DateTime.UtcNow)
            return new VerificationResult { Success = false, ErrorMessage = "This verification link is invalid or has expired." };

        var incomingHash = HashToken(request.Token);
        if (user.VerificationTokenHash != incomingHash)
            return new VerificationResult { Success = false, ErrorMessage = "This verification link is invalid or has expired." };

        user.EmailVerified = true;
        user.VerificationTokenHash = null;
        user.VerificationTokenExpiresAt = null;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return new VerificationResult { Success = true };
    }

    public async Task<VerificationResult> ResendVerificationEmailAsync(ResendVerificationRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

        if (user == null)
        {
            // Do not leak existence. Pretend it worked.
            return new VerificationResult { Success = true };
        }

        if (user.EmailVerified)
        {
            // Same as above. Return success without sending.
            return new VerificationResult { Success = true };
        }

        var rawToken = GenerateToken();
        user.VerificationTokenHash = HashToken(rawToken);
        user.VerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24);

        await _dbContext.SaveChangesAsync(cancellationToken);

        var adminBaseUrl = GetAdminBaseUrl();
        var link = $"{adminBaseUrl}/verify-email?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(rawToken)}";
        try
        {
            await _emailService.SendVerificationEmailAsync(user.Email, link, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to dispatch verification email during resend request for email {Email}", user.Email);
        }

        return new VerificationResult 
        { 
            Success = true,
            VerificationLink = link
        };
    }

    public async Task<SignInResult> SignInAsync(SignInRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        
        // Find user and include their memberships to resolve tenant access
        var user = await _dbContext.Users
            .Include(u => u.Memberships)
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

        if (user == null)
        {
            // Do not reveal if the account exists or not
            return new SignInResult { Success = false, ErrorMessage = "Email or password is incorrect." };
        }

        // Verify password securely
        var passwordValid = BCrypt.Net.BCrypt.EnhancedVerify(request.Password, user.PasswordHash);
        if (!passwordValid)
        {
            return new SignInResult { Success = false, ErrorMessage = "Email or password is incorrect." };
        }

        // Enforce verified account policy
        if (!user.EmailVerified)
        {
            return new SignInResult { Success = false, ErrorMessage = "Please verify your email before continuing." };
        }

        // Determine authorized tenant server-side
        // For V1 Pilot, we just take their first membership (usually the Owner one created during registration)
        var primaryMembership = user.Memberships.FirstOrDefault();
        if (primaryMembership == null)
        {
            return new SignInResult { Success = false, ErrorMessage = "Your account does not have an active workspace." };
        }

        return new SignInResult 
        { 
            Success = true,
            UserId = user.Id,
            TenantId = primaryMembership.TenantId,
            Role = primaryMembership.Role,
            FullName = user.FullName
        };
    }

    private string ComputeSha256Hash(string rawData)
    {
        using (var sha256Hash = System.Security.Cryptography.SHA256.Create())
        {
            byte[] bytes = sha256Hash.ComputeHash(System.Text.Encoding.UTF8.GetBytes(rawData));
            var builder = new System.Text.StringBuilder();
            for (int i = 0; i < bytes.Length; i++)
            {
                builder.Append(bytes[i].ToString("x2"));
            }
            return builder.ToString();
        }
    }

    public async Task<ForgotPasswordResult> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

        // Fail safe: Always return a safe success response to prevent account enumeration
        if (user == null)
        {
            return new ForgotPasswordResult(); 
        }

        // Generate cryptographically secure token
        var rawTokenBytes = new byte[32];
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(rawTokenBytes);
        }
        var rawToken = Convert.ToBase64String(rawTokenBytes);

        // Store secure hash
        var tokenHash = ComputeSha256Hash(rawToken);

        user.ResetTokenHash = tokenHash;
        user.ResetTokenExpiresAt = DateTime.UtcNow.AddHours(1); // 1 hour expiry

        await _dbContext.SaveChangesAsync(cancellationToken);

        // Send email
        var adminBaseUrl = GetAdminBaseUrl();
        var link = $"{adminBaseUrl}/reset-password?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(rawToken)}";
        try
        {
            await _emailService.SendPasswordResetEmailAsync(user.Email, link, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to dispatch password reset email for email {Email}", user.Email);
        }

        return new ForgotPasswordResult();
    }

    public async Task<ResetPasswordResult> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

        // Validate generic conditions without leaking why it failed
        if (user == null || 
            user.ResetTokenExpiresAt == null || 
            string.IsNullOrEmpty(user.ResetTokenHash) || 
            user.ResetTokenExpiresAt < DateTime.UtcNow)
        {
            return new ResetPasswordResult { Success = false, ErrorMessage = "This password reset link is invalid or has expired. Please request a new reset link." };
        }

        var submittedTokenHash = ComputeSha256Hash(request.Token);
        
        // Use timing-safe comparison to prevent timing attacks
        if (!System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(
                System.Text.Encoding.UTF8.GetBytes(user.ResetTokenHash),
                System.Text.Encoding.UTF8.GetBytes(submittedTokenHash)))
        {
            return new ResetPasswordResult { Success = false, ErrorMessage = "This password reset link is invalid or has expired. Please request a new reset link." };
        }

        // Token is valid. Reset password securely.
        user.PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(request.NewPassword);

        // Consume token to prevent reuse
        user.ResetTokenHash = null;
        user.ResetTokenExpiresAt = null;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new ResetPasswordResult { Success = true };
    }
}
