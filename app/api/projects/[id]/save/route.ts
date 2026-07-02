import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

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

    await query(
      `
      INSERT IGNORE INTO project_saves
      (project_id, student_id)
      VALUES (?, ?)
      `,
      [projectId, studentId]
    );

    return Response.json({
      saved: true,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}