import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getProjects, invalidateProjectsCache } from '@/lib/services/projects';
import { parseString, parseStudentId } from '@/lib/security';

function formatYear(year: number): string {
  const m: Record<number, string> = {
    1: '1st',
    2: '2nd',
    3: '3rd',
    4: 'Final',
  };
  return m[year] ?? `${year}th`;
}

function transformProject(p: any, forUserId?: string) {
  const savedBy =
    typeof p.saved_by === 'string' && p.saved_by.length
      ? p.saved_by.split(',')
      : [];

  const collaborators =
    typeof p.collaborators === 'string' && p.collaborators.length
      ? p.collaborators.split(',')
      : [];

  const likedBy =
    typeof p.liked_by === 'string' && p.liked_by.length
      ? p.liked_by.split(',')
      : [];

  return {
    id: p.id,
    studentId: p.student_id,
    studentName: p.student_name,
    academicYear: formatYear(p.student_year),
    title: p.title,
    description: p.description || '',
    category: p.category || 'General',
    uploadedAt: p.uploaded_at,
    likes: Number(p.likes) || 0,
    thumbnailUrl: p.thumbnail_url,
    fileName: p.file_name,
    fileSize: p.file_size,
    savedBy,
    collaborators,
    userHasLiked: !!forUserId && likedBy.includes(forUserId),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filterStudentId = parseStudentId(searchParams.get('studentId')) || undefined;
    const category = searchParams.get('category')?.trim();
    const forUserId = parseStudentId(searchParams.get('forUserId')) || undefined;

    let sql = `
      SELECT
        p.id,
        p.student_id,
        p.title,
        p.description,
        p.category,
        p.uploaded_at,
        p.likes,
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
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filterStudentId) {
      sql += ` AND p.student_id = ?`;
      params.push(filterStudentId);
    }

    if (category) {
      sql += ` AND p.category = ?`;
      params.push(category);
    }

    sql += ` GROUP BY p.id ORDER BY p.uploaded_at DESC`;

    const projects = await getProjects({ studentId: filterStudentId || undefined, category: category || undefined, forUserId: forUserId || undefined });
    return Response.json(projects);

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: 'Database error',
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const studentId = parseStudentId(body?.studentId || "");
    const studentName = body.studentName || "Unknown";
    const title = (body.title || "").trim();

    if (!studentId || !title) {
      return Response.json(
        { error: "studentId and title required" },
        { status: 400 }
      );
    }

    const id = `proj-${Date.now()}`;

    await query(
      `
      INSERT INTO projects
      (
        id,
        student_id,
        title,
        description,
        category,
        thumbnail_url,
        file_name,
        file_size,
        likes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `,
      [
        id,
        studentId,
        title,
        body.description || "",
        body.category || "General",
        body.thumbnailUrl || null,
        body.fileName || null,
        body.fileSize || null,
      ]
    );

    // Owner collaborator
    await query(
      `
      INSERT INTO project_collaborators
      (project_id, student_id)
      VALUES (?, ?)
      `,
      [id, studentId]
    );

    // Update student stats
    await query(
      `
      UPDATE student_stats
      SET projects_uploaded = projects_uploaded + 1
      WHERE student_id = ?
      `,
      [studentId]
    );

    // Invalidate project caches after mutation
    invalidateProjectsCache();

    return Response.json({
      id,
      studentId,
      studentName,
      title,
      description: body.description || "",
      category: body.category || "General",
      likes: 0,
      uploadedAt: new Date().toISOString(),
      collaborators: [studentId],
      savedBy: [],
      userHasLiked: false,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Database error" },
      { status: 500 }
    );
  }
}