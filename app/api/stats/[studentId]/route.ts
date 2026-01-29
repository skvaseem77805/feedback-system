import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    const { data: row } = await supabase
      .from('student_stats')
      .select('projects_uploaded, connections, collaborations')
      .eq('student_id', sid)
      .single();

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

    let targetProjectsUploaded = 0;
    let targetConnections = 0;
    let targetCollaborations = 0;

    if (set && typeof set === 'object') {
      // Set absolute values
      targetProjectsUploaded = Number(set.projectsUploaded) || 0;
      targetConnections = Number(set.connections) || 0;
      targetCollaborations = Number(set.collaborations) || 0;
    } else {
      // Increment logic
      // 1. Fetch current
      const { data: current } = await supabase
        .from('student_stats')
        .select('projects_uploaded, connections, collaborations')
        .eq('student_id', sid)
        .single();

      const curP = current?.projects_uploaded || 0;
      const curC = current?.connections || 0;
      const curCol = current?.collaborations || 0;

      const incP = Number(body?.projectsUploaded) || 0;
      const incC = Number(body?.connections) || 0;
      const incCol = Number(body?.collaborations) || 0;

      if (incP === 0 && incC === 0 && incCol === 0) {
        return Response.json({ error: 'Provide projectsUploaded, connections, or collaborations to increment' }, { status: 400 });
      }

      targetProjectsUploaded = curP + incP;
      targetConnections = curC + incC;
      targetCollaborations = curCol + incCol;
    }

    // 2. Upsert
    const { data: updated, error } = await supabase
      .from('student_stats')
      .upsert({
        student_id: sid,
        projects_uploaded: targetProjectsUploaded,
        connections: targetConnections,
        collaborations: targetCollaborations,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error || !updated) throw error || new Error('Upsert failed');

    return Response.json({
      projectsUploaded: Number(updated.projects_uploaded) || 0,
      connections: Number(updated.connections) || 0,
      collaborations: Number(updated.collaborations) || 0,
    });
  } catch (e) {
    console.error('PATCH /api/stats/[studentId]', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
