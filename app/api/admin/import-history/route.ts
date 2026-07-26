import { NextRequest } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getImportHistory } from '@/lib/services/import-batches';

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
    const search = searchParams.get('search') || undefined;

    const history = await getImportHistory({ fromDate, toDate, month, year, search });
    return Response.json({ history });
  } catch (error: any) {
    console.error('import-history error:', error);
    return Response.json({ error: 'Failed to fetch import history' }, { status: 500 });
  }
}
