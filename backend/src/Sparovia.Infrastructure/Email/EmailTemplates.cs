using System.Net;

namespace Sparovia.Infrastructure.Email;

public static class EmailTemplates
{
    public static (string HtmlBody, string PlainTextBody) GetVerificationEmail(string verificationLink)
    {
        var safeLink = WebUtility.HtmlEncode(verificationLink);

        var html = $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <title>Verify your Sparovia account</title>
</head>
<body style=""margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #0f172a;"">
  <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""background-color: #f8fafc; padding: 40px 16px;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);"">
          <!-- Header -->
          <tr>
            <td style=""padding: 32px 40px 24px; text-align: left; border-bottom: 1px solid #f1f5f9;"">
              <span style=""font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #2563eb;"">SPAROVIA</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style=""padding: 36px 40px;"">
              <h1 style=""margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3;"">Verify your email address</h1>
              <p style=""margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #334155;"">
                Thank you for creating an account with Sparovia. Please confirm your email address to activate your account and start managing your business presence.
              </p>
              
              <!-- CTA Button -->
              <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""margin: 32px 0;"">
                <tr>
                  <td align=""center"" style=""border-radius: 8px; background-color: #2563eb;"">
                    <a href=""{safeLink}"" target=""_blank"" style=""display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #2563eb;"">Verify Email Address</a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link -->
              <p style=""margin: 0 0 12px; font-size: 13px; color: #64748B;"">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style=""margin: 0 0 28px; font-size: 13px; word-break: break-all; color: #2563eb;"">
                <a href=""{safeLink}"" target=""_blank"" style=""color: #2563eb; text-decoration: underline;"">{safeLink}</a>
              </p>

              <!-- Expiration & Security Guidance -->
              <div style=""background-color: #f8fafc; border-radius: 8px; padding: 16px 20px; border: 1px solid #e2e8f0;"">
                <p style=""margin: 0 0 6px; font-size: 13px; color: #475569; font-weight: 600;"">
                  Security Notice
                </p>
                <p style=""margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;"">
                  This verification link will expire in <strong>24 hours</strong>. If you did not create a Sparovia account, please disregard this email.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style=""padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;"">
              <p style=""margin: 0 0 6px; font-size: 12px; color: #94a3b8;"">
                Sparovia Business Presence & AI Platform
              </p>
              <p style=""margin: 0; font-size: 11px; color: #cbd5e1;"">
                &copy; {DateTime.UtcNow.Year} Sparovia. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

        var plainText = $@"SPAROVIA - Verify your email address

Thank you for creating an account with Sparovia. Please confirm your email address to activate your account and start managing your business presence:

{verificationLink}

This verification link will expire in 24 hours.

If you did not create a Sparovia account, please disregard this email.

(c) {DateTime.UtcNow.Year} Sparovia. All rights reserved.";

        return (html, plainText);
    }

    public static (string HtmlBody, string PlainTextBody) GetPasswordResetEmail(string resetLink)
    {
        var safeLink = WebUtility.HtmlEncode(resetLink);

        var html = $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <title>Reset your Sparovia password</title>
</head>
<body style=""margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #0f172a;"">
  <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""background-color: #f8fafc; padding: 40px 16px;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);"">
          <!-- Header -->
          <tr>
            <td style=""padding: 32px 40px 24px; text-align: left; border-bottom: 1px solid #f1f5f9;"">
              <span style=""font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #2563eb;"">SPAROVIA</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style=""padding: 36px 40px;"">
              <h1 style=""margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3;"">Reset your password</h1>
              <p style=""margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #334155;"">
                We received a request to reset the password for your Sparovia account. Click the button below to choose a new password.
              </p>
              
              <!-- CTA Button -->
              <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""margin: 32px 0;"">
                <tr>
                  <td align=""center"" style=""border-radius: 8px; background-color: #2563eb;"">
                    <a href=""{safeLink}"" target=""_blank"" style=""display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #2563eb;"">Reset Password</a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link -->
              <p style=""margin: 0 0 12px; font-size: 13px; color: #64748B;"">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style=""margin: 0 0 28px; font-size: 13px; word-break: break-all; color: #2563eb;"">
                <a href=""{safeLink}"" target=""_blank"" style=""color: #2563eb; text-decoration: underline;"">{safeLink}</a>
              </p>

              <!-- Expiration & Security Guidance -->
              <div style=""background-color: #f8fafc; border-radius: 8px; padding: 16px 20px; border: 1px solid #e2e8f0;"">
                <p style=""margin: 0 0 6px; font-size: 13px; color: #475569; font-weight: 600;"">
                  Security Notice
                </p>
                <p style=""margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;"">
                  This reset link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style=""padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;"">
              <p style=""margin: 0 0 6px; font-size: 12px; color: #94a3b8;"">
                Sparovia Business Presence & AI Platform
              </p>
              <p style=""margin: 0; font-size: 11px; color: #cbd5e1;"">
                &copy; {DateTime.UtcNow.Year} Sparovia. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

        var plainText = $@"SPAROVIA - Reset your password

We received a request to reset the password for your Sparovia account. Click or visit the link below to choose a new password:

{resetLink}

This reset link will expire in 1 hour.

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

(c) {DateTime.UtcNow.Year} Sparovia. All rights reserved.";

        return (html, plainText);
    }
}
