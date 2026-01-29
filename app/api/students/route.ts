import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const [rows] = await query<{
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
      projects_uploaded: number;
      connections: number;
      collaborations: number;
    }>(
      `SELECT s.id, s.name, s.registration_no, s.unique_id, s.year, s.course, s.email, s.mobile_no, s.department, s.section, s.linkedin_url, s.bio, s.skills, s.avatar,
        COALESCE(st.projects_uploaded, 0) AS projects_uploaded,
        COALESCE(st.connections, 0) AS connections,
        COALESCE(st.collaborations, 0) AS collaborations
       FROM students s
       LEFT JOIN student_stats st ON st.student_id = s.id
       ORDER BY s.name`
    );
    const list = Array.isArray(rows) ? rows : [];
    const students = list.map((s) => ({
      id: s.id,
      userId: s.id,
      name: s.name,
      registrationNo: s.registration_no,
      uniqueId: s.unique_id,
      year: s.year,
      course: s.course,
      email: s.email || '',
      mobileNo: s.mobile_no || '',
      department: s.department || 'CSE',
      section: s.section || 'E',
      linkedinUrl: s.linkedin_url ?? undefined,
      bio: s.bio ?? undefined,
      skills: s.skills ? (JSON.parse(s.skills) as string[]) : undefined,
      avatar: s.avatar ?? undefined,
      academicYear: formatYear(s.year),
      projectsUploaded: Number(s.projects_uploaded) || 0,
      connectionsCount: Number(s.connections) || 0,
      collaborationsCount: Number(s.collaborations) || 0,
    }));
    return Response.json(students);
  } catch (e) {
    console.error('GET /api/students', e);
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
