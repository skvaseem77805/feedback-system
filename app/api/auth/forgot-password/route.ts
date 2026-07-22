import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { sendOtpEmail } from '@/lib/services/brevo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const registrationNo = (body.registrationNo || '').trim().toUpperCase();
    const email = (body.email || '').trim().toLowerCase();

    if (!registrationNo || !email) {
      return Response.json({ error: 'Invalid Registration Number or Email Address.' }, { status: 400 });
    }

    // 1. Validate Registration Number format
    const regNoPattern = /^2[0-9A-Z]B8[0-9A-Z]A05[0-9A-Z]{2}$/i;
    if (!regNoPattern.test(registrationNo)) {
      return Response.json({ error: 'Invalid Registration Number.' }, { status: 400 });
    }

    // 2. Look up user by registration number and email matching
    const user = await queryOne<{ name: string; email: string }>(
      'SELECT name, email FROM users WHERE registration_no = ? AND email = ? LIMIT 1',
      [registrationNo, email]
    );

    if (!user) {
      // Do NOT reveal which field is incorrect
      return Response.json({ error: 'Invalid Registration Number or Email Address.' }, { status: 400 });
    }

    // 3. Rate limit: check if last OTP was sent less than 30 seconds ago
    const lastOtp = await queryOne<{ created_time: string | Date }>(
      'SELECT created_time FROM otps WHERE email = ? LIMIT 1',
      [email]
    );
    if (lastOtp) {
      const createdTime = new Date(lastOtp.created_time).getTime();
      const now = Date.now();
      const diffSec = (now - createdTime) / 1000;
      if (diffSec < 30) {
        return Response.json({ error: 'Too many OTP requests.' }, { status: 429 });
      }
    }

    // 4. Generate random 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 5. Delete previous OTPs & insert new
    await query('DELETE FROM otps WHERE email = ?', [email]);
    await query(
      'INSERT INTO otps (email, otp, expiry, created_time) VALUES (?, ?, ?, NOW())',
      [email, otp, expiry]
    );

    // 6. Send email using Brevo service
    try {
      await sendOtpEmail(email, otp, user.name);
    } catch (brevoErr) {
      console.error('Brevo forgot password error:', brevoErr);
      return Response.json(
        { error: 'Failed to send OTP email. Please check your email address.' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'OTP Sent Successfully.'
    });
  } catch (error) {
    console.error('Forgot Password Send OTP API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
