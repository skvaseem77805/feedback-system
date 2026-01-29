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
