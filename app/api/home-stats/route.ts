import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const row = await queryOne<{
      totalProjects: number;
      totalStudents: number;
      totalDepartments: number;
      totalFeedbacks: number;
    }>(
      `
      SELECT
        (SELECT COUNT(*) FROM projects) AS totalProjects,
        (SELECT COUNT(*) FROM students) AS totalStudents,
        (SELECT COUNT(DISTINCT department) FROM students) AS totalDepartments,
        (SELECT COUNT(*) FROM feedback) AS totalFeedbacks
      `
    );

    return NextResponse.json({
      totalProjects: Number(row?.totalProjects) || 0,
      totalStudents: Number(row?.totalStudents) || 0,
      totalDepartments: Number(row?.totalDepartments) || 0,
      totalFeedbacks: Number(row?.totalFeedbacks) || 0,
    });
  } catch (error) {
    console.error('[home-stats] Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
