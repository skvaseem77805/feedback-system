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

    // 1. Insert Like (ignore duplicates)
    const { error: insertError } = await supabase
      .from('project_likes')
      .upsert({ project_id: projectId, student_id: studentId }, { onConflict: 'project_id, student_id', ignoreDuplicates: true });

    if (insertError) throw insertError;

    // 2. Count likes
    const { count, error: countError } = await supabase
      .from('project_likes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (countError) throw countError;
    const newCount = count || 0;

    // 3. Update project like count (optional but good for performance)
    await supabase
      .from('projects')
      .update({ likes: newCount })
      .eq('id', projectId);

    return Response.json({ liked: true, likes: newCount });
  } catch (e) {
    console.error('POST /api/projects/[id]/like', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
