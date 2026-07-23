import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import { comparePassword } from '@/lib/auth-utils';
import { validateRegistrationNo } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const registrationNo = (body.registrationNo || '').trim().toUpperCase();
    const password = body.password || '';

    if (!registrationNo || !password) {
      return Response.json({ error: 'Registration Number and password are required.' }, { status: 400 });
    }

    // 1. Validate Registration Number format
    const validation = validateRegistrationNo(registrationNo);
    console.log('[DEBUG LOGIN] Submitted Registration Number:', registrationNo);
    if (!validation.isValid) {
      console.log('[DEBUG LOGIN] HTTP 400 Reason: Registration number format invalid against regex.');
      return Response.json({ error: validation.error }, { status: 400 });
    }

    // 2. Fetch user from students
    const user = await queryOne<{ registration_no: string; name: string; email: string; password_hash: string | null; email_verified: number }>(
      'SELECT registration_no, name, email, password_hash, email_verified FROM students WHERE registration_no = ? OR email = ? LIMIT 1',
      [registrationNo, registrationNo.toLowerCase()]
    );
    console.log('[DEBUG LOGIN] SQL User Result:', JSON.stringify(user, null, 2));

    if (!user) {
      console.log('[DEBUG LOGIN] HTTP 400 Reason: No student found matching registration_no or email.');
      return Response.json({ error: 'Invalid Registration Number or Email Address.' }, { status: 400 });
    }

    console.log('[DEBUG LOGIN] password_hash exists?', !!(user.password_hash));
    console.log('[DEBUG LOGIN] email_verified:', user.email_verified);
    if (!user.password_hash) {
      console.log('[DEBUG LOGIN] HTTP 400 Reason: Student exists but has no password_hash.');
      return Response.json({ error: 'Invalid Registration Number or Email Address.' }, { status: 400 });
    }

    // 3. Compare passwords
    const isValid = await comparePassword(password, user.password_hash);
    console.log('[DEBUG LOGIN] bcrypt compare result:', isValid);
    if (!isValid) {
      console.log('[DEBUG LOGIN] HTTP 400 Reason: password mismatch.');
      return Response.json({ error: 'Invalid Registration Number or Email Address.' }, { status: 400 });
    }

    // 4. Fetch user profile from students
    const profile = await queryOne<{ department: string; year: number; section: string }>(
      'SELECT department, year, section FROM students WHERE registration_no = ? LIMIT 1',
      [user.registration_no]
    );

    let displayYear = '2nd Year';
    if (profile) {
      if (profile.year === 1) displayYear = '1st Year';
      else if (profile.year === 2) displayYear = '2nd Year';
      else if (profile.year === 3) displayYear = '3rd Year';
      else if (profile.year === 4) displayYear = '4th Year';
    }

    return Response.json({
      success: true,
      user: {
        registrationNo: user.registration_no,
        name: user.name,
        email: user.email
      },
      profile: profile ? {
        department: profile.department || 'CSE',
        year: displayYear,
        section: profile.section || 'A'
      } : {
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
