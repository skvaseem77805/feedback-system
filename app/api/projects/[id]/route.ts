import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { parseStudentId } from '@/lib/security';
import { invalidateProject, getProjectById } from '@/lib/services/projects';

function formatYear(year: number): string {
  const m: Record<number, string> = {
    1: '1st',
    2: '2nd',
    3: '3rd',
    4: 'Final',
  };
  return m[year] ?? `${year}th`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pid = (id || '').trim();

    if (!pid) {
      return Response.json(
        { error: 'Project ID required' },
        { status: 400 }
      );
    }

    const row = await queryOne<any>(
      `
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
        GROUP_CONCAT(DISTINCT pc.student_id) AS collaborators
      FROM projects p
      INNER JOIN students s ON s.id = p.student_id
      LEFT JOIN project_saves ps ON ps.project_id = p.id
      LEFT JOIN project_collaborators pc ON pc.project_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
      `,
      [pid]
    );

    if (!row) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

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
      thumbnailUrl: row.thumbnail_url,
      fileName: row.file_name,
      fileSize: row.file_size,
      savedBy:
        row.saved_by?.split(',').filter(Boolean) || [],
      collaborators:
        row.collaborators?.split(',').filter(Boolean) || [],
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pid = (id || '').trim();

    if (!pid) {
      return Response.json(
        { error: 'Project ID required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const studentId = parseStudentId(body?.studentId || body?.student_id);

    if (!studentId) {
      return Response.json(
        { error: 'studentId required' },
        { status: 400 }
      );
    }

    const owner = await queryOne<any>(
      `
      SELECT student_id
      FROM projects
      WHERE id = ?
      `,
      [pid]
    );

    if (!owner) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (owner.student_id !== studentId) {
      return Response.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    await query(
      `DELETE FROM project_saves WHERE project_id = ?`,
      [pid]
    );

    await query(
      `DELETE FROM project_collaborators WHERE project_id = ?`,
      [pid]
    );

    await query(
      `DELETE FROM project_likes WHERE project_id = ?`,
      [pid]
    );

    await query(
      `DELETE FROM projects WHERE id = ?`,
      [pid]
    );

    await query(
      `
      UPDATE student_stats
      SET projects_uploaded =
        GREATEST(projects_uploaded - 1, 0)
      WHERE student_id = ?
      `,
      [studentId]
    );

    // Invalidate caches for project and list
    invalidateProject(pid);

    return Response.json({
      deleted: true,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}