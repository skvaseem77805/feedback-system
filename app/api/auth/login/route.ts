import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import { comparePassword } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const registrationNo = (body.registrationNo || '').trim().toUpperCase();
    const password = body.password || '';

    if (!registrationNo || !password) {
      return Response.json({ error: 'Registration Number and password are required.' }, { status: 400 });
    }

    // 1. Validate Registration Number format
    const regNoPattern = /^2[0-9A-Z]B8[0-9A-Z]A05[0-9A-Z]{2}$/i;
    if (!regNoPattern.test(registrationNo)) {
      return Response.json({ error: 'Invalid Registration Number.' }, { status: 400 });
    }

    // 2. Fetch user
    const user = await queryOne<{ registration_no: string; name: string; email: string; password_hash: string }>(
      'SELECT registration_no, name, email, password_hash FROM users WHERE registration_no = ? LIMIT 1',
      [registrationNo]
    );

    if (!user) {
      return Response.json({ error: 'Invalid Registration Number or Email Address.' }, { status: 400 });
    }

    // 3. Compare passwords
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return Response.json({ error: 'Invalid Registration Number or Email Address.' }, { status: 400 });
    }

    // 4. Fetch user profile
    const profile = await queryOne<{ department: string; year: string; section: string }>(
      'SELECT department, year, section FROM student_profiles WHERE registration_no = ? LIMIT 1',
      [registrationNo]
    );

    return Response.json({
      success: true,
      user: {
        registrationNo: user.registration_no,
        name: user.name,
        email: user.email
      },
      profile: profile || {
        department: 'CSE',
        year: '2nd Year',
        section: 'A'
      }
    });
  } catch (error) {
    console.error('Login API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
