import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { comparePassword } from '@/lib/auth-utils';

/**
 * POST { studentId: string, password?: string }
 * Returns student info if valid.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const studentId = (body?.studentId || body?.student_id || '').trim().toUpperCase();
    const password = body?.password || '';

    if (!studentId) {
      return Response.json({ error: 'Student ID required' }, { status: 400 });
    }

    if (!password) {
      return Response.json({ error: 'Password required' }, { status: 400 });
    }

    // Supabase query
    // Note: 'students' table must exist in 'public' schema
    const { data: row, error } = await supabase
      .from('students')
      .select('id, name, registration_no, year, course, email, mobile_no, department, section, password_hash')
      .eq('id', studentId)
      .single();

    if (error || !row) {
      // PGRST116 means zero rows found in single()
      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error:', error);
        return Response.json({ error: 'Database error', details: error.message }, { status: 500 });
      }
      return Response.json({ error: 'Student ID not found in database', found: false }, { status: 404 });
    }

    // Verify password
    // 1. Check if password matches studentId (Developer/User Shortcut)
    if (password === studentId) {
      // Allow login
    } else {
      // 2. Check hashed password if set
      if (!row.password_hash) {
        return Response.json({ error: 'Account not set up for login (no password set). Contact admin.', found: true }, { status: 401 });
      }
      const isValid = await comparePassword(password, row.password_hash);
      if (!isValid) {
        return Response.json({ error: 'Invalid password', found: true }, { status: 401 });
      }
    }

    const academicYear = formatYear(row.year);
    return Response.json({
      found: true,
      student: {
        id: row.id,
        userId: row.id,
        name: row.name,
        registrationNo: row.registration_no,
        year: row.year,
        course: row.course,
        email: row.email || '',
        mobileNo: row.mobile_no || '',
        department: row.department || 'CSE',
        section: row.section || 'E',
        academicYear,
      },
    });
  } catch (e) {
    console.error('POST /api/auth/validate', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}

function formatYear(year: number): string {
  const m: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: 'Final' };
  return m[year] ?? `${year}th`;
}
