import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const registrationNo = (body.registrationNo || '').trim().toUpperCase();
    const email = (body.email || '').trim().toLowerCase();
    const otp = (body.otp || '').trim();
    const newPassword = body.newPassword || '';

    if (!registrationNo || !email || !otp || !newPassword) {
      return Response.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
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

    // 5. Hash the new password using bcrypt
    const newPasswordHash = await hashPassword(newPassword);

    // 6. Update password in students table
    await query(
      'UPDATE students SET password_hash = ? WHERE registration_no = ?',
      [newPasswordHash, registrationNo]
    );

    return Response.json({
      success: true,
      message: 'Password Updated Successfully.'
    });
  } catch (error) {
    console.error('Forgot Password Reset API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
