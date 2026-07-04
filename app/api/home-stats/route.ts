import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const projectsRow = await queryOne<{ total: number }>('SELECT COUNT(*) AS total FROM projects');
    const studentsRow = await queryOne<{ total: number }>('SELECT COUNT(*) AS total FROM students');
    const deptsRow = await queryOne<{ total: number }>('SELECT COUNT(DISTINCT department) AS total FROM students');

    return NextResponse.json({
      totalProjects: Number(projectsRow?.total) || 0,
      totalStudents: Number(studentsRow?.total) || 0,
      totalDepartments: Number(deptsRow?.total) || 0,
    });
  } catch (error) {
    console.error('[home-stats] Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
