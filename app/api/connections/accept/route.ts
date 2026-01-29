import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

/**
 * POST { studentId, otherStudentId }
 * Accepts a pending request from otherStudentId -> studentId.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const studentId = (body?.studentId ?? body?.student_id ?? '').trim();
    const otherId = (body?.otherStudentId ?? body?.other_student_id ?? '').trim();
    if (!studentId || !otherId) {
      return Response.json({ error: 'studentId and otherStudentId required' }, { status: 400 });
    }

    const [raw] = await query(
      `UPDATE connection_requests SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
       WHERE from_student_id = ? AND to_student_id = ? AND status = 'pending'`,
      [otherId, studentId]
    );
    const header = raw as { affectedRows?: number };
    const ok = (header?.affectedRows ?? 0) > 0;
    if (!ok) {
      return Response.json({ error: 'No pending request found to accept' }, { status: 404 });
    }
    await query(
      `INSERT INTO student_stats (student_id, projects_uploaded, connections, collaborations) VALUES (?, 0, 1, 0), (?, 0, 1, 0)
       ON DUPLICATE KEY UPDATE connections = connections + 1`,
      [studentId, otherId]
    );
    return Response.json({ accepted: true });
  } catch (e) {
    console.error('POST /api/connections/accept', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
