import { NextRequest } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getAdminProjects } from '@/lib/services/admin-projects';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const month = searchParams.get('month') || undefined;
    const year = searchParams.get('year') || undefined;
    const department = searchParams.get('department') || undefined;
    const section = searchParams.get('section') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const data = await getAdminProjects({
      search,
      fromDate,
      toDate,
      month,
      year,
      department,
      section,
      category,
      status,
      page,
      pageSize,
    });

    return Response.json(data);
  } catch (error: any) {
    console.error('admin projects error:', error);
    return Response.json({ error: 'Failed to fetch admin projects' }, { status: 500 });
  }
}
