import { query, queryOne } from '@/lib/db';
import { invalidateProjectsCache, invalidateProject } from '@/lib/services/projects';

export interface AdminProjectFilter {
  search?: string;
  fromDate?: string;
  toDate?: string;
  month?: string;
  year?: string;
  department?: string;
  section?: string;
  category?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function getProjectFilterOptions() {
  await ensureAdminProjectTables();

  const [branchRows] = await query<any>(`
    SELECT DISTINCT s.department
    FROM students s
    INNER JOIN projects p ON p.student_id = s.id
    WHERE s.department IS NOT NULL AND TRIM(s.department) != ''
    ORDER BY s.department ASC
  `);

  const [sectionRows] = await query<any>(`
    SELECT DISTINCT s.section
    FROM students s
    INNER JOIN projects p ON p.student_id = s.id
    WHERE s.section IS NOT NULL AND TRIM(s.section) != ''
    ORDER BY s.section ASC
  `);

  const branches = (branchRows || []).map((r: any) => String(r.department).trim()).filter(Boolean);
  const sections = (sectionRows || []).map((r: any) => String(r.section).trim()).filter(Boolean);

  return {
    branches: Array.from(new Set<string>(branches)).sort((a, b) => a.localeCompare(b)),
    sections: Array.from(new Set<string>(sections)).sort((a, b) => a.localeCompare(b))
  };
}

let tablesInitialized = false;

export async function ensureAdminProjectTables() {
  if (tablesInitialized) return;
  try {
    // 1. Ensure project_activity_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS project_activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id VARCHAR(64) NULL,
        project_title VARCHAR(255) NULL,
        admin_email VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Ensure columns on projects table
    const safeAdd = async (colDef: string) => {
      try {
        await query(`ALTER TABLE projects ADD COLUMN ${colDef}`);
      } catch {
        // column exists
      }
    };

    await safeAdd(`is_featured TINYINT DEFAULT 0`);
    await safeAdd(`status VARCHAR(50) DEFAULT 'published'`);
    await safeAdd(`visibility VARCHAR(50) DEFAULT 'public'`);
    await safeAdd(`github_link VARCHAR(500) NULL`);
    await safeAdd(`demo_link VARCHAR(500) NULL`);
    await safeAdd(`tech_stack VARCHAR(500) NULL`);

    tablesInitialized = true;
  } catch (err) {
    console.warn('ensureAdminProjectTables warning:', err);
  }
}

export async function logAdminProjectAction(
  projectId: string | null,
  projectTitle: string | null,
  adminEmail: string,
  action: string,
  details?: string
) {
  await ensureAdminProjectTables();
  try {
    await query(`
      INSERT INTO project_activity_logs (project_id, project_title, admin_email, action, details, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [projectId, projectTitle, adminEmail, action, details || null]);
  } catch (err) {
    console.warn('logAdminProjectAction warning:', err);
  }
}

export async function getAdminProjectStats(filter: AdminProjectFilter) {
  await ensureAdminProjectTables();

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (filter.fromDate) {
    where += ' AND p.uploaded_at >= ?';
    params.push(`${filter.fromDate} 00:00:00`);
  }
  if (filter.toDate) {
    where += ' AND p.uploaded_at <= ?';
    params.push(`${filter.toDate} 23:59:59`);
  }
  if (filter.year) {
    where += ' AND YEAR(p.uploaded_at) = ?';
    params.push(filter.year);
  }
  if (filter.month) {
    where += ' AND MONTH(p.uploaded_at) = ?';
    params.push(filter.month);
  }
  if (filter.department) {
    where += ' AND s.department = ?';
    params.push(filter.department);
  }
  if (filter.section) {
    where += ' AND s.section = ?';
    params.push(filter.section);
  }
  if (filter.category) {
    where += ' AND p.category = ?';
    params.push(filter.category);
  }

  // Total Projects
  const [totalRows] = await query<any>(`
    SELECT COUNT(*) as count, COALESCE(SUM(p.views), 0) as views, COALESCE(SUM(p.likes), 0) as likes
    FROM projects p
    INNER JOIN students s ON s.id = p.student_id
    ${where}
  `, params);
  const totalProjects = Number(totalRows?.[0]?.count || 0);
  const totalViews = Number(totalRows?.[0]?.views || 0);
  const totalLikes = Number(totalRows?.[0]?.likes || 0);

  // Published
  const [pubRows] = await query<any>(`
    SELECT COUNT(*) as count FROM projects p
    INNER JOIN students s ON s.id = p.student_id
    ${where} AND (p.status = 'published' OR p.status IS NULL OR p.status = '')
  `, params);
  const publishedProjects = Number(pubRows?.[0]?.count || 0);

  // Featured
  const [featRows] = await query<any>(`
    SELECT COUNT(*) as count FROM projects p
    INNER JOIN students s ON s.id = p.student_id
    ${where} AND p.is_featured = 1
  `, params);
  const featuredProjects = Number(featRows?.[0]?.count || 0);

  // Hidden
  const [hiddenRows] = await query<any>(`
    SELECT COUNT(*) as count FROM projects p
    INNER JOIN students s ON s.id = p.student_id
    ${where} AND (p.visibility = 'hidden' OR p.status = 'hidden' OR p.visibility = 'private')
  `, params);
  const hiddenProjects = Number(hiddenRows?.[0]?.count || 0);

  // Today Uploads
  const todayStr = new Date().toISOString().slice(0, 10);
  const [todayRows] = await query<any>(`
    SELECT COUNT(*) as count FROM projects p
    WHERE DATE(p.uploaded_at) = ?
  `, [todayStr]);
  const todayUploads = Number(todayRows?.[0]?.count || 0);

  // This Month Uploads
  const now = new Date();
  const [monthRows] = await query<any>(`
    SELECT COUNT(*) as count FROM projects p
    WHERE YEAR(p.uploaded_at) = ? AND MONTH(p.uploaded_at) = ?
  `, [now.getFullYear(), now.getMonth() + 1]);
  const thisMonthUploads = Number(monthRows?.[0]?.count || 0);

  // Daily Uploads Chart Series
  const [dailyRows] = await query<any>(`
    SELECT 
      DATE_FORMAT(p.uploaded_at, '%Y-%m-%d') as date,
      COUNT(*) as count
    FROM projects p
    INNER JOIN students s ON s.id = p.student_id
    ${where}
    GROUP BY DATE_FORMAT(p.uploaded_at, '%Y-%m-%d')
    ORDER BY date ASC
    LIMIT 30
  `, params);
  const dailyUploads = (dailyRows || []).map((r: any) => ({
    date: r.date,
    count: Number(r.count || 0)
  }));

  // Top 10 Most Viewed Projects
  const [topViewedRows] = await query<any>(`
    SELECT p.id, p.title, p.category, p.views, p.likes, s.name as studentName, s.registration_no as regNo
    FROM projects p
    INNER JOIN students s ON s.id = p.student_id
    ${where}
    ORDER BY p.views DESC
    LIMIT 10
  `, params);

  // Top 10 Most Liked Projects
  const [topLikedRows] = await query<any>(`
    SELECT p.id, p.title, p.category, p.views, p.likes, s.name as studentName, s.registration_no as regNo
    FROM projects p
    INNER JOIN students s ON s.id = p.student_id
    ${where}
    ORDER BY p.likes DESC
    LIMIT 10
  `, params);

  return {
    totalProjects,
    publishedProjects,
    featuredProjects,
    hiddenProjects,
    totalViews,
    totalLikes,
    todayUploads,
    thisMonthUploads,
    dailyUploads,
    topViewed: topViewedRows || [],
    topLiked: topLikedRows || []
  };
}

export async function getAdminProjects(filter: AdminProjectFilter) {
  await ensureAdminProjectTables();

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (filter.search) {
    where += ' AND (p.title LIKE ? OR p.description LIKE ? OR s.name LIKE ? OR s.registration_no LIKE ? OR p.id LIKE ?)';
    const s = `%${filter.search}%`;
    params.push(s, s, s, s, s);
  }

  if (filter.fromDate) {
    where += ' AND p.uploaded_at >= ?';
    params.push(`${filter.fromDate} 00:00:00`);
  }
  if (filter.toDate) {
    where += ' AND p.uploaded_at <= ?';
    params.push(`${filter.toDate} 23:59:59`);
  }
  if (filter.year) {
    where += ' AND YEAR(p.uploaded_at) = ?';
    params.push(filter.year);
  }
  if (filter.month) {
    where += ' AND MONTH(p.uploaded_at) = ?';
    params.push(filter.month);
  }
  if (filter.department) {
    where += ' AND s.department = ?';
    params.push(filter.department);
  }
  if (filter.section) {
    where += ' AND s.section = ?';
    params.push(filter.section);
  }
  if (filter.category) {
    where += ' AND p.category = ?';
    params.push(filter.category);
  }
  if (filter.status) {
    if (filter.status === 'featured') {
      where += ' AND p.is_featured = 1';
    } else if (filter.status === 'hidden') {
      where += ' AND (p.visibility = "hidden" OR p.status = "hidden")';
    } else {
      where += ' AND p.status = ?';
      params.push(filter.status);
    }
  }

  // Count total for pagination
  const [countRows] = await query<any>(`
    SELECT COUNT(*) as count
    FROM projects p
    INNER JOIN students s ON s.id = p.student_id
    ${where}
  `, params);
  const totalItems = Number(countRows?.[0]?.count || 0);

  const page = Math.max(1, filter.page || 1);
  const pageSize = Math.max(1, filter.pageSize || 10);
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const offset = (page - 1) * pageSize;

  const [rows] = await query<any>(`
    SELECT 
      p.id,
      p.student_id as studentId,
      p.title,
      p.description,
      p.category,
      p.uploaded_at as uploadedAt,
      COALESCE(p.likes, 0) as likes,
      COALESCE(p.views, 0) as views,
      p.thumbnail_url as thumbnailUrl,
      p.image_urls as imageUrls,
      p.file_name as fileName,
      p.github_link as githubLink,
      p.demo_link as demoLink,
      p.tech_stack as techStack,
      COALESCE(p.is_featured, 0) as isFeatured,
      COALESCE(p.status, 'published') as status,
      COALESCE(p.visibility, 'public') as visibility,
      s.name as studentName,
      s.registration_no as registrationNo,
      s.department as studentDepartment,
      s.year as studentYear,
      s.email as studentEmail
    FROM projects p
    INNER JOIN students s ON s.id = p.student_id
    ${where}
    ORDER BY p.uploaded_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset]);

  return {
    projects: rows || [],
    totalItems,
    totalPages,
    page,
    pageSize
  };
}

export async function updateAdminProject(
  id: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    department?: string;
    githubLink?: string;
    demoLink?: string;
    status?: string;
    visibility?: string;
    isFeatured?: boolean | number;
  },
  adminEmail: string
) {
  await ensureAdminProjectTables();

  const updates: string[] = [];
  const params: any[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    params.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.category !== undefined) {
    updates.push('category = ?');
    params.push(data.category);
  }
  if (data.githubLink !== undefined) {
    updates.push('github_link = ?');
    params.push(data.githubLink);
  }
  if (data.demoLink !== undefined) {
    updates.push('demo_link = ?');
    params.push(data.demoLink);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }
  if (data.visibility !== undefined) {
    updates.push('visibility = ?');
    params.push(data.visibility);
  }
  if (data.isFeatured !== undefined) {
    updates.push('is_featured = ?');
    params.push(data.isFeatured ? 1 : 0);
  }

  if (updates.length > 0) {
    params.push(id);
    await query(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  // If department was specified, update student's department if requested
  if (data.department) {
    await query(`
      UPDATE students s
      INNER JOIN projects p ON p.student_id = s.id
      SET s.department = ?
      WHERE p.id = ?
    `, [data.department, id]);
  }

  await logAdminProjectAction(id, data.title || null, adminEmail, 'Project Edited', JSON.stringify(data));
  await invalidateProject(id);
  await invalidateProjectsCache();

  return { success: true };
}

export async function deleteAdminProject(id: string, adminEmail: string) {
  await ensureAdminProjectTables();

  const [proj] = await query<any>(`SELECT title FROM projects WHERE id = ?`, [id]);
  const title = proj?.[0]?.title || id;

  await query(`DELETE FROM project_likes WHERE project_id = ?`, [id]);
  await query(`DELETE FROM project_saves WHERE project_id = ?`, [id]);
  await query(`DELETE FROM project_collaborators WHERE project_id = ?`, [id]);
  await query(`DELETE FROM collaborators WHERE project_id = ?`, [id]);
  await query(`DELETE FROM projects WHERE id = ?`, [id]);

  await logAdminProjectAction(id, title, adminEmail, 'Project Deleted', `Deleted project ID ${id}`);
  await invalidateProject(id);
  await invalidateProjectsCache();

  return { success: true };
}

export async function bulkDeleteAdminProjects(projectIds: string[], adminEmail: string) {
  await ensureAdminProjectTables();
  if (!projectIds || projectIds.length === 0) return { deletedCount: 0 };

  const placeholders = projectIds.map(() => '?').join(',');

  await query(`DELETE FROM project_likes WHERE project_id IN (${placeholders})`, projectIds);
  await query(`DELETE FROM project_saves WHERE project_id IN (${placeholders})`, projectIds);
  await query(`DELETE FROM project_collaborators WHERE project_id IN (${placeholders})`, projectIds);
  await query(`DELETE FROM collaborators WHERE project_id IN (${placeholders})`, projectIds);
  const [res] = await query<any>(`DELETE FROM projects WHERE id IN (${placeholders})`, projectIds);

  const deletedCount = (res as any)?.affectedRows || 0;
  await logAdminProjectAction(null, null, adminEmail, 'Bulk Delete', `Deleted ${deletedCount} project(s)`);
  await invalidateProjectsCache();

  return { deletedCount };
}

export async function bulkModifyAdminProjects(
  projectIds: string[],
  updates: {
    department?: string;
    category?: string;
    status?: string;
    visibility?: string;
    isFeatured?: string;
  },
  adminEmail: string
) {
  await ensureAdminProjectTables();
  if (!projectIds || projectIds.length === 0) return { updatedCount: 0 };

  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.category && updates.category !== 'KEEP_EXISTING') {
    setClauses.push('category = ?');
    params.push(updates.category);
  }
  if (updates.status && updates.status !== 'KEEP_EXISTING') {
    setClauses.push('status = ?');
    params.push(updates.status);
  }
  if (updates.visibility && updates.visibility !== 'KEEP_EXISTING') {
    setClauses.push('visibility = ?');
    params.push(updates.visibility);
  }
  if (updates.isFeatured && updates.isFeatured !== 'KEEP_EXISTING') {
    setClauses.push('is_featured = ?');
    params.push(updates.isFeatured === 'true' || updates.isFeatured === '1' ? 1 : 0);
  }

  if (setClauses.length > 0) {
    const placeholders = projectIds.map(() => '?').join(',');
    const sqlParams = [...params, ...projectIds];
    await query(`UPDATE projects SET ${setClauses.join(', ')} WHERE id IN (${placeholders})`, sqlParams);
  }

  if (updates.department && updates.department !== 'KEEP_EXISTING') {
    const placeholders = projectIds.map(() => '?').join(',');
    await query(`
      UPDATE students s
      INNER JOIN projects p ON p.student_id = s.id
      SET s.department = ?
      WHERE p.id IN (${placeholders})
    `, [updates.department, ...projectIds]);
  }

  await logAdminProjectAction(null, null, adminEmail, 'Bulk Modify', `Modified ${projectIds.length} project(s) with ${JSON.stringify(updates)}`);
  await invalidateProjectsCache();

  return { updatedCount: projectIds.length };
}

export async function getAdminProjectActivityLogs() {
  await ensureAdminProjectTables();
  const [rows] = await query<any>(`
    SELECT 
      id,
      project_id as projectId,
      project_title as projectTitle,
      admin_email as adminEmail,
      action,
      details,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as createdAt
    FROM project_activity_logs
    ORDER BY created_at DESC
    LIMIT 50
  `);

  return rows || [];
}
