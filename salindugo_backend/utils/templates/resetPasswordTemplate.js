const passwordResetTemplate = (resetLink) => `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f4f4f5;font-family:Georgia, 'Times New Roman', serif;padding:32px 0;">

  <!-- Top Accent -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#c0392b;height:5px;border-radius:4px 4px 0 0;"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Main Container -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">

        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding:28px 40px 20px;">
              <span style="font-size:24px;">🩸</span>
              <span style="font-size:22px;font-weight:bold;color:#c0392b;margin-left:8px;">
                SalinDugo
              </span>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #f0f0f0;">
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:36px 40px 24px;text-align:center;">
              <div style="font-size:40px;margin-bottom:16px;">🔐</div>

              <h2 style="margin:0 0 14px;font-size:26px;color:#1a1a1a;">
                Password Reset Request
              </h2>

              <p style="margin:0;color:#555;font-size:15px;line-height:1.7;">
                We received a request to reset your SalinDugo password.
                Click the button below to choose a new password.
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding:8px 40px 28px;">
              <a href="${resetLink}" 
                 style="background:#c0392b;color:#ffffff;padding:14px 36px;
                        border-radius:6px;text-decoration:none;font-weight:bold;
                        display:inline-block;">
                Reset My Password
              </a>
            </td>
          </tr>

          <!-- Fallback -->
          <tr>
            <td style="padding:0 40px 28px;text-align:center;">
              <p style="font-size:12px;color:#999;margin:0 0 6px;">
                Button not working? Copy and paste this link:
              </p>
              <p style="font-size:11px;color:#c0392b;word-break:break-all;margin:0;">
                ${resetLink}
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #f0f0f0;">
            </td>
          </tr>

          <!-- Warning Box -->
          <tr>
            <td style="padding:14px 40px;">
              <table width="100%" style="background:#fdf2f2;border-left:3px solid #c0392b;border-radius:6px;">
                <tr>
                  <td style="padding:14px;">
                    <span style="font-size:14px;">⚠️</span>
                    <span style="font-size:13px;color:#7f3030;margin-left:8px;">
                      This link expires in <strong>1 hour</strong>. If you didn’t request this, ignore this email.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              <p style="font-size:12px;color:#aaa;margin:0;">
                © ${new Date().getFullYear()} SalinDugo
              </p>
              <p style="font-size:11px;color:#ccc;margin:4px 0 0;">
                This is an automated message. Do not reply.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

  <!-- Bottom Accent -->
  <table width="100%">
    <tr>
      <td align="center">
        <table width="560">
          <tr>
            <td style="background:#96281b;height:3px;opacity:0.4;border-radius:0 0 4px 4px;"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;

export default passwordResetTemplate;
