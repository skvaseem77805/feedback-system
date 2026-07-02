import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const body = await request.json().catch(() => ({}));

    const studentId = (
      body.studentId ||
      body.student_id ||
      ''
    ).trim();

    if (!projectId || !studentId) {
      return Response.json(
        { error: 'projectId and studentId required' },
        { status: 400 }
      );
    }

    // Ignore duplicate likes
    await query(
      `
      INSERT IGNORE INTO project_likes
      (project_id, student_id)
      VALUES (?, ?)
      `,
      [projectId, studentId]
    );

    // Count total likes
    const row = await queryOne<any>(
      `
      SELECT COUNT(*) AS total
      FROM project_likes
      WHERE project_id = ?
      `,
      [projectId]
    );

    const likes = Number(row?.total || 0);

    // Update projects table
    await query(
      `
      UPDATE projects
      SET likes = ?
      WHERE id = ?
      `,
      [likes, projectId]
    );

    return Response.json({
      liked: true,
      likes,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}