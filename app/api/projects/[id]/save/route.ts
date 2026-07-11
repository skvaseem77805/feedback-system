import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { parseStudentId } from '@/lib/security';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const body = await request.json().catch(() => ({}));

    const studentId = parseStudentId(body?.studentId || body?.student_id);

    if (!projectId || !studentId) {
      return Response.json(
        { error: 'projectId and studentId required' },
        { status: 400 }
      );
    }

    const exists = await queryOne<any>(
      `SELECT 1 FROM project_saves WHERE project_id = ? AND student_id = ?`,
      [projectId, studentId]
    );

    let saved = false;
    if (exists) {
      await query(
        `DELETE FROM project_saves WHERE project_id = ? AND student_id = ?`,
        [projectId, studentId]
      );
      saved = false;
    } else {
      await query(
        `INSERT IGNORE INTO project_saves (project_id, student_id) VALUES (?, ?)`,
        [projectId, studentId]
      );
      saved = true;
    }

    const { invalidateProject, invalidateProjectsCache } = await import('@/lib/services/projects');
    invalidateProject(projectId);
    invalidateProjectsCache();

    return Response.json({
      saved,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}