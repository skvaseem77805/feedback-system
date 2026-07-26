import { NextRequest } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getAdminProjectActivityLogs } from '@/lib/services/admin-projects';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const logs = await getAdminProjectActivityLogs();
    return Response.json({ logs });
  } catch (error: any) {
    console.error('admin project logs error:', error);
    return Response.json({ error: 'Failed to fetch project activity logs' }, { status: 500 });
  }
}
