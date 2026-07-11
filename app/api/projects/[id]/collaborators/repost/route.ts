import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { parseStudentId } from '@/lib/security';
import { invalidateProjectsCache } from '@/lib/services/projects';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn;
  try {
    const { id: projectId } = await params;
    if (!projectId) {
      return Response.json({ error: 'Project ID required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const studentId = parseStudentId(body.studentId);

    if (!studentId) {
      return Response.json({ error: 'studentId required' }, { status: 400 });
    }

    const pool = getPool();
    conn = await pool.getConnection();

    // Verify student is an accepted collaborator
    const [rows] = await conn.query(
      `SELECT status FROM collaborators WHERE project_id = ? AND student_id = ?`,
      [projectId, studentId]
    ) as any;
    const rowsArray = Array.isArray(rows) ? rows : [];
    const collab = rowsArray[0] ?? null;

    if (!collab || collab.status !== 'ACCEPTED') {
      conn.release();
      return Response.json({ error: 'Not authorized or collaboration not accepted' }, { status: 403 });
    }

    // Set is_reposted = 1
    await conn.query(
      `UPDATE collaborators SET is_reposted = 1 WHERE project_id = ? AND student_id = ?`,
      [projectId, studentId]
    );

    conn.release();
    invalidateProjectsCache();

    return Response.json({ success: true });
  } catch (error) {
    if (conn) {
      conn.release();
    }
    console.error(error);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
