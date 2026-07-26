import { NextRequest } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getImportStats } from '@/lib/services/import-batches';

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

    const stats = await getImportStats({ fromDate, toDate, month, year });
    return Response.json(stats);
  } catch (error: any) {
    console.error('import-stats error:', error);
    return Response.json({ error: 'Failed to fetch import stats' }, { status: 500 });
  }
}
