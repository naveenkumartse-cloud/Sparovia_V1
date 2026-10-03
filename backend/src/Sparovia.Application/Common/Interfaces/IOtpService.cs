namespace Sparovia.Application.Common.Interfaces;

public interface IOtpService
{
    string GenerateOtp(int length = 6);
    string HashOtp(string otp);
    bool VerifyOtp(string inputOtp, string storedHash);
}
