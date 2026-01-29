import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';

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

    const row = await queryOne<{
      id: string;
      student_id: string;
      student_name: string;
      student_year: number;
      title: string;
      description: string | null;
      category: string;
      uploaded_at: Date;
      likes: number;
      thumbnail_url: string | null;
      file_name: string | null;
      file_size: number | null;
      saved_by: string | null;
      collaborators: string | null;
    }>(
      `SELECT p.id, p.student_id, s.name AS student_name, s.year AS student_year, p.title, p.description, p.category, p.uploaded_at, p.likes, p.thumbnail_url, p.file_name, p.file_size,
        (SELECT GROUP_CONCAT(ps.student_id) FROM project_saves ps WHERE ps.project_id = p.id) AS saved_by,
        (SELECT GROUP_CONCAT(pc.student_id) FROM project_collaborators pc WHERE pc.project_id = p.id) AS collaborators
      FROM projects p JOIN students s ON s.id = p.student_id WHERE p.id = ?`,
      [pid]
    );
    if (!row) return Response.json({ error: 'Project not found' }, { status: 404 });

    return Response.json({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      academicYear: formatYear(row.student_year),
      title: row.title,
      description: row.description || '',
      category: row.category || 'General',
      uploadedAt: row.uploaded_at,
      likes: Number(row.likes) || 0,
      thumbnailUrl: row.thumbnail_url ?? undefined,
      fileName: row.file_name ?? undefined,
      fileSize: row.file_size ?? undefined,
      savedBy: row.saved_by ? row.saved_by.split(',').map((s) => s.trim()).filter(Boolean) : [],
      collaborators: row.collaborators ? row.collaborators.split(',').map((s) => s.trim()).filter(Boolean) : [],
    });
  } catch (e) {
    console.error('GET /api/projects/[id]', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
