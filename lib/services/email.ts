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
      <div style="font-family:Arial,sans-serif;padding:24px;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:10px">
          <h2 style="color:#4f46e5">Project Hub Account Verification</h2>

          <p>Hello <strong>${studentName}</strong>,</p>

          <p>Your One-Time Password (OTP) is:</p>

          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#f3f4f6;padding:18px;border-radius:8px;text-align:center;margin:20px 0">
            ${otp}
          </div>

          <p>This OTP is valid for <strong>5 minutes</strong>.</p>

          <p>If you didn't request this OTP, simply ignore this email.</p>

          <hr>

          <p style="font-size:12px;color:#666">
          This is an automated email from Project Hub.
          </p>
      </div>
      `,
    });

    console.log("OTP Email Sent Successfully:", info.messageId);

    return info;
  } catch (error) {
    console.error("SMTP Error:", error);
    throw error;
  }
}
