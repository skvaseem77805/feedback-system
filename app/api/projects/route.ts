import { NextRequest } from 'next/server';
import { query, queryOne, getPool } from '@/lib/db';
import { getProjects, invalidateProjectsCache } from '@/lib/services/projects';
import { parseStudentId } from '@/lib/security';

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

    // Retrieve any possible identifier parameter
    const rawStudentId = searchParams.get('studentId') ||
                         searchParams.get('userId') ||
                         searchParams.get('user.id') ||
                         searchParams.get('uploaderId') ||
                         searchParams.get('uploadedBy') ||
                         searchParams.get('rollNumber') ||
                         searchParams.get('email');

    let filterStudentId: string | undefined = undefined;

    if (rawStudentId) {
      const parsedVal = (rawStudentId || '').trim();
      if (parsedVal) {
        if (parsedVal.includes('@')) {
          // If it contains '@', query students table by email
          const student = await queryOne<any>(
            `SELECT id FROM students WHERE email = ? LIMIT 1`,
            [parsedVal]
          );
          if (student) {
            filterStudentId = student.id;
          }
        } else {
          // Verify if it is a student ID, registration no, or student name
          const student = await queryOne<any>(
            `SELECT id FROM students WHERE id = ? OR registration_no = ? OR name = ? LIMIT 1`,
            [parsedVal, parsedVal, parsedVal]
          );
          if (student) {
            filterStudentId = student.id;
          } else {
            // Fallback parsing
            const parsed = parseStudentId(parsedVal);
            if (parsed) {
              filterStudentId = parsed;
            }
          }
        }
      }
    }

    const category = searchParams.get('category')?.trim();
    const forUserId = parseStudentId(searchParams.get('forUserId')) || undefined;
    const sort = searchParams.get('sort') === 'trending' ? 'trending' : undefined;
    const limitVal = searchParams.get('limit');
    const limit = limitVal && Number.isFinite(Number(limitVal)) ? Math.min(100, Math.max(1, Number(limitVal))) : undefined;

    const projects = await getProjects({
      studentId: filterStudentId || undefined,
      category: category || undefined,
      forUserId: forUserId || undefined,
      sort,
      limit,
    });
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
  let conn;
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

    const collaboratorsList: string[] = Array.isArray(body.collaborators) ? body.collaborators : [];
    if (collaboratorsList.length > 4) {
      return Response.json(
        { error: "Maximum collaborators allowed is 4" },
        { status: 400 }
      );
    }

    const id = `proj-${Date.now()}`;

    // Get connection from pool for transaction
    const pool = getPool();
    conn = await pool.getConnection();

    await conn.beginTransaction();

    // 1. Insert project record
    await conn.query(
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

    // 2. Owner collaborator (legacy table)
    await conn.query(
      `
      INSERT INTO project_collaborators
      (project_id, student_id)
      VALUES (?, ?)
      `,
      [id, studentId]
    );

    // 3. Save owner to new collaborators table
    await conn.query(
      `
      INSERT INTO collaborators (id, project_id, student_id, role, status)
      VALUES (?, ?, ?, 'OWNER', 'ACCEPTED')
      `,
      [`collab-owner-${id}`, id, studentId]
    );

    // 4. Save selected collaborators to collaborators table
    const seenCollabIds = new Set<string>();
    for (const collabId of collaboratorsList) {
      const parsedCollabId = parseStudentId(collabId);
      if (parsedCollabId && parsedCollabId !== studentId && !seenCollabIds.has(parsedCollabId)) {
        seenCollabIds.add(parsedCollabId);
        const collabRecordId = `collab-${parsedCollabId}-${id}-${Date.now()}`;
        await conn.query(
          `
          INSERT INTO collaborators (id, project_id, student_id, role, status)
          VALUES (?, ?, ?, 'COLLABORATOR', 'PENDING')
          `,
          [collabRecordId, id, parsedCollabId]
        );

        // Create notification for collaborator
        const notifId = `notif-${Date.now()}-${Math.random().toString().slice(2, 8)}`;
        await conn.query(
          `
          INSERT INTO notifications (id, receiver_id, sender_id, project_id, type, title, message, is_read)
          VALUES (?, ?, ?, ?, 'COLLAB_REQUEST', 'Collaboration Request', ?, FALSE)
          `,
          [
            notifId,
            parsedCollabId,
            studentId,
            id,
            `${studentName} invited you to collaborate on "${title}".`
          ]
        );
      }
    }

    // 5. Update student stats
    await conn.query(
      `
      UPDATE student_stats
      SET projects_uploaded = projects_uploaded + 1
      WHERE student_id = ?
      `,
      [studentId]
    );

    await conn.commit();
    conn.release();
    conn = null;

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
    if (conn) {
      try {
        await conn.rollback();
      } catch (rbError) {
        console.error('Rollback failed:', rbError);
      }
      conn.release();
    }
    console.error(error);

    return Response.json(
      { error: "Database error" },
      { status: 500 }
    );
  }
}