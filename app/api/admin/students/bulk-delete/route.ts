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

    if (!studentIds || studentIds.length === 0) {
      return Response.json({ error: 'No student IDs provided' }, { status: 400 });
    }

    const placeholders = studentIds.map(() => '?').join(',');

    // 1. Find projects owned by these students to clean up project dependencies
    const [projRows] = await query<any>(`
      SELECT id FROM projects WHERE student_id IN (${placeholders})
    `, studentIds);

    const projectIds = (projRows || []).map((p: any) => p.id).filter(Boolean);

    if (projectIds.length > 0) {
      const projPlaceholders = projectIds.map(() => '?').join(',');
      await query(`DELETE FROM project_likes WHERE project_id IN (${projPlaceholders})`, projectIds);
      await query(`DELETE FROM project_saves WHERE project_id IN (${projPlaceholders})`, projectIds);
      await query(`DELETE FROM project_collaborators WHERE project_id IN (${projPlaceholders})`, projectIds);
      await query(`DELETE FROM collaborators WHERE project_id IN (${projPlaceholders})`, projectIds);
      await query(`DELETE FROM projects WHERE id IN (${projPlaceholders})`, projectIds);
    }

    // 2. Clean up student relationships
    await query(`DELETE FROM project_likes WHERE student_id IN (${placeholders})`, studentIds);
    await query(`DELETE FROM project_saves WHERE student_id IN (${placeholders})`, studentIds);
    await query(`DELETE FROM project_collaborators WHERE student_id IN (${placeholders})`, studentIds);
    await query(`DELETE FROM collaborators WHERE student_id IN (${placeholders})`, studentIds);

    // 3. Delete from students, user_accounts, student_auth
    const [res] = await query<any>(`DELETE FROM students WHERE id IN (${placeholders})`, studentIds);
    const deletedCount = (res as any)?.affectedRows || 0;

    try {
      await query(`DELETE FROM user_accounts text WHERE id IN (${placeholders})`, studentIds);
      await query(`DELETE FROM student_auth WHERE student_id IN (${placeholders})`, studentIds);
    } catch {
      // ignore minor user_accounts deletion warnings if tables differ
    }

    return Response.json({ success: true, deletedCount });
  } catch (error: any) {
    console.error('bulk delete students error:', error);
    return Response.json({ error: 'Failed to bulk delete students' }, { status: 500 });
  }
}
