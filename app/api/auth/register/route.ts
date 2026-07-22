import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { sendOtpEmail } from '@/lib/services/brevo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const registrationNo = (body.registrationNo || '').trim().toUpperCase();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    // 1. Validate fields presence
    if (!registrationNo) {
      return Response.json({ error: 'Registration Number is mandatory.' }, { status: 400 });
    }
    if (!name) {
      return Response.json({ error: 'Student Name is mandatory.' }, { status: 400 });
    }
    if (!email) {
      return Response.json({ error: 'Email is mandatory.' }, { status: 400 });
    }
    if (!password) {
      return Response.json({ error: 'Password is mandatory.' }, { status: 400 });
    }

    // 2. Validate Registration Number format
    const regNoPattern = /^2[0-9A-Z]B8[0-9A-Z]A05[0-9A-Z]{2}$/i;
    if (!regNoPattern.test(registrationNo)) {
      return Response.json({ error: 'Invalid Registration Number.' }, { status: 400 });
    }

    // 3. Check Registration Number already exists in users table
    const existingUser = await queryOne<{ registration_no: string }>(
      'SELECT registration_no FROM users WHERE registration_no = ? LIMIT 1',
      [registrationNo]
    );
    if (existingUser) {
      return Response.json(
        { error: 'This Registration Number is already registered. Please log in instead.' },
        { status: 400 }
      );
    }

    // 4. Check Email already exists in users table
    const existingEmail = await queryOne<{ email: string }>(
      'SELECT email FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (existingEmail) {
      return Response.json(
        { error: 'This Email Address is already registered. Please log in instead.' },
        { status: 400 }
      );
    }

    // 5. Rate limit: check if last OTP was sent less than 30 seconds ago
    const lastOtp = await queryOne<{ created_time: string | Date }>(
      'SELECT created_time FROM otps WHERE email = ? LIMIT 1',
      [email]
    );
    if (lastOtp) {
      const createdTime = new Date(lastOtp.created_time).getTime();
      const now = Date.now();
      const diffSec = (now - createdTime) / 1000;

      if (diffSec < 30) {
        const remaining = Math.ceil(30 - diffSec);

        return Response.json(
          {
            error: `Please wait ${remaining} seconds before requesting another OTP.`
          },
          { status: 429 }
        );
      }
    }

    // 6. Generate random 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    console.log('[DEBUG REGISTRATION] OTP generated successfully.');

    // 7. Delete previous OTPs for this email & store the new one
    console.log(`[DEBUG REGISTRATION] Storing OTP in database for email: ${email}`);
    try {
      await query('DELETE FROM otps WHERE email = ?', [email]);
      await query(
        'INSERT INTO otps (email, otp, expiry, created_time) VALUES (?, ?, ?, NOW())',
        [email, otp, expiry]
      );
      console.log('[DEBUG REGISTRATION] OTP stored successfully in MySQL.');
    } catch (dbErr: any) {
      console.error('[DEBUG REGISTRATION] MySQL database error during OTP storage:', dbErr.stack || dbErr);
      return Response.json(
        { error: `Database error: ${dbErr.message || 'Failed to write OTP to database.'}` },
        { status: 500 }
      );
    }

    // 8. Send OTP via Brevo
    try {
      console.log(`[DEBUG REGISTRATION] Starting Brevo dispatch to: ${email}`);
      await sendOtpEmail(email, otp, name);
      console.log('[DEBUG REGISTRATION] Brevo dispatch successful.');
    } catch (brevoErr: any) {
      console.error('[DEBUG REGISTRATION] Brevo email dispatch failed! Stack trace:', brevoErr.stack || brevoErr);
      return Response.json(
        { error: `Failed to send OTP email: ${brevoErr.message || 'Unknown Brevo Error'}` },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'OTP Sent Successfully.'
    });
  } catch (error: any) {
    console.error('[DEBUG REGISTRATION] Register API Error:', error.stack || error);
    return Response.json({ error: `Internal Server Error: ${error.message || 'Unknown'}` }, { status: 500 });
  }
}
