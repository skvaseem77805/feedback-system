import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(
  email: string,
  otp: string,
  studentName: string
): Promise<any> {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verification OTP Code - Project Hub",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 460px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); text-align: left; margin: 0 auto;">
          <tr>
            <td style="padding: 40px 32px;">
              
              <!-- Header / Branding -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 10px;">
                          <div style="width: 32px; height: 32px; background-color: #2563eb; border-radius: 8px; text-align: center; line-height: 32px; color: #ffffff; font-weight: 700; font-size: 16px;">
                            P
                          </div>
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 14px; font-weight: 700; color: #0f172a; letter-spacing: 0.5px; text-transform: uppercase;">PROJECT HUB</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Title -->
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #0f172a; letter-spacing: -0.3px;">Verify Your Email</h1>

              <!-- Greeting -->
              <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 24px; color: #334155;">Hello <strong>${studentName}</strong>,</p>

              <!-- Short description -->
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 24px; color: #475569;">Use the verification code below to continue with your Project Hub account.</p>

              <!-- OTP Section -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px 16px;">
                    <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Monaco, Courier, monospace; font-size: 34px; font-weight: 700; color: #2563eb; letter-spacing: 10px; display: inline-block; padding-left: 10px;">${otp}</span>
                  </td>
                </tr>
              </table>

              <!-- Below OTP -->
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b; text-align: center;">This verification code is valid for <strong>5 minutes</strong>.</p>

              <!-- Security Notice -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px; background-color: #f1f5f9; border-radius: 8px;">
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #475569; line-height: 18px;">
                    🔒 Never share this verification code with anyone.
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="border-top: 1px solid #f1f5f9; margin-bottom: 24px;"></div>

              <!-- Footer -->
              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 20px; color: #94a3b8;">If you didn't request this email, you can safely ignore it.</p>
              
              <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #475569;">Project Hub Team</p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; 2026 Project Hub</p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    console.log("OTP Email Sent Successfully:", info.messageId);

    return info;
  } catch (error) {
    console.error("SMTP Error:", error);
    throw error;
  }
}
