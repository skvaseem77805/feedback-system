import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { parseStudentId } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const fromId = parseStudentId(body?.fromStudentId || body?.from_student_id);

    const toId = parseStudentId(body?.toStudentId || body?.to_student_id);

    if (!fromId || !toId) {
      return Response.json(
        { error: 'fromStudentId and toStudentId required' },
        { status: 400 }
      );
    }

    if (fromId === toId) {
      return Response.json(
        { error: 'Cannot send request to self' },
        { status: 400 }
      );
    }

    // Check existing request in either direction
    const existing = await queryOne<any>(
      `
      SELECT status
      FROM connection_requests
      WHERE
      (from_student_id = ? AND to_student_id = ?)
      OR
      (from_student_id = ? AND to_student_id = ?)
      `,
      [fromId, toId, toId, fromId]
    );

    if (existing) {
      if (existing.status === 'accepted') {
        return Response.json(
          {
            error: 'Already connected',
            alreadyConnected: true,
          },
          { status: 400 }
        );
      }

      if (existing.status === 'pending') {
        return Response.json(
          {
            error: 'Request already pending',
            alreadyPending: true,
          },
          { status: 400 }
        );
      }
    }

    const id = `conn-${Date.now()}`;

    await query(
      `
      INSERT INTO connection_requests
      (
        id,
        from_student_id,
        to_student_id,
        status
      )
      VALUES (?, ?, ?, 'pending')
      `,
      [id, fromId, toId]
    );

    return Response.json({
      id,
      fromStudentId: fromId,
      toStudentId: toId,
      status: 'pending',
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}