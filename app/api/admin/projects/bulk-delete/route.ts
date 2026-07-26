import { NextRequest } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { bulkDeleteAdminProjects } from '@/lib/services/admin-projects';

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const projectIds: string[] = body.projectIds || [];
    const adminEmail = request.headers.get('x-admin-email') || 'Admin';

    if (!projectIds || projectIds.length === 0) {
      return Response.json({ error: 'No project IDs provided' }, { status: 400 });
    }

    const result = await bulkDeleteAdminProjects(projectIds, adminEmail);
    return Response.json({ success: true, deletedCount: result.deletedCount });
  } catch (error: any) {
    console.error('bulk delete projects error:', error);
    return Response.json({ error: 'Failed to bulk delete projects' }, { status: 500 });
  }
}
