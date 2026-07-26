import { NextRequest } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getProjectFilterOptions } from '@/lib/services/admin-projects';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const options = await getProjectFilterOptions();
    return Response.json(options);
  } catch (error: any) {
    console.error('filter-options error:', error);
    return Response.json({ error: 'Failed to fetch project filter options' }, { status: 500 });
  }
}
