import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { parseStudentId } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const studentId = parseStudentId(body?.studentId || body?.student_id);

    const otherId = parseStudentId(body?.otherStudentId || body?.other_student_id);

    if (!studentId || !otherId) {
      return Response.json(
        { error: 'studentId and otherStudentId required' },
        { status: 400 }
      );
    }

    // Resolve both studentId and otherId to their actual students.id
    const [idRows] = await query<any>(
      'SELECT id, registration_no FROM students WHERE id IN (?, ?) OR registration_no IN (?, ?)',
      [studentId, otherId, studentId, otherId]
    );

    let actualStudentId: string | number = studentId;
    let actualOtherId: string | number = otherId;

    if (Array.isArray(idRows)) {
      const studentMap = new Map<string, string | number>();
      idRows.forEach((r: any) => {
        studentMap.set(r.registration_no, r.id);
        studentMap.set(r.id.toString(), r.id);
      });
      actualStudentId = studentMap.get(studentId) || studentId;
      actualOtherId = studentMap.get(otherId) || otherId;
    }

    // Accept request
    const [result]: any = await query(
      `
      UPDATE connection_requests
      SET
        status = 'accepted',
        updated_at = NOW()
      WHERE
        from_student_id = ?
        AND to_student_id = ?
        AND status = 'pending'
      `,
      [actualOtherId, actualStudentId]
    );

    if (result.affectedRows === 0) {
      return Response.json(
        { error: 'No pending request found to accept' },
        { status: 404 }
      );
    }

    // Increase connection count for both students
    await query(
      `
      UPDATE student_stats
      SET connections = connections + 1
      WHERE student_id = ?
      `,
      [actualStudentId]
    );

    await query(
      `
      UPDATE student_stats
      SET connections = connections + 1
      WHERE student_id = ?
      `,
      [actualOtherId]
    );

    return Response.json({
      accepted: true,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}