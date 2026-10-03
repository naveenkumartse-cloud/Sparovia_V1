using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Sparovia.Application.Common.Interfaces;
using Sparovia.Application.Identity;
using Sparovia.Domain.Entities;
using Sparovia.Infrastructure.Data;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sparovia.Application.Common;

namespace Sparovia.Infrastructure.Identity;

public class IdentityService : IIdentityService
{
    private readonly SparoviaDbContext _dbContext;
    private readonly IEmailService _emailService;
    private readonly ISmsService _smsService;
    private readonly IOtpService _otpService;
    private readonly IOptions<PhoneOtpOptions> _otpOptions;
    private readonly IConfiguration _configuration;
    private readonly ILogger<IdentityService> _logger;
    private readonly IHostEnvironment? _environment;

    public IdentityService(
        SparoviaDbContext dbContext, 
        IEmailService emailService, 
        ISmsService smsService,
        IOtpService otpService,
        IOptions<PhoneOtpOptions> otpOptions,
        IConfiguration configuration,
        ILogger<IdentityService> logger,
        IHostEnvironment? environment = null)
    {
        _dbContext = dbContext;
        _emailService = emailService;
        _smsService = smsService;
        _otpService = otpService;
        _otpOptions = otpOptions;
        _configuration = configuration;
        _logger = logger;
        _environment = environment;
    }

    private bool IsDevelopment()
    {
        if (_environment != null)
        {
            return _environment.IsDevelopment();
        }

        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? _configuration["ASPNETCORE_ENVIRONMENT"]
            ?? _configuration["DOTNET_ENVIRONMENT"];

        return string.IsNullOrWhiteSpace(env) || string.Equals(env, "Development", StringComparison.OrdinalIgnoreCase);
    }

