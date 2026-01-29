import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json().catch(() => ({}));
    const studentId = (body?.studentId ?? body?.student_id ?? '').trim();
    if (!projectId || !studentId) {
      return Response.json({ error: 'projectId and studentId required' }, { status: 400 });
    }

    // Check existing
    const { data: existing, error: checkError } = await supabase
      .from('project_collaborators')
      .select('student_id')
      .eq('project_id', projectId)
      .eq('student_id', studentId)
      .single();

    if (existing) {
      return Response.json({ joined: false, already: true });
    }

    // Insert
    const { error: insertError } = await supabase
      .from('project_collaborators')
      .insert({ project_id: projectId, student_id: studentId });

    if (insertError) throw insertError;

    // Update stats: collaborations + 1
    // Fetch first to get current count (no atomic increment in JS client)
    const { data: stats } = await supabase
      .from('student_stats')
      .select('collaborations')
      .eq('student_id', studentId)
      .single();

    const newCollabCount = (stats?.collaborations || 0) + 1;

    await supabase
      .from('student_stats')
      .upsert({ student_id: studentId, collaborations: newCollabCount });

    return Response.json({ joined: true });
  } catch (e) {
    console.error('POST /api/projects/[id]/join', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
