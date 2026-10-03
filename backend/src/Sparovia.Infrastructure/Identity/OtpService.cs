using System.Security.Cryptography;
using System.Text;
using Sparovia.Application.Common.Interfaces;

namespace Sparovia.Infrastructure.Identity;

public class OtpService : IOtpService
{
    private const string Salt = "SPAROVIA_V1_PHONE_OTP_PEPPER_SECURE";

    public string GenerateOtp(int length = 6)
    {
        if (length != 6)
        {
            // Default 6 digits
            length = 6;
        }

        // Cryptographically secure random 6-digit number [100000, 999999]
        var code = RandomNumberGenerator.GetInt32(100000, 1000000);
        return code.ToString("D6");
    }

    public string HashOtp(string otp)
    {
        var saltedInput = $"{Salt}:{otp.Trim()}";
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(saltedInput));
        return Convert.ToBase64String(bytes);
    }

    public bool VerifyOtp(string inputOtp, string storedHash)
    {
        if (string.IsNullOrWhiteSpace(inputOtp) || string.IsNullOrWhiteSpace(storedHash))
            return false;

        var computedHash = HashOtp(inputOtp.Trim());
        var computedBytes = Encoding.UTF8.GetBytes(computedHash);
        var storedBytes = Encoding.UTF8.GetBytes(storedHash.Trim());

        return CryptographicOperations.FixedTimeEquals(computedBytes, storedBytes);
    }
}