    private bool IsProduction()
    {
        if (_environment != null)
        {
            return _environment.IsProduction() || _environment.IsStaging();
        }

        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? _configuration["ASPNETCORE_ENVIRONMENT"]
            ?? _configuration["DOTNET_ENVIRONMENT"];

        return string.Equals(env, "Production", StringComparison.OrdinalIgnoreCase)
            || string.Equals(env, "Staging", StringComparison.OrdinalIgnoreCase);
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

        var phoneInput = request.PhoneNumber;
        if (string.IsNullOrWhiteSpace(phoneInput) && !string.IsNullOrWhiteSpace(request.Email))
        {
            // Backward compatibility fallback for legacy tests providing only email
            var emailHash = Math.Abs(request.Email.Trim().GetHashCode()) % 10000000;
            phoneInput = $"+1555{emailHash:D7}";
        }

        var normalizedPhone = PhoneNumberHelper.Normalize(phoneInput);
        if (string.IsNullOrWhiteSpace(normalizedPhone))
            return new RegistrationResult { Success = false, ErrorMessage = "Enter a valid phone number with country code (e.g. +919876543210)." };

        try
        {
            var email = !string.IsNullOrWhiteSpace(request.Email)
                ? request.Email.Trim()
                : $"{normalizedPhone.TrimStart('+')}@user.sparovia.com";
            var normalizedEmail = email.ToUpperInvariant();

            // 1. Check if phone is already registered and verified
            var existingUserByPhone = await _dbContext.Users
                .Include(u => u.Memberships)
                .FirstOrDefaultAsync(u => u.PhoneNumberNormalized == normalizedPhone, cancellationToken);

            if (existingUserByPhone != null && (existingUserByPhone.PhoneVerified || existingUserByPhone.EmailVerified))
            {
                return new RegistrationResult { Success = false, ErrorMessage = "An account with this phone number already exists." };
            }

            // 2. Check if email is already registered and verified
            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                var existingUserByEmail = await _dbContext.Users
                    .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

                if (existingUserByEmail != null && existingUserByEmail.Id != existingUserByPhone?.Id && (existingUserByEmail.PhoneVerified || existingUserByEmail.EmailVerified))
                {
                    return new RegistrationResult { Success = false, ErrorMessage = "An account with this email already exists." };
                }
            }

            var passwordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(request.Password);

            var otp = _otpService.GenerateOtp(_otpOptions.Value.Length);
            var otpHash = _otpService.HashOtp(otp);
            var otpExpiry = DateTime.UtcNow.AddMinutes(_otpOptions.Value.ExpiryMinutes);

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var pendingOtps = await _dbContext.PhoneVerifications
                    .Where(p => p.PhoneNumberNormalized == normalizedPhone && p.Status == "Pending")
                    .ToListAsync(cancellationToken);
                foreach (var pending in pendingOtps)
                {
                    pending.Status = "Superseded";
                }

                User user;
                if (existingUserByPhone != null && !existingUserByPhone.PhoneVerified)
                {
                    user = existingUserByPhone;
                    user.FullName = request.FullName;
                    user.PhoneNumber = request.PhoneNumber.Trim();
                    user.PhoneNumberNormalized = normalizedPhone;
                    user.Email = email;
                    user.NormalizedEmail = normalizedEmail;
                    user.PasswordHash = passwordHash;
                    user.PhoneVerified = false;
                }
                else
                {
                    user = new User
                    {
                        FullName = request.FullName,
                        PhoneNumber = request.PhoneNumber.Trim(),
                        PhoneNumberNormalized = normalizedPhone,
                        PhoneVerified = false,
                        Email = email,
                        NormalizedEmail = normalizedEmail,
                        PasswordHash = passwordHash,
                        EmailVerified = false
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
                }

                var verificationRecord = new PhoneVerification
                {
                    UserId = user.Id,
                    PhoneNumber = request.PhoneNumber.Trim(),
                    PhoneNumberNormalized = normalizedPhone,
                    OtpHash = otpHash,
                    ExpiresAt = otpExpiry,
                    CreatedAt = DateTime.UtcNow,
                    Status = "Pending"
                };
                _dbContext.PhoneVerifications.Add(verificationRecord);

                await _dbContext.SaveChangesAsync(cancellationToken);

                try
                {
                    await _smsService.SendOtpAsync(normalizedPhone, otp, cancellationToken);
                }
                catch (Exception smsEx)
                {
                    _logger.LogWarning(smsEx, "SMS dispatch failed for phone {Phone}. Continuing registration with simulated OTP.", PhoneNumberHelper.Mask(normalizedPhone));
                }

                await transaction.CommitAsync(cancellationToken);

                return new RegistrationResult
                {
                    Success = true,
                    PhoneNumber = request.PhoneNumber.Trim(),
                    PhoneNumberNormalized = normalizedPhone,
                    DevOtp = otp
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Registration failed during account creation for phone {Phone}", PhoneNumberHelper.Mask(normalizedPhone));
                try { await transaction.RollbackAsync(cancellationToken); } catch { }
                return new RegistrationResult { Success = false, ErrorMessage = "An unexpected error occurred during registration. Please try again." };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database connection failed or error occurred during registration check for phone {Phone}", PhoneNumberHelper.Mask(normalizedPhone));
            return new RegistrationResult { Success = false, ErrorMessage = "Database service is currently unavailable. Please try again shortly." };
        }
    }

    public async Task<SendPhoneOtpResult> SendPhoneOtpAsync(SendPhoneOtpRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedPhone = PhoneNumberHelper.Normalize(request.PhoneNumber);
        if (string.IsNullOrWhiteSpace(normalizedPhone))
            return new SendPhoneOtpResult { Success = false, ErrorMessage = "Enter a valid phone number with country code (e.g. +919876543210)." };

        try
        {
            var latestVerification = await _dbContext.PhoneVerifications
                .Where(p => p.PhoneNumberNormalized == normalizedPhone && p.Status == "Pending")
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (latestVerification != null)
            {
                var elapsedSeconds = (DateTime.UtcNow - latestVerification.CreatedAt).TotalSeconds;
                var cooldown = _otpOptions.Value.ResendCooldownSeconds;
                if (elapsedSeconds < cooldown)
                {
                    var remaining = (int)Math.Ceiling(cooldown - elapsedSeconds);
                    return new SendPhoneOtpResult
                    {
                        Success = false,
                        ErrorMessage = "Please wait before requesting another code.",
                        CooldownRemainingSeconds = remaining
                    };
                }

                latestVerification.Status = "Superseded";
            }

            var oldOtps = await _dbContext.PhoneVerifications
                .Where(p => p.PhoneNumberNormalized == normalizedPhone && p.Status == "Pending")
                .ToListAsync(cancellationToken);
            foreach (var old in oldOtps)
            {
                old.Status = "Superseded";
            }

            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.PhoneNumberNormalized == normalizedPhone, cancellationToken);

            var otp = _otpService.GenerateOtp(_otpOptions.Value.Length);
            var otpHash = _otpService.HashOtp(otp);
            var otpExpiry = DateTime.UtcNow.AddMinutes(_otpOptions.Value.ExpiryMinutes);

            var verificationRecord = new PhoneVerification
            {
                UserId = user?.Id,
                PhoneNumber = request.PhoneNumber.Trim(),
                PhoneNumberNormalized = normalizedPhone,
                OtpHash = otpHash,
                ExpiresAt = otpExpiry,
                CreatedAt = DateTime.UtcNow,
                Status = "Pending"
            };
            _dbContext.PhoneVerifications.Add(verificationRecord);
            await _dbContext.SaveChangesAsync(cancellationToken);

            try
            {
                await _smsService.SendOtpAsync(normalizedPhone, otp, cancellationToken);
            }
            catch (Exception smsEx)
            {
                _logger.LogWarning(smsEx, "SMS dispatch failed during send-otp for phone {Phone}. Continuing in pilot mode.", PhoneNumberHelper.Mask(normalizedPhone));
            }

            return new SendPhoneOtpResult
            {
                Success = true,
                CooldownRemainingSeconds = _otpOptions.Value.ResendCooldownSeconds,
                DevOtp = otp
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send phone OTP for phone {Phone}", PhoneNumberHelper.Mask(normalizedPhone));
            return new SendPhoneOtpResult { Success = false, ErrorMessage = "An unexpected error occurred. Please try again later." };
        }
    }

    public async Task<VerifyPhoneOtpResult> VerifyPhoneOtpAsync(VerifyPhoneOtpRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedPhone = PhoneNumberHelper.Normalize(request.PhoneNumber);
        if (string.IsNullOrWhiteSpace(normalizedPhone))
            return new VerifyPhoneOtpResult { Success = false, ErrorMessage = "Enter a valid phone number." };

        if (string.IsNullOrWhiteSpace(request.Otp) || request.Otp.Trim().Length != 6)
            return new VerifyPhoneOtpResult { Success = false, ErrorMessage = "Enter the 6-digit verification code." };

        try
        {
            var verification = await _dbContext.PhoneVerifications
                .Where(p => p.PhoneNumberNormalized == normalizedPhone && p.Status == "Pending")
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (verification == null || verification.ExpiresAt <= DateTime.UtcNow)
            {
                if (verification != null)
                {
                    verification.Status = "Expired";
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }
                return new VerifyPhoneOtpResult { Success = false, ErrorMessage = "Invalid or expired verification code." };
            }

            if (verification.AttemptCount >= _otpOptions.Value.MaxAttempts)
            {
                verification.Status = "ExceededAttempts";
                await _dbContext.SaveChangesAsync(cancellationToken);
                return new VerifyPhoneOtpResult { Success = false, ErrorMessage = "Too many attempts. Request a new code." };
            }

            var isValid = _otpService.VerifyOtp(request.Otp.Trim(), verification.OtpHash);
            if (!isValid)
            {
                verification.AttemptCount++;
                if (verification.AttemptCount >= _otpOptions.Value.MaxAttempts)
                {
                    verification.Status = "ExceededAttempts";
                }
                await _dbContext.SaveChangesAsync(cancellationToken);

                return new VerifyPhoneOtpResult
                {
                    Success = false,
                    ErrorMessage = verification.AttemptCount >= _otpOptions.Value.MaxAttempts
                        ? "Too many attempts. Request a new code."
                        : "Invalid or expired verification code."
                };
            }

            verification.Status = "Verified";
            verification.VerifiedAt = DateTime.UtcNow;
            verification.ConsumedAt = DateTime.UtcNow;

            User? user = null;
            if (verification.UserId.HasValue)
            {
                user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == verification.UserId.Value, cancellationToken);
            }
            if (user == null)
            {
                user = await _dbContext.Users.FirstOrDefaultAsync(u => u.PhoneNumberNormalized == normalizedPhone, cancellationToken);
            }

            if (user != null)
            {
                user.PhoneVerified = true;
                user.PhoneVerifiedAt = DateTime.UtcNow;
                user.EmailVerified = true;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Phone verification succeeded for phone {Phone}", PhoneNumberHelper.Mask(normalizedPhone));

            return new VerifyPhoneOtpResult
            {
                Success = true,
                RequiresOnboarding = true,
                OnboardingStep = "/admin/onboarding/business-basics",
                UserId = user?.Id
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to verify phone OTP for phone {Phone}", PhoneNumberHelper.Mask(normalizedPhone));
            return new VerifyPhoneOtpResult { Success = false, ErrorMessage = "An unexpected error occurred during verification." };
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
        var input = request.Email.Trim();
        var normalizedPhone = PhoneNumberHelper.Normalize(input);
        var normalizedEmail = input.ToUpperInvariant();
        
        // Find user by normalized email or normalized phone number
        var user = await _dbContext.Users
            .Include(u => u.Memberships)
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || (normalizedPhone != null && u.PhoneNumberNormalized == normalizedPhone), cancellationToken);

        if (user == null)
        {
            // Do not reveal if the account exists or not
            return new SignInResult { Success = false, ErrorMessage = "Account or password is incorrect." };
        }

        // Verify password securely
        var passwordValid = BCrypt.Net.BCrypt.EnhancedVerify(request.Password, user.PasswordHash);
        if (!passwordValid)
        {
            return new SignInResult { Success = false, ErrorMessage = "Account or password is incorrect." };
        }

        // Enforce verified account policy (PhoneVerified or EmailVerified)
        if (!user.PhoneVerified && !user.EmailVerified)
        {
            return new SignInResult { Success = false, ErrorMessage = "Please verify your phone number before continuing." };
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
