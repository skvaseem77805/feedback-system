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

    const { error } = await supabase
      .from('project_saves')
      .upsert({ project_id: projectId, student_id: studentId }, { onConflict: 'project_id, student_id', ignoreDuplicates: true });

    if (error) throw error;

    return Response.json({ saved: true });
  } catch (e) {
    console.error('POST /api/projects/[id]/save', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
