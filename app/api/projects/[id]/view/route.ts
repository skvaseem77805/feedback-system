import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { parseStudentId, parseViewerToken } from '@/lib/security';
import { invalidateProject, invalidateProjectsCache } from '@/lib/services/projects';

function ensureToken(value: unknown): string | null {
  return parseViewerToken(value) || null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json().catch(() => ({}));

    const studentId = parseStudentId(body?.studentId || body?.student_id) || '';
    const viewerToken = ensureToken(body?.viewerToken || body?.token);

    if (!projectId) {
      return Response.json({ error: 'projectId required' }, { status: 400 });
    }
    if (!viewerToken && !studentId) {
      return Response.json({ error: 'viewerToken or studentId required' }, { status: 400 });
    }

    const project = await queryOne<any>(
      `SELECT id FROM projects WHERE id = ?`,
      [projectId]
    );

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    try {
      await query(
        `
        INSERT IGNORE INTO project_views
        (project_id, viewer_token, viewer_student_id)
        VALUES (?, ?, ?)
        `,
        [projectId, viewerToken || '', studentId]
      );

      await query(
        `
        UPDATE projects p
        SET views = (
          SELECT COUNT(*) FROM project_views pv WHERE pv.project_id = p.id
        )
        WHERE p.id = ?
        `,
        [projectId]
      );
    } catch (e) {
      console.warn('Failed to update views count in DB:', e);
    }

    invalidateProject(projectId);
    invalidateProjectsCache();

    let views = 0;
    try {
      const row = await queryOne<any>(
        `SELECT views FROM projects WHERE id = ?`,
        [projectId]
      );
      views = Number(row?.views || 0);
    } catch (e) {
      console.warn('Failed to fetch views count from DB:', e);
    }

    return Response.json({ views });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
