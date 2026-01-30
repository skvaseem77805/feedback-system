import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

function formatYear(year: number): string {
  const m: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: 'Final' };
  return m[year] ?? `${year}th`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pid = (id || '').trim();
    if (!pid) return Response.json({ error: 'Project ID required' }, { status: 400 });

    const { data: row, error } = await supabase
      .from('projects')
      .select(`
        *,
        students!inner ( name, year ),
        project_saves ( student_id ),
        project_collaborators ( student_id ),
        project_likes ( student_id )
      `)
      .eq('id', pid)
      .single();

    if (error || !row) {
      if (error && error.code !== 'PGRST116') console.error('Supabase error:', error);
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Map result
    // p.students is object
    const student = Array.isArray(row.students) ? row.students[0] : row.students;
    const savedBy = row.project_saves ? row.project_saves.map((s: any) => s.student_id) : [];
    const collaborators = row.project_collaborators ? row.project_collaborators.map((c: any) => c.student_id) : [];

    return Response.json({
      id: row.id,
      studentId: row.student_id,
      studentName: student?.name || 'Unknown',
      academicYear: formatYear(student?.year || 2),
      title: row.title,
      description: row.description || '',
      category: row.category || 'General',
      uploadedAt: row.uploaded_at,
      likes: row.likes || 0,
      thumbnailUrl: row.thumbnail_url,
      fileName: row.file_name,
      fileSize: row.file_size,
      savedBy,
      collaborators,
    });
  } catch (e) {
    console.error('GET /api/projects/[id]', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pid = (id || '').trim();
    if (!pid) return Response.json({ error: 'Project ID required' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const studentId = (body?.studentId ?? body?.student_id ?? '').trim();

    if (!studentId) return Response.json({ error: 'studentId required' }, { status: 400 });

    // Verify ownership
    const { data: projectRow, error: fetchError } = await supabase
      .from('projects')
      .select('student_id')
      .eq('id', pid)
      .single();

    if (fetchError || !projectRow) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    if (projectRow.student_id !== studentId) {
      return Response.json({ error: 'Not authorized to delete this project' }, { status: 403 });
    }

    // Delete related rows first, then the project
    await supabase.from('project_saves').delete().eq('project_id', pid);
    await supabase.from('project_collaborators').delete().eq('project_id', pid);
    await supabase.from('project_likes').delete().eq('project_id', pid);

    const { error: deleteError } = await supabase.from('projects').delete().eq('id', pid);
    if (deleteError) throw deleteError;

    // Decrement student's project count (best-effort)
    try {
      const { data: cur } = await supabase
        .from('student_stats')
        .select('projects_uploaded')
        .eq('student_id', studentId)
        .single();
      const curCount = (cur?.projects_uploaded ?? 0) - 1;
      await supabase
        .from('student_stats')
        .update({ projects_uploaded: Math.max(0, curCount) })
        .eq('student_id', studentId);
    } catch (e) {
      console.warn('Failed to update student stats after delete', e);
    }

    return Response.json({ deleted: true });
  } catch (e) {
    console.error('DELETE /api/projects/[id]', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
} 
