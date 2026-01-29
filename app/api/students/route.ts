import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

function formatYear(year: number): string {
  const m: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: 'Final' };
  return m[year] ?? `${year}th`;
}

export async function GET(request: NextRequest) {
  try {
    const { data: list, error } = await supabase
      .from('students')
      .select(`
        *,
        student_stats (
          projects_uploaded,
          connections,
          collaborations
        )
      `)
      .order('name');

    if (error) throw error;

    const students = (list || []).map((s: any) => {
      // s.student_stats is likely a single object due to PK constraint, but check
      const stats = Array.isArray(s.student_stats) ? s.student_stats[0] : s.student_stats;

      const skills = s.skills;

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
        skills: Array.isArray(skills) ? skills : (typeof skills === 'string' ? JSON.parse(skills) : undefined),
        avatar: s.avatar ?? undefined,
        academicYear: formatYear(s.year),
        projectsUploaded: Number(stats?.projects_uploaded) || 0,
        connectionsCount: Number(stats?.connections) || 0,
        collaborationsCount: Number(stats?.collaborations) || 0,
      };
    });

    return Response.json(students);
  } catch (e) {
    console.error('GET /api/students', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
