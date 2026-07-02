import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

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

    const filterStudentId = searchParams.get('studentId')?.trim();
    const category = searchParams.get('category')?.trim();
    const forUserId = searchParams.get('forUserId')?.trim();

    let sql = `
      SELECT
        p.*,
        s.name AS student_name,
        s.year AS student_year,

        (
          SELECT GROUP_CONCAT(student_id)
          FROM project_saves
          WHERE project_id = p.id
        ) AS saved_by,

        (
          SELECT GROUP_CONCAT(student_id)
          FROM project_collaborators
          WHERE project_id = p.id
        ) AS collaborators,

        (
          SELECT GROUP_CONCAT(student_id)
          FROM project_likes
          WHERE project_id = p.id
        ) AS liked_by

      FROM projects p
      INNER JOIN students s
      ON s.id = p.student_id

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

    sql += ` ORDER BY p.uploaded_at DESC`;

    const [rows] = await query<any>(sql, params);

    return Response.json(
      rows.map((row: any) => transformProject(row, forUserId))
    );

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

    const studentId = (body.studentId || "").trim();
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