import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import { comparePassword } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawIdentifier = body.identifier || body.registrationNo || body.registration_no || body.email || '';
    const identifier = rawIdentifier.trim();
    const password = body.password || '';

    console.log('[DEBUG LOGIN] Incoming request with identifier:', identifier, '| password length:', password.length);

    if (!identifier || !password) {
      console.log('[DEBUG LOGIN] HTTP 400 Reason: Missing identifier or password.');
      return Response.json({ error: 'Registration Number or Email and password are required.' }, { status: 400 });
    }

    const searchUpper = identifier.toUpperCase();
    const searchLower = identifier.toLowerCase();

    console.log('[DEBUG LOGIN] Normalized search terms - upper:', searchUpper, '| lower:', searchLower);

    // 1. Fetch user from students table by registration_no or email (case-insensitive)
    const user = await queryOne<{ registration_no: string; name: string; email: string; password_hash: string | null; email_verified: number }>(
      'SELECT registration_no, name, email, password_hash, email_verified FROM students WHERE registration_no = ? OR email = ? OR LOWER(registration_no) = ? OR LOWER(email) = ? LIMIT 1',
      [searchUpper, searchLower, searchLower, searchLower]
    );

    console.log('[DEBUG LOGIN] SQL User Result:', user ? {
      registration_no: user.registration_no,
      name: user.name,
      email: user.email,
      has_password_hash: !!user.password_hash,
      email_verified: user.email_verified
    } : null);

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

    // 2. Compare passwords using bcrypt
    console.log('[DEBUG LOGIN] Executing bcrypt.compare()...');
    const isValid = await comparePassword(password, user.password_hash);
    console.log('[DEBUG LOGIN] bcrypt compare result:', isValid);

    if (!isValid) {
      console.log('[DEBUG LOGIN] HTTP 400 Reason: Password mismatch.');
      return Response.json({ error: 'Invalid Registration Number or Email Address.' }, { status: 400 });
    }

    // 3. Fetch user profile details from students table
    const profile = await queryOne<{ department: string; year: number; section: string }>(
      'SELECT department, year, section FROM students WHERE registration_no = ? LIMIT 1',
      [user.registration_no]
    );

    console.log('[DEBUG LOGIN] Profile result:', profile);

    let displayYear = '2nd Year';
    if (profile) {
      if (profile.year === 1) displayYear = '1st Year';
      else if (profile.year === 2) displayYear = '2nd Year';
      else if (profile.year === 3) displayYear = '3rd Year';
      else if (profile.year === 4) displayYear = '4th Year';
    }

    console.log('[DEBUG LOGIN] Login successful for user:', user.registration_no);

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
    console.error('[DEBUG LOGIN] Login API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

