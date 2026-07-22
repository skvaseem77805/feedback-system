import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const registrationNo = (body.registrationNo || '').trim().toUpperCase();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const otp = (body.otp || '').trim();

    if (!registrationNo || !name || !email || !password || !otp) {
      return Response.json({ error: 'All fields and OTP are required.' }, { status: 400 });
    }

    // 1. Fetch OTP record
    const otpRecord = await queryOne<{ otp: string; expiry: string | Date }>(
      'SELECT otp, expiry FROM otps WHERE email = ? LIMIT 1',
      [email]
    );

    if (!otpRecord) {
      return Response.json({ error: 'Incorrect OTP.' }, { status: 400 });
    }

    // 2. Validate OTP match
    if (otpRecord.otp !== otp) {
      return Response.json({ error: 'Incorrect OTP.' }, { status: 400 });
    }

    // 3. Validate expiry
    const expiryTime = new Date(otpRecord.expiry).getTime();
    if (expiryTime < Date.now()) {
      return Response.json({ error: 'OTP expired.' }, { status: 400 });
    }

    // 4. Delete OTP immediately upon success
    await query('DELETE FROM otps WHERE email = ?', [email]);

    // 5. Hash password using bcrypt
    const passwordHash = await hashPassword(password);

    // 6. Insert student user
    await query(
      `INSERT INTO users (registration_no, name, email, password_hash, email_verified)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), password_hash = VALUES(password_hash), email_verified = VALUES(email_verified)`,
      [registrationNo, name, email, passwordHash]
    );

    return Response.json({
      success: true,
      message: 'Registration Completed Successfully.'
    });
  } catch (error) {
    console.error('Verify OTP API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
