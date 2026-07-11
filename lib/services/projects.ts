import { cache, cacheKey } from '@/lib/cache';
import { query } from '@/lib/db';

export async function getProjects(opts: { studentId?: string; category?: string; forUserId?: string; limit?: number; sort?: 'trending' | 'newest' } = {}) {
  const key = cacheKey('projects', opts);
  const cached = cache.get<any[]>(key);
  if (cached) return cached;

  let sql = `
      SELECT
        p.id,
        p.student_id,
        p.title,
        p.description,
        p.category,
        p.uploaded_at,
        p.likes,
        p.views,
        p.thumbnail_url,
        p.file_name,
        p.file_size,
        s.name AS student_name,
        s.year AS student_year,
        s.department AS student_department,
        GROUP_CONCAT(DISTINCT ps.student_id) AS saved_by,
        GROUP_CONCAT(DISTINCT pc.student_id) AS collaborators,
        GROUP_CONCAT(DISTINCT pl.student_id) AS liked_by
      FROM projects p
      INNER JOIN students s ON s.id = p.student_id
      LEFT JOIN project_saves ps ON ps.project_id = p.id
      LEFT JOIN project_collaborators pc ON pc.project_id = p.id
      LEFT JOIN project_likes pl ON pl.project_id = p.id
      WHERE 1=1
    `;

  const params: any[] = [];
  if (opts.studentId) {
    sql += ` AND p.student_id = ?`;
    params.push(opts.studentId);
  }
  if (opts.category) {
    sql += ` AND p.category = ?`;
    params.push(opts.category);
  }

  sql += ` GROUP BY p.id`;

  if (opts.sort === 'trending') {
    sql += ` ORDER BY (
      COALESCE(p.views, 0)
      + COALESCE(p.likes, 0) * 5
      + COUNT(DISTINCT ps.student_id) * 8
      + COUNT(DISTINCT pc.student_id) * 3
      + GREATEST(0, 30 - DATEDIFF(NOW(), p.uploaded_at)) * 4
    ) DESC, p.uploaded_at DESC`;
  } else {
    sql += ` ORDER BY p.uploaded_at DESC`;
  }

  if (typeof opts.limit === 'number') {
    sql += ` LIMIT ?`;
    params.push(Math.max(1, Math.min(100, opts.limit)));
  }

  let rows: any[] = [];
  try {
    const r = await query<any>(sql, params);
    rows = Array.isArray(r[0]) ? r[0] : r[0] ?? [];
  } catch (err) {
    console.error('getProjects DB error', err);
    cache.set(key, [], 15 * 1000);
    return [];
  }

  const transformed = rows.map((p: any) => {
    const savedBy = typeof p.saved_by === 'string' && p.saved_by.length ? p.saved_by.split(',') : [];
    const collaborators = typeof p.collaborators === 'string' && p.collaborators.length ? p.collaborators.split(',') : [];
    const likedBy = typeof p.liked_by === 'string' && p.liked_by.length ? p.liked_by.split(',') : [];

    return {
      id: p.id,
      studentId: p.student_id,
      studentName: p.student_name,
      academicYear: (() => { const m: Record<number,string>={1:'1st',2:'2nd',3:'3rd',4:'Final'}; return m[p.student_year] ?? `${p.student_year}th` })(),
      studentDepartment: p.student_department || '',
      title: p.title,
      description: p.description || '',
      category: p.category || 'General',
      uploadedAt: p.uploaded_at,
      likes: Number(p.likes) || 0,
      views: Number(p.views) || 0,
      thumbnailUrl: p.thumbnail_url,
      fileName: p.file_name,
      fileSize: p.file_size,
      savedBy,
      collaborators,
      userHasLiked: !!opts.forUserId && likedBy.includes(opts.forUserId),
    };
  });

  cache.set(key, transformed, 15 * 1000);
  return transformed;
}

export async function getProjectById(id: string, forUserId?: string) {
  const key = cacheKey('project', id);
  let project = cache.get<any>(key);

  if (!project) {
    const sql = `
      SELECT
        p.id,
        p.student_id,
        p.title,
        p.description,
        p.category,
        p.uploaded_at,
        p.likes,
        p.views,
        p.thumbnail_url,
        p.file_name,
        p.file_size,
        s.name AS student_name,
        s.year AS student_year,
        GROUP_CONCAT(DISTINCT ps.student_id) AS saved_by,
        GROUP_CONCAT(DISTINCT pc.student_id) AS collaborators,
        GROUP_CONCAT(DISTINCT pl.student_id) AS liked_by
      FROM projects p
      INNER JOIN students s ON s.id = p.student_id
      LEFT JOIN project_saves ps ON ps.project_id = p.id
      LEFT JOIN project_collaborators pc ON pc.project_id = p.id
      LEFT JOIN project_likes pl ON pl.project_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `;

    let row: any = null;
    try {
      const r = await query<any>(sql, [id]);
      row = Array.isArray(r[0]) ? r[0][0] : r[0]?.[0] ?? null;
    } catch (err) {
      console.error('getProjectById DB error', err);
      cache.set(key, null, 15 * 1000);
      return null;
    }

    if (!row) return null;

    const savedBy = typeof row.saved_by === 'string' && row.saved_by.length ? row.saved_by.split(',') : [];
    const collaborators = typeof row.collaborators === 'string' && row.collaborators.length ? row.collaborators.split(',') : [];
    const likedBy = typeof row.liked_by === 'string' && row.liked_by.length ? row.liked_by.split(',') : [];

    project = {
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      academicYear: (() => { const m: Record<number,string>={1:'1st',2:'2nd',3:'3rd',4:'Final'}; return m[row.student_year] ?? `${row.student_year}th` })(),
      title: row.title,
      description: row.description || '',
      category: row.category || 'General',
      uploadedAt: row.uploaded_at,
      likes: Number(row.likes) || 0,
      views: Number(row.views) || 0,
      thumbnailUrl: row.thumbnail_url,
      fileName: row.file_name,
      fileSize: row.file_size,
      savedBy,
      collaborators,
      likedBy,
    };
    cache.set(key, project, 15 * 1000);
  }

  return {
    ...project,
    userHasLiked: !!forUserId && project.likedBy?.includes(forUserId),
  };
}

export function invalidateProjectsCache() {
  cache.delPrefix('projects');
  cache.delPrefix('project');
}

export function invalidateProject(id: string) {
  cache.del(cacheKey('project', id));
  cache.delPrefix('projects');
}
