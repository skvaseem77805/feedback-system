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
    await query(
      `INSERT IGNORE INTO project_likes (project_id, student_id) VALUES (?, ?)`,
      [projectId, studentId]
    );
    await query(
      `UPDATE projects SET likes = (SELECT COUNT(*) FROM project_likes WHERE project_id = ?) WHERE id = ?`,
      [projectId, projectId]
    );
    const row = await queryOne<{ likes: number }>(`SELECT likes FROM projects WHERE id = ?`, [projectId]);
    return Response.json({ liked: true, likes: row ? Number(row.likes) : 0 });
  } catch (e) {
    console.error('POST /api/projects/[id]/like', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
