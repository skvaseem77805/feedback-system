/**
 * Brevo email helper service.
 * Sends OTP verification emails using Brevo REST API.
 */
export async function sendOtpEmail(email: string, otp: string, studentName: string): Promise<any> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not defined in environment variables.');
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'crrprojecthub@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'Project Hub';

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email, name: studentName }],
      subject: 'Verification OTP Code - Project Hub',
      htmlContent: `
        <div style="font-family: sans-serif; padding: 25px; color: #1f2937; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-bottom: 10px; font-size: 20px;">Project Hub Account Verification</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #4b5563;">Hello <strong>${studentName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #4b5563;">You are registering or resetting your password on Project Hub. Please use the following secure 6-digit verification code (OTP) to proceed:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 26px; font-weight: bold; letter-spacing: 4px; border-radius: 8px; margin: 20px 0; color: #111827; border: 1px solid #e5e7eb;">
            ${otp}
          </div>
          <p style="font-size: 13px; line-height: 1.5; color: #6b7280;">This code is valid for <strong>5 minutes</strong>. If you did not request this verification code, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 11px; color: #9ca3af; text-align: center;">This is an automated message from Project Hub. Please do not reply directly to this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API returned error: ${errorText}`);
  }

  return await response.json();
}
