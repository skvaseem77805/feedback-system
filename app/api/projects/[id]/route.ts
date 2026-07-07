import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { parseStudentId } from '@/lib/security';
import { getProjectById, invalidateProject } from '@/lib/services/projects';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pid = (id || '').trim();

    if (!pid) {
      return Response.json({ error: 'Project ID required' }, { status: 400 });
    }

    const project = await getProjectById(pid);

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    return Response.json(project);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Database error' }, { status: 500 });
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
      return Response.json({ error: 'Project ID required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const studentId = parseStudentId(body?.studentId || body?.student_id);

    if (!studentId) {
      return Response.json({ error: 'studentId required' }, { status: 400 });
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
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    if (owner.student_id !== studentId) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    await query(`DELETE FROM project_saves WHERE project_id = ?`, [pid]);
    await query(`DELETE FROM project_collaborators WHERE project_id = ?`, [pid]);
    await query(`DELETE FROM project_likes WHERE project_id = ?`, [pid]);
    await query(`DELETE FROM projects WHERE id = ?`, [pid]);
    await query(
      `
      UPDATE student_stats
      SET projects_uploaded =
        GREATEST(projects_uploaded - 1, 0)
      WHERE student_id = ?
      `,
      [studentId]
    );

    invalidateProject(pid);

    return Response.json({ deleted: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Database error' }, { status: 500 });
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