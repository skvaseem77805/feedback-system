import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sid = (id || '').trim().toUpperCase();
    if (!sid) {
      return Response.json({ error: 'Student ID required' }, { status: 400 });
    }
    const row = await queryOne<{
      id: string;
      name: string;
      registration_no: string;
      unique_id: string | null;
      year: number;
      course: string | null;
      email: string;
      mobile_no: string;
      department: string;
      section: string;
      linkedin_url: string | null;
      bio: string | null;
      skills: string | null;
      avatar: string | null;
    }>(
      `SELECT id, name, registration_no, unique_id, year, course, email, mobile_no, department, section, linkedin_url, bio, skills, avatar FROM students WHERE id = ?`,
      [sid]
    );
    if (!row) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }
    const academicYear = formatYear(row.year);
    return Response.json({
      id: row.id,
      userId: row.id,
      name: row.name,
      registrationNo: row.registration_no,
      uniqueId: row.unique_id,
      year: row.year,
      course: row.course,
      email: row.email || '',
      mobileNo: row.mobile_no || '',
      department: row.department || 'CSE',
      section: row.section || 'E',
      linkedinUrl: row.linkedin_url ?? undefined,
      bio: row.bio ?? undefined,
      skills: row.skills ? (JSON.parse(row.skills) as string[]) : undefined,
      avatar: row.avatar ?? undefined,
      academicYear,
    });
  } catch (e) {
    console.error('GET /api/students/[id]', e);
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
