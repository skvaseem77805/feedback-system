import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';

function formatYear(year: number): string {
  const m: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: 'Final' };
  return m[year] ?? `${year}th`;
}

function mapProjectRow(r: {
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
}) {
  return {
    id: r.id,
    studentId: r.student_id,
    studentName: r.student_name,
    academicYear: formatYear(r.student_year),
    title: r.title,
    description: r.description || '',
    category: r.category || 'General',
    uploadedAt: r.uploaded_at,
    likes: Number(r.likes) || 0,
    thumbnailUrl: r.thumbnail_url ?? undefined,
    fileName: r.file_name ?? undefined,
    fileSize: r.file_size ?? undefined,
    savedBy: r.saved_by ? r.saved_by.split(',').map((s) => s.trim()).filter(Boolean) : [],
    collaborators: r.collaborators ? r.collaborators.split(',').map((s) => s.trim()).filter(Boolean) : [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterStudentId = searchParams.get('studentId')?.trim();
    const category = searchParams.get('category')?.trim();
    const forUserId = searchParams.get('forUserId')?.trim();

    let sql = `
      SELECT p.id, p.student_id, s.name AS student_name, s.year AS student_year, p.title, p.description, p.category, p.uploaded_at, p.likes, p.thumbnail_url, p.file_name, p.file_size,
        (SELECT GROUP_CONCAT(ps.student_id) FROM project_saves ps WHERE ps.project_id = p.id) AS saved_by,
        (SELECT GROUP_CONCAT(pc.student_id) FROM project_collaborators pc WHERE pc.project_id = p.id) AS collaborators
        ${forUserId ? `, (SELECT 1 FROM project_likes pl WHERE pl.project_id = p.id AND pl.student_id = ? LIMIT 1) AS user_has_liked` : ''}
      FROM projects p
      JOIN students s ON s.id = p.student_id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    if (forUserId) params.push(forUserId);
    if (filterStudentId) {
      sql += ' AND p.student_id = ?';
      params.push(filterStudentId);
    }
    if (category) {
      sql += ' AND p.category = ?';
      params.push(category);
    }
    sql += ' ORDER BY p.uploaded_at DESC';

    const [rows] = await query<{
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
      user_has_liked?: number | null;
    }>(sql, params);
    const list = Array.isArray(rows) ? rows : [];
    const mapped = list.map((r) => {
      const out = mapProjectRow(r);
      return { ...out, userHasLiked: forUserId && r.user_has_liked ? true : false };
    });
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

    await query(
      `INSERT INTO projects (id, student_id, title, description, category, likes, file_name, file_size) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, sid, String(title).trim(), desc, cat, fn, fs]
    );
    await query(
      `INSERT INTO project_collaborators (project_id, student_id) VALUES (?, ?)`,
      [id, sid]
    );
    await query(
      `INSERT INTO student_stats (student_id, projects_uploaded, connections, collaborations) VALUES (?, 1, 0, 0)
       ON DUPLICATE KEY UPDATE projects_uploaded = projects_uploaded + 1`,
      [sid]
    );
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
      [id]
    );
    if (!row) {
      return Response.json({ id, studentId: sid, title: String(title).trim(), description: desc, category: cat, likes: 0, uploadedAt: new Date(), savedBy: [], collaborators: [] });
    }
    const name = studentName && String(studentName).trim() ? String(studentName) : row.student_name;
    return Response.json(
      mapProjectRow({ ...row, student_name: name })
    );
  } catch (e) {
    console.error('POST /api/projects', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
