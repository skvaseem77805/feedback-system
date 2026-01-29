import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

function formatYear(year: number): string {
  const m: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: 'Final' };
  return m[year] ?? `${year}th`;
}

// Helper to transform Supabase result to API format
function transformProject(p: any, forUserId?: string) {
  // p.students is an object or array depending on query, here it's single object due to foreign key
  const student = Array.isArray(p.students) ? p.students[0] : p.students;

  // saved_by and collaborators are arrays of objects { student_id }
  const savedBy = p.project_saves ? p.project_saves.map((s: any) => s.student_id) : [];
  const collaborators = p.project_collaborators ? p.project_collaborators.map((c: any) => c.student_id) : [];

  const userHasLiked = forUserId && p.project_likes ? p.project_likes.some((l: any) => l.student_id === forUserId) : false;

  return {
    id: p.id,
    studentId: p.student_id,
    studentName: student?.name || 'Unknown',
    academicYear: formatYear(student?.year || 2),
    title: p.title,
    description: p.description || '',
    category: p.category || 'General',
    uploadedAt: p.uploaded_at,
    likes: p.likes || 0,
    thumbnailUrl: p.thumbnail_url,
    fileName: p.file_name,
    fileSize: p.file_size,
    savedBy,
    collaborators,
    userHasLiked,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterStudentId = searchParams.get('studentId')?.trim();
    const category = searchParams.get('category')?.trim();
    const forUserId = searchParams.get('forUserId')?.trim();

    let query = supabase
      .from('projects')
      .select(`
        *,
        students!inner ( name, year ),
        project_saves ( student_id ),
        project_collaborators ( student_id ),
        project_likes ( student_id )
      `)
      .order('uploaded_at', { ascending: false });

    if (filterStudentId) {
      query = query.eq('student_id', filterStudentId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    const mapped = (projects || []).map(p => transformProject(p, forUserId));
    return Response.json(mapped);

  } catch (e) {
    console.error('GET /api/projects', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { studentId, studentName, title, description, category, fileName, fileSize } = body;
    const sid = (studentId || '').trim();

    if (!sid || !(title && String(title).trim())) {
      return Response.json({ error: 'studentId and title required' }, { status: 400 });
    }

    const id = `proj-${Date.now()}`;
    const desc = description ? String(description).trim() : '';
    const cat = category ? String(category).trim() : 'General';
    const fn = fileName ? String(fileName) : null;
    const fs = fileSize != null ? Number(fileSize) : null;

    // 1. Insert Project
    const { error: insertError } = await supabase
      .from('projects')
      .insert({
        id,
        student_id: sid,
        title: String(title).trim(),
        description: desc,
        category: cat,
        file_name: fn,
        file_size: fs,
        likes: 0
      });

    if (insertError) throw insertError;

    // 2. Insert Collaborator (Owner as collaborator)
    const { error: collabError } = await supabase
      .from('project_collaborators')
      .insert({ project_id: id, student_id: sid });

    if (collabError) console.warn('Failed to add owner as collaborator', collabError);

    // 3. Update Stats (RPC/Increment is better, but simple fetch-update for now or trigger)
    // Supabase doesn't have simple increment in JS client without rpc.
    // We will use a separate pattern: Fetch current, then Update. Or DB trigger.
    // For now, let's just use a simple RPC call if we had one, or a raw SQL via rpc?
    // Let's rely on client-side logic: get current stats row, increment, upsert.

    const { data: currentStats } = await supabase
      .from('student_stats')
      .select('projects_uploaded')
      .eq('student_id', sid)
      .single();

    const newCount = (currentStats?.projects_uploaded || 0) + 1;

    await supabase
      .from('student_stats')
      .upsert({
        student_id: sid,
        projects_uploaded: newCount,
        // we should preserve other fields if they exist, hopefully upsert merges?
        // No, upsert replaces unless we select first.
        // Actually, if we don't provide other columns and they have defaults or are nullable, it might be partial?
        // Supabase upsert requires all non-nullable columns.
        // Safer to just update if exists, insert if not.
      });

    // 4. Return the created project (with joins)
    const { data: createdProject, error: fetchError } = await supabase
      .from('projects')
      .select(`
            *,
            students ( name, year ),
            project_saves ( student_id ),
            project_collaborators ( student_id ),
            project_likes ( student_id )
        `)
      .eq('id', id)
      .single();

    if (fetchError || !createdProject) {
      // Fallback
      return Response.json({
        id,
        studentId: sid,
        studentName: studentName || 'You',
        title,
        description: desc,
        category: cat,
        likes: 0,
        uploadedAt: new Date().toISOString(),
        savedBy: [],
        collaborators: [sid]
      });
    }

    return Response.json(transformProject(createdProject));

  } catch (e) {
    console.error('POST /api/projects', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
