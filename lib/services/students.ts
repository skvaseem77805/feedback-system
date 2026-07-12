import { cache, cacheKey } from '@/lib/cache';
import { query } from '@/lib/db';

export async function getStudents(opts: { limit?: number; search?: string } = {}) {
  const key = cacheKey('students', opts);
  const cached = cache.get<any[]>(key);
  if (cached) return cached;

  const limit = opts.limit && opts.limit > 0 && opts.limit <= 100 ? opts.limit : 0;
  let sql = `
      SELECT
        s.*,
        ss.projects_uploaded,
        ss.connections,
        ss.collaborations
      FROM students s
      LEFT JOIN student_stats ss
      ON s.id = ss.student_id
      WHERE 1=1
    `;
  const params: any[] = [];

  if (opts.search) {
    sql += ` AND (s.name LIKE ? OR s.department LIKE ? OR s.email LIKE ? OR s.id LIKE ? OR s.registration_no LIKE ?)`;
    const likeValue = `%${opts.search}%`;
    params.push(likeValue, likeValue, likeValue, likeValue, likeValue);
  }

  sql += ` ORDER BY s.name`;
  if (limit > 0) sql += ` LIMIT ${Number(limit)}`;

  let rows: any[] = [];
  try {
    const r = await query<any>(sql, params);
    rows = Array.isArray(r[0]) ? r[0] : r[0] ?? [];
  } catch (err) {
    console.error('getStudents DB error', err);
    cache.set(key, [], 30 * 1000);
    return [];
  }

  const students = rows.map((s: any) => {
    let skills: string[] = [];

    if (s.skills) {
      try {
        skills = typeof s.skills === 'string' ? JSON.parse(s.skills) : s.skills;
      } catch {
        skills = [];
      }
    }

    return {
      id: s.id,
      userId: s.id,
      name: s.name,
      registrationNo: s.registration_no,
      uniqueId: s.unique_id,
      year: s.year,
      course: s.course,
      email: s.email || '',
      mobileNo: s.mobile_no || '',
      department: s.department || 'CSE',
      section: s.section || 'E',
      linkedinUrl: s.linkedin_url ?? undefined,
      githubUrl: s.github_url ?? undefined,
      bio: s.bio ?? undefined,
      skills,
      avatar: s.avatar ?? undefined,
      academicYear: (() => {
        const m: Record<number, string> = {1:'1st',2:'2nd',3:'3rd',4:'Final'};
        return m[s.year] ?? `${s.year}th`;
      })(),
      projectsUploaded: Number(s.projects_uploaded) || 0,
      connectionsCount: Number(s.connections) || 0,
      collaborationsCount: Number(s.collaborations) || 0,
    };
  });

  cache.set(key, students, 30 * 1000);
  return students;
}

export async function getStudentById(id: string) {
  const key = cacheKey('student', id);
  const cached = cache.get<any>(key);
  if (cached) return cached;

  const rowSql = `
    SELECT
      id,
      name,
      registration_no,
      unique_id,
      year,
      course,
      email,
      mobile_no,
      department,
      section,
      linkedin_url,
      github_url,
      bio,
      skills,
      avatar
    FROM students
    WHERE id = ?
    LIMIT 1
  `;

  let row: any = null;
  try {
    const r = await query<any>(rowSql, [id]);
    row = Array.isArray(r[0]) ? r[0][0] : r[0]?.[0] ?? null;
  } catch (err) {
    console.error('getStudentById DB error', err);
    cache.set(key, null, 60 * 1000);
    return null;
  }

  if (!row) return null;

  let skills: string[] = [];
  if (row.skills) {
    try { skills = typeof row.skills === 'string' ? JSON.parse(row.skills) : row.skills; } catch { skills = []; }
  }

  const student = {
    id: row.id,
    userId: row.id,
    name: row.name,
    registrationNo: row.registration_no,
    uniqueId: row.unique_id,
    year: row.year,
    course: row.course,
    email: row.email || '',
    mobileNo: row.mobile_no || '',
    department: row.department || 'CSE',
    section: row.section || 'E',
    linkedinUrl: row.linkedin_url ?? undefined,
    githubUrl: row.github_url ?? undefined,
    bio: row.bio ?? undefined,
    skills,
    avatar: row.avatar ?? undefined,
    academicYear: (() => { const m: Record<number,string>={1:'1st',2:'2nd',3:'3rd',4:'Final'}; return m[row.year] ?? `${row.year}th` })(),
  };

  cache.set(key, student, 60 * 1000);
  return student;
}

export function invalidateStudentsCache() {
  cache.delPrefix('students');
}

export function invalidateStudent(id: string) {
  cache.del(cacheKey('student', id));
}
