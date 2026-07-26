import { NextRequest } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { bulkModifyAdminProjects } from '@/lib/services/admin-projects';

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const projectIds: string[] = body.projectIds || [];
    const updates = {
      department: body.department,
      category: body.category,
      status: body.status,
      visibility: body.visibility,
      isFeatured: body.isFeatured,
    };
    const adminEmail = request.headers.get('x-admin-email') || 'Admin';

    if (!projectIds || projectIds.length === 0) {
      return Response.json({ error: 'No project IDs provided' }, { status: 400 });
    }

    const result = await bulkModifyAdminProjects(projectIds, updates, adminEmail);
    return Response.json({ success: true, updatedCount: result.updatedCount });
  } catch (error: any) {
    console.error('bulk modify projects error:', error);
    return Response.json({ error: 'Failed to bulk modify projects' }, { status: 500 });
  }
}
