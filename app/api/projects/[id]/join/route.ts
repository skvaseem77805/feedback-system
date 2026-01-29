import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json().catch(() => ({}));
    const studentId = (body?.studentId ?? body?.student_id ?? '').trim();
    if (!projectId || !studentId) {
      return Response.json({ error: 'projectId and studentId required' }, { status: 400 });
    }
    const existing = await queryOne<{ n: number }>(
      `SELECT 1 AS n FROM project_collaborators WHERE project_id = ? AND student_id = ?`,
      [projectId, studentId]
    );
    if (existing) {
      return Response.json({ joined: false, already: true });
    }
    await query(
      `INSERT INTO project_collaborators (project_id, student_id) VALUES (?, ?)`,
      [projectId, studentId]
    );
    await query(
      `INSERT INTO student_stats (student_id, projects_uploaded, connections, collaborations) VALUES (?, 0, 0, 1)
       ON DUPLICATE KEY UPDATE collaborations = collaborations + 1`,
      [studentId]
    );
    return Response.json({ joined: true });
  } catch (e) {
    console.error('POST /api/projects/[id]/join', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
