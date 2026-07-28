import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import { comparePassword } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawIdentifier = body.identifier || body.registrationNo || body.registration_no || body.email || '';
    const identifier = rawIdentifier.trim();
    const password = body.password || '';

    // Missing identifier or password
    if (!identifier || !password) {
      return Response.json({ error: 'Registration Number or Email and password are required.' }, { status: 400 });
    }

    const searchUpper = identifier.toUpperCase();
    const searchLower = identifier.toLowerCase();

    const sqlQuery = 'SELECT registration_no, name, email, password_hash, email_verified FROM students WHERE registration_no = ? OR email = ? OR LOWER(registration_no) = ? OR LOWER(email) = ? LIMIT 1';
    const sqlParams = [searchUpper, searchLower, searchLower, searchLower];

    const user = await queryOne<{ registration_no: string; name: string; email: string; password_hash: string | null; email_verified: number }>(
      sqlQuery,
      sqlParams
    );

    // Case 4: Student does not exist
    if (!user) {
      return Response.json({ error: 'Registration Number not found.' }, { status: 400 });
    }

    // Case 3: Student exists but password_hash is NULL (imported / manual entry not yet registered)
    if (!user.password_hash) {
      return Response.json({ error: 'Please complete your account registration first.' }, { status: 400 });
    }

    // Case 2 & Case 1: Compare passwords using bcrypt
    const isValid = await comparePassword(password, user.password_hash);

    if (!isValid) {
      return Response.json({ error: 'Invalid password.' }, { status: 400 });
    }

    // Case 1: Fetch user profile details from students table upon successful login
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
