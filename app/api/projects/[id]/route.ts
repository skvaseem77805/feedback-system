import { NextRequest } from 'next/server';
import { query, queryOne, getPool } from '@/lib/db';
import { parseStudentId } from '@/lib/security';
import { getProjectById, invalidateProject } from '@/lib/services/projects';
import { recalculateAndSyncStats } from '@/lib/services/stats';

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

    const { searchParams } = new URL(request.url);
    const forUserId = parseStudentId(searchParams.get('forUserId')) || undefined;

    const project = await getProjectById(pid, forUserId);

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const responseProject = { ...project } as any;

    // If the requester is the owner, fetch all collaborator states
    if (forUserId && project.studentId === forUserId) {
      const [collabRows] = await query(
        `
        SELECT 
          c.student_id, 
          c.role, 
          c.status,
          s.name AS name,
          s.avatar AS avatar
        FROM collaborators c
        INNER JOIN students s ON s.id = c.student_id
        WHERE c.project_id = ? AND c.role = 'COLLABORATOR'
        `,
        [pid]
      ) as any;
      const rows = Array.isArray(collabRows) ? collabRows : [];
      responseProject.allCollaborators = rows.map((r: any) => ({
        studentId: r.student_id,
        role: r.role,
        status: r.status,
        name: r.name,
        avatar: r.avatar || null,
      }));
    }

    return Response.json(responseProject);
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

    // Fetch accepted collaborators before deleting
    const [collabRows] = await query<any>(
      `SELECT student_id FROM collaborators WHERE project_id = ? AND role = 'COLLABORATOR' AND status = 'ACCEPTED'`,
      [pid]
    );
    const acceptedCollaborators = (Array.isArray(collabRows) ? collabRows : []).map((r: any) => r.student_id);

    await query(`DELETE FROM project_saves WHERE project_id = ?`, [pid]);
    await query(`DELETE FROM project_collaborators WHERE project_id = ?`, [pid]);
    await query(`DELETE FROM project_likes WHERE project_id = ?`, [pid]);
    await query(`DELETE FROM projects WHERE id = ?`, [pid]);

    // Recalculate stats for the project owner
    await recalculateAndSyncStats(studentId);

    // Recalculate stats for each collaborator
    for (const collabId of acceptedCollaborators) {
      await recalculateAndSyncStats(collabId);
    }

    invalidateProject(pid);

    return Response.json({ deleted: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn;
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

    const { title, description, thumbnailUrl, imageUrls, department, collaborators } = body;

    const pool = getPool();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const resolvedImageUrls = Array.isArray(imageUrls) ? imageUrls : null;
    const resolvedThumbnailUrl = resolvedImageUrls && resolvedImageUrls.length > 0 ? resolvedImageUrls[0] : (thumbnailUrl || null);
    const jsonImageUrls = resolvedImageUrls ? JSON.stringify(resolvedImageUrls) : null;

    // 1. Update project record
    await conn.query(
      `
      UPDATE projects
      SET title = ?, description = ?, thumbnail_url = ?, image_urls = ?
      WHERE id = ?
      `,
      [title || "", description || "", resolvedThumbnailUrl, jsonImageUrls, pid]
    );

    // 2. Update owner's department in students table
    if (department) {
      await conn.query(
        `
        UPDATE students
        SET department = ?
        WHERE id = ?
        `,
        [department, studentId]
      );
    }

    // 3. Update collaborators if sent
    if (Array.isArray(collaborators)) {
      const cleanedCollabIds = collaborators
        .map((c: string) => parseStudentId(c))
        .filter((c): c is string => !!c && c !== studentId);

      const uniqueCollabIds = Array.from(new Set(cleanedCollabIds)).slice(0, 4);

      // Fetch current collaborators
      const [existingCollabs] = await conn.query(
        `
        SELECT student_id, role, status
        FROM collaborators
        WHERE project_id = ?
        `,
        [pid]
      ) as any;

      const currentDbCollabs = Array.isArray(existingCollabs) ? existingCollabs : [];
      const currentDbCollabIds = currentDbCollabs
        .filter((c: any) => c.role === 'COLLABORATOR')
        .map((c: any) => c.student_id);

      const collabsToRemove = currentDbCollabIds.filter(
        (cid: string) => !uniqueCollabIds.includes(cid)
      );

      const collabsToAdd = uniqueCollabIds.filter(
        (cid: string) => !currentDbCollabIds.includes(cid)
      );

      // Delete removed
      if (collabsToRemove.length > 0) {
        await conn.query(
          `
          DELETE FROM collaborators
          WHERE project_id = ? AND role = 'COLLABORATOR' AND student_id IN (?)
          `,
          [pid, collabsToRemove]
        );
        await conn.query(
          `
          DELETE FROM project_collaborators
          WHERE project_id = ? AND student_id IN (?)
          `,
          [pid, collabsToRemove]
        );
      }

      // Add new
      for (const collabId of collabsToAdd) {
        const collabRecordId = `collab-${collabId}-${pid}-${Date.now()}`;
        await conn.query(
          `
          INSERT INTO collaborators (id, project_id, student_id, role, status)
          VALUES (?, ?, ?, 'COLLABORATOR', 'PENDING')
          `,
          [collabRecordId, pid, collabId]
        );

        // Notify
        const notifId = `notif-${Date.now()}-${Math.random().toString().slice(2, 8)}`;
        const studentName = body.studentName || 'Co-author';
        await conn.query(
          `
          INSERT INTO notifications (id, receiver_id, sender_id, project_id, type, title, message, is_read)
          VALUES (?, ?, ?, ?, 'COLLAB_REQUEST', 'Collaboration Request', ?, FALSE)
          `,
          [
            notifId,
            collabId,
            studentId,
            pid,
            `${studentName} invited you to collaborate on "${title}".`
          ]
        );
      }
    }

    // Sync stats
    await recalculateAndSyncStats(studentId, conn);

    await conn.commit();
    conn.release();
    conn = null;

    invalidateProject(pid);

    return Response.json({ success: true });
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
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
