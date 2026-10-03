using System.Text.RegularExpressions;

namespace Sparovia.Application.Common;

public static class PhoneNumberHelper
{
    // E.164 format: + followed by 1-9 and 7-14 more digits (total 8-15 digits)
    private static readonly Regex E164Regex = new(@"^\+[1-9]\d{7,14}$", RegexOptions.Compiled);

    /// <summary>
    /// Normalizes a user-entered phone number into standard E.164 format (+[country_code][number]).
    /// Supports inputs like "+91 98765 43210", "09876543210", "9876543210", "+1 (415) 555-2671".
    /// </summary>
    public static string? Normalize(string? rawPhoneNumber, string defaultCountryCode = "+91")
    {
        if (string.IsNullOrWhiteSpace(rawPhoneNumber))
            return null;

        var trimmed = rawPhoneNumber.Trim();

        // Check if starts with +
        var hasPlus = trimmed.StartsWith('+');

        // Remove all non-digit characters except leading plus
        var digitsOnly = Regex.Replace(trimmed, @"[^\d]", "");

        if (string.IsNullOrEmpty(digitsOnly))
            return null;

        string normalized;

        if (hasPlus)
        {
            normalized = "+" + digitsOnly;
        }
        else if (trimmed.StartsWith("00"))
        {
            // International dialing prefix 00 (e.g., 00919876543210)
            normalized = "+" + digitsOnly.Substring(2);
        }
        else if (trimmed.StartsWith('0') && digitsOnly.Length == 11)
        {
            // Domestic 0-prefix for 10-digit number (e.g., 09876543210)
            var tenDigits = digitsOnly.Substring(1);
            normalized = defaultCountryCode + tenDigits;
        }
        else if (digitsOnly.Length == 10)
        {
            // Default 10-digit mobile number
            normalized = defaultCountryCode + digitsOnly;
        }
        else
        {
            normalized = "+" + digitsOnly;
        }

        return IsValidE164(normalized) ? normalized : null;
    }

    public static bool IsValidE164(string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return false;

        return E164Regex.IsMatch(phoneNumber);
    }

    /// <summary>
    /// Masks a phone number for secure logging and display (e.g., ******3210).
    /// </summary>
    public static string Mask(string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return "******";

        var clean = phoneNumber.Trim();
        if (clean.Length <= 4)
            return "******";

        var last4 = clean.Substring(clean.Length - 4);
        return $"******{last4}";
    }
}
