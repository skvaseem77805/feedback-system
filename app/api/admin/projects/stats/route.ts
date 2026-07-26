import { NextRequest } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getAdminProjectStats } from '@/lib/services/admin-projects';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const month = searchParams.get('month') || undefined;
    const year = searchParams.get('year') || undefined;
    const department = searchParams.get('department') || undefined;
    const section = searchParams.get('section') || undefined;
    const category = searchParams.get('category') || undefined;

    const stats = await getAdminProjectStats({
      fromDate,
      toDate,
      month,
      year,
      department,
      section,
      category,
    });

    return Response.json(stats);
  } catch (error: any) {
    console.error('admin project stats error:', error);
    return Response.json({ error: 'Failed to fetch admin project stats' }, { status: 500 });
  }
}
