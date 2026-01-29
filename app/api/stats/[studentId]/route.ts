import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';

/**
 * GET /api/stats/[studentId]
 * Returns { projectsUploaded, connections, collaborations }.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const sid = (studentId || '').trim();
    if (!sid) return Response.json({ error: 'studentId required' }, { status: 400 });

    const row = await queryOne<{
      projects_uploaded: number;
      connections: number;
      collaborations: number;
    }>(
      `SELECT projects_uploaded, connections, collaborations FROM student_stats WHERE student_id = ?`,
      [sid]
    );
    if (!row) return Response.json({ projectsUploaded: 0, connections: 0, collaborations: 0 });
    return Response.json({
      projectsUploaded: Number(row.projects_uploaded) || 0,
      connections: Number(row.connections) || 0,
      collaborations: Number(row.collaborations) || 0,
    });
  } catch (e) {
    console.error('GET /api/stats/[studentId]', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/stats/[studentId]
 * Body: { projectsUploaded?, connections?, collaborations? } (increments)
 * Or { set: { projectsUploaded, connections, collaborations } } to set absolute values.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const sid = (studentId || '').trim();
    if (!sid) return Response.json({ error: 'studentId required' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const set = body?.set;
    if (set && typeof set === 'object') {
      const p = Number(set.projectsUploaded);
      const c = Number(set.connections);
      const col = Number(set.collaborations);
      await query(
        `INSERT INTO student_stats (student_id, projects_uploaded, connections, collaborations)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           projects_uploaded = VALUES(projects_uploaded),
           connections = VALUES(connections),
           collaborations = VALUES(collaborations)`,
        [sid, isNaN(p) ? 0 : p, isNaN(c) ? 0 : c, isNaN(col) ? 0 : col]
      );
    } else {
      const inc = { projectsUploaded: 0, connections: 0, collaborations: 0 };
      if (typeof body?.projectsUploaded === 'number') inc.projectsUploaded = body.projectsUploaded;
      if (typeof body?.connections === 'number') inc.connections = body.connections;
      if (typeof body?.collaborations === 'number') inc.collaborations = body.collaborations;
      if (inc.projectsUploaded === 0 && inc.connections === 0 && inc.collaborations === 0) {
        return Response.json({ error: 'Provide projectsUploaded, connections, or collaborations to increment' }, { status: 400 });
      }
      await query(
        `INSERT INTO student_stats (student_id, projects_uploaded, connections, collaborations)
         VALUES (?, 0, 0, 0)
         ON DUPLICATE KEY UPDATE
           projects_uploaded = projects_uploaded + ?,
           connections = connections + ?,
           collaborations = collaborations + ?`,
        [sid, inc.projectsUploaded, inc.connections, inc.collaborations]
      );
    }

    const row = await queryOne<{ projects_uploaded: number; connections: number; collaborations: number }>(
      `SELECT projects_uploaded, connections, collaborations FROM student_stats WHERE student_id = ?`,
      [sid]
    );
    if (!row) return Response.json({ projectsUploaded: 0, connections: 0, collaborations: 0 });
    return Response.json({
      projectsUploaded: Number(row.projects_uploaded) || 0,
      connections: Number(row.connections) || 0,
      collaborations: Number(row.collaborations) || 0,
    });
  } catch (e) {
    console.error('PATCH /api/stats/[studentId]', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
