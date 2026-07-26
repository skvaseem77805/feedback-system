import { NextRequest } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { deleteImportBatches } from '@/lib/services/import-batches';
import { invalidateStudentsCache } from '@/lib/services/students';

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const batchIds: string[] = body.batchIds || [];

    if (!batchIds || batchIds.length === 0) {
      return Response.json({ error: 'No batch IDs provided' }, { status: 400 });
    }

    const result = await deleteImportBatches(batchIds);
    await invalidateStudentsCache();

    return Response.json({
      success: true,
      deletedBatches: result.deletedBatches,
      deletedStudents: result.deletedStudents
    });
  } catch (error: any) {
    console.error('bulk-delete error:', error);
    return Response.json({ error: 'Failed to delete import batches' }, { status: 500 });
  }
}
