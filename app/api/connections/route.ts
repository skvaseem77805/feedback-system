import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/connections?studentId=...
 * Returns { connections: string[], sent: string[], received: string[] }
 * - connections: student ids with accepted connection
 * - sent: student ids to whom current user sent pending request
 * - received: student ids from whom current user received pending request
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId')?.trim();
    if (!studentId) {
      return Response.json({ error: 'studentId required' }, { status: 400 });
    }

    const [reqRows] = await query<{ from_student_id: string; to_student_id: string; status: string }>(
      `SELECT from_student_id, to_student_id, status FROM connection_requests
       WHERE from_student_id = ? OR to_student_id = ?`,
      [studentId, studentId]
    );
    const reqList = Array.isArray(reqRows) ? reqRows : [];

    const connections: string[] = [];
    const sent: string[] = [];
    const received: string[] = [];

    for (const r of reqList) {
      const other = r.from_student_id === studentId ? r.to_student_id : r.from_student_id;
      if (r.status === 'accepted') {
        if (!connections.includes(other)) connections.push(other);
      } else if (r.status === 'pending') {
        if (r.from_student_id === studentId) {
          if (!sent.includes(other)) sent.push(other);
        } else {
          if (!received.includes(other)) received.push(other);
        }
      }
    }

    return Response.json({ connections, sent, received });
  } catch (e) {
    console.error('GET /api/connections', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
