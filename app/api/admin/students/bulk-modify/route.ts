import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const studentIds: string[] = body.studentIds || [];
    const { branch, year, section } = body;

    if (!studentIds || studentIds.length === 0) {
      return Response.json({ error: 'No student IDs provided' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (branch && branch !== 'KEEP_EXISTING') {
      updates.push('department = ?');
      updates.push('course = ?');
      params.push(branch, branch);
    }

    if (year && year !== 'KEEP_EXISTING') {
      updates.push('year = ?');
      const yearNum = year === '1st' || year === '1' ? 1 : year === '2nd' || year === '2' ? 2 : year === '3rd' || year === '3' ? 3 : 4;
      params.push(yearNum);
    }

    if (section && section !== 'KEEP_EXISTING') {
      updates.push('section = ?');
      params.push(section);
    }

    if (updates.length === 0) {
      return Response.json({ success: true, updatedCount: 0 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const placeholders = studentIds.map(() => '?').join(',');
    const sqlParams = [...params, ...studentIds];

    const [res] = await query<any>(`
      UPDATE students
      SET ${updates.join(', ')}
      WHERE id IN (${placeholders})
    `, sqlParams);

    const updatedCount = (res as any)?.affectedRows || studentIds.length;
    return Response.json({ success: true, updatedCount });
  } catch (error: any) {
    console.error('bulk modify students error:', error);
    return Response.json({ error: 'Failed to bulk modify students' }, { status: 500 });
  }
}
