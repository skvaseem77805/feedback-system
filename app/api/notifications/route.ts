import { NextRequest } from 'next/server';
import { getNotifications } from '@/lib/services/notifications';
import { parseStudentId } from '@/lib/security';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = parseStudentId(searchParams.get('studentId')) || '';

    if (!studentId) {
      return Response.json({ error: 'studentId required' }, { status: 400 });
    }

    const notifications = await getNotifications(studentId, 50);
    return Response.json(notifications);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = parseStudentId(searchParams.get('studentId')) || '';

    if (!studentId) {
      return Response.json({ error: 'studentId required' }, { status: 400 });
    }

    await query(
      `DELETE FROM notifications WHERE receiver_id = ?`,
      [studentId]
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
