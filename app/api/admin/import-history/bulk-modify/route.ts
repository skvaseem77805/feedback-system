import { NextRequest } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { bulkModifyStudents } from '@/lib/services/import-batches';
import { invalidateStudentsCache } from '@/lib/services/students';

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const batchIds: string[] = body.batchIds || [];
    const year = body.year;
    const section = body.section;
    const branch = body.branch;

    if (!batchIds || batchIds.length === 0) {
      return Response.json({ error: 'No batch IDs provided' }, { status: 400 });
    }

    const result = await bulkModifyStudents({ batchIds, year, section, branch });
    await invalidateStudentsCache();

    return Response.json({
      success: true,
      updatedCount: result.updatedCount
    });
  } catch (error: any) {
    console.error('bulk-modify error:', error);
    return Response.json({ error: 'Failed to bulk modify students' }, { status: 500 });
  }
}
