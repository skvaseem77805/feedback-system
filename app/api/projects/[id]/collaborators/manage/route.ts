import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { parseStudentId } from '@/lib/security';
import { invalidateProjectsCache } from '@/lib/services/projects';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn;
  try {
    const { id: projectId } = await params;
    if (!projectId) {
      return Response.json({ error: 'Project ID required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action; // 'cancel' | 'invite' | 'remove'
    const targetStudentId = parseStudentId(body.studentId);
    const ownerId = parseStudentId(body.ownerId);

    if (!action || !targetStudentId || !ownerId) {
      return Response.json({ error: 'action, studentId, and ownerId required' }, { status: 400 });
    }

    const pool = getPool();
    conn = await pool.getConnection();

    // 1. Verify owner permission
    const [projectRows] = await conn.query(
      `SELECT student_id, title FROM projects WHERE id = ?`,
      [projectId]
    ) as any;
    const projectRowsArray = Array.isArray(projectRows) ? projectRows : [];
    const project = projectRowsArray[0] ?? null;

    if (!project) {
      conn.release();
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.student_id !== ownerId) {
      conn.release();
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    const projectTitle = project.title;

    await conn.beginTransaction();

    if (action === 'remove') {
      // Remove the collaboration relationship
      await conn.query(
        `DELETE FROM collaborators WHERE project_id = ? AND student_id = ?`,
        [projectId, targetStudentId]
      );
      await conn.query(
        `DELETE FROM project_collaborators WHERE project_id = ? AND student_id = ?`,
        [projectId, targetStudentId]
      );

      // Send notification: "You have been removed from the project."
      const notifId = `notif-${Date.now()}-${Math.random().toString().slice(2, 8)}`;
      await conn.query(
        `
        INSERT INTO notifications (id, receiver_id, sender_id, project_id, type, title, message, is_read)
        VALUES (?, ?, ?, ?, 'COLLAB_REJECT', 'Removed from Project', ?, FALSE)
        `,
        [
          notifId,
          targetStudentId,
          ownerId,
          projectId,
          `You have been removed from the project "${projectTitle}".`
        ]
      );
    } else if (action === 'cancel') {
      // Remove the pending invitation
      await conn.query(
        `DELETE FROM collaborators WHERE project_id = ? AND student_id = ?`,
        [projectId, targetStudentId]
      );

      // Remove the collaboration request notifications
      await conn.query(
        `DELETE FROM notifications WHERE project_id = ? AND receiver_id = ? AND type = 'COLLAB_REQUEST'`,
        [projectId, targetStudentId]
      );
    } else if (action === 'invite') {
      // Status changes back to PENDING
      await conn.query(
        `UPDATE collaborators SET status = 'PENDING' WHERE project_id = ? AND student_id = ?`,
        [projectId, targetStudentId]
      );

      // Fetch owner name
      const [ownerRows] = await conn.query(
        `SELECT name FROM students WHERE id = ?`,
        [ownerId]
      ) as any;
      const ownerRowsArray = Array.isArray(ownerRows) ? ownerRows : [];
      const ownerName = ownerRowsArray[0]?.name || 'Project Owner';

      // Create new collaboration request notification
      const notifId = `notif-${Date.now()}-${Math.random().toString().slice(2, 8)}`;
      await conn.query(
        `
        INSERT INTO notifications (id, receiver_id, sender_id, project_id, type, title, message, is_read)
        VALUES (?, ?, ?, ?, 'COLLAB_REQUEST', 'Collaboration Request', ?, FALSE)
        `,
        [
          notifId,
          targetStudentId,
          ownerId,
          projectId,
          `${ownerName} invited you to collaborate on "${projectTitle}".`
        ]
      );
    }

    await conn.commit();
    conn.release();
    conn = null;

    invalidateProjectsCache();

    return Response.json({ success: true });
  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rbErr) {
        console.error('Rollback failed:', rbErr);
      }
      conn.release();
    }
    console.error(error);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
