import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { parseStudentId } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const studentId = parseStudentId(searchParams.get('studentId'));

    if (!studentId) {
      return Response.json(
        { error: 'studentId required' },
        { status: 400 }
      );
    }

    const [reqList] = await query<any>(
      `
      SELECT
        from_student_id,
        to_student_id,
        status
      FROM connection_requests
      WHERE from_student_id = ?
         OR to_student_id = ?
      `,
      [studentId, studentId]
    );

    const connections: string[] = [];
    const sent: string[] = [];
    const received: string[] = [];

    for (const r of reqList) {
      const other =
        r.from_student_id === studentId
          ? r.to_student_id
          : r.from_student_id;

      if (r.status === 'accepted') {
        if (!connections.includes(other)) {
          connections.push(other);
        }
      } else if (r.status === 'pending') {
        if (r.from_student_id === studentId) {
          if (!sent.includes(other)) {
            sent.push(other);
          }
        } else {
          if (!received.includes(other)) {
            received.push(other);
          }
        }
      }
    }

    return Response.json({
      connections,
      sent,
      received,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}