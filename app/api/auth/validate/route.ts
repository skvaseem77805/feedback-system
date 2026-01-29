import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';

/**
 * POST { studentId: string }
 * Returns student info if found (for login validation). Password check is optional.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const studentId = (body?.studentId || body?.student_id || '').trim().toUpperCase();
    if (!studentId) {
      return Response.json({ error: 'Student ID required' }, { status: 400 });
    }
    const row = await queryOne<{
      id: string;
      name: string;
      registration_no: string;
      year: number;
      course: string | null;
      email: string;
      mobile_no: string;
      department: string;
      section: string;
    }>(
      `SELECT id, name, registration_no, year, course, email, mobile_no, department, section FROM students WHERE id = ?`,
      [studentId]
    );
    if (!row) {
      return Response.json({ error: 'Student ID not found in database', found: false }, { status: 404 });
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
