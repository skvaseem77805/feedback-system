import { NextRequest } from 'next/server';
import { markNotificationRead } from '@/lib/services/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return Response.json({ error: 'Notification ID required' }, { status: 400 });
    }
    await markNotificationRead(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
