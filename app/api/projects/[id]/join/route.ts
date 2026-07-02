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

    // Check if already joined
    const existing = await queryOne<any>(
      `
      SELECT student_id
      FROM project_collaborators
      WHERE project_id = ?
      AND student_id = ?
      `,
      [projectId, studentId]
    );

    if (existing) {
      return Response.json({
        joined: false,
        already: true,
      });
    }

    // Add collaborator
    await query(
      `
      INSERT INTO project_collaborators
      (project_id, student_id)
      VALUES (?, ?)
      `,
      [projectId, studentId]
    );

    // Increment collaboration count
    await query(
      `
      UPDATE student_stats
      SET collaborations = collaborations + 1
      WHERE student_id = ?
      `,
      [studentId]
    );

    return Response.json({
      joined: true,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}