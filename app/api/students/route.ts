import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

function formatYear(year: number): string {
  const m: Record<number, string> = {
    1: '1st',
    2: '2nd',
    3: '3rd',
    4: 'Final',
  };
  return m[year] ?? `${year}th`;
}

export async function GET(request: NextRequest) {
  try {
    const [rows] = await query<any>(
      `
      SELECT
        s.*,
        ss.projects_uploaded,
        ss.connections,
        ss.collaborations
      FROM students s
      LEFT JOIN student_stats ss
      ON s.id = ss.student_id
      ORDER BY s.name
      `
    );

    const students = rows.map((s: any) => {
      let skills: string[] = [];

      if (s.skills) {
        try {
          skills =
            typeof s.skills === 'string'
              ? JSON.parse(s.skills)
              : s.skills;
        } catch {
          skills = [];
        }
      }

      return {
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
        skills,
        avatar: s.avatar ?? undefined,
        academicYear: formatYear(s.year),
        projectsUploaded: Number(s.projects_uploaded) || 0,
        connectionsCount: Number(s.connections) || 0,
        collaborationsCount: Number(s.collaborations) || 0,
      };
    });

    return Response.json(students);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}