namespace Sparovia.Application.Identity;

public interface IIdentityService
{
    Task<RegistrationResult> RegisterUserAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<SendPhoneOtpResult> SendPhoneOtpAsync(SendPhoneOtpRequest request, CancellationToken cancellationToken = default);
    Task<VerifyPhoneOtpResult> VerifyPhoneOtpAsync(VerifyPhoneOtpRequest request, CancellationToken cancellationToken = default);
    Task<VerificationResult> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken cancellationToken = default);
    Task<VerificationResult> ResendVerificationEmailAsync(ResendVerificationRequest request, CancellationToken cancellationToken = default);
    Task<SignInResult> SignInAsync(SignInRequest request, CancellationToken cancellationToken = default);
    Task<ForgotPasswordResult> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);
    Task<ResetPasswordResult> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
}
