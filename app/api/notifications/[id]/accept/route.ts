import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { invalidateProjectsCache } from '@/lib/services/projects';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn;
  try {
    const { id } = await params;
    if (!id) {
      return Response.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const pool = getPool();
    conn = await pool.getConnection();

    await conn.beginTransaction();

    // 1. Fetch notification
    const [notifRows] = await conn.query(
      `SELECT receiver_id, sender_id, project_id FROM notifications WHERE id = ?`,
      [id]
    ) as any;
    const notifRowsArray = Array.isArray(notifRows) ? notifRows : [];
    const notif = notifRowsArray[0] ?? null;
    if (!notif) {
      await conn.rollback();
      conn.release();
      return Response.json({ error: 'Notification not found' }, { status: 404 });
    }

    const receiverId = notif.receiver_id;
    const senderId = notif.sender_id;
    const projectId = notif.project_id;

    // 2. Fetch collaborator name
    const [studentRows] = await conn.query(
      `SELECT name FROM students WHERE id = ?`,
      [receiverId]
    ) as any;
    const studentRowsArray = Array.isArray(studentRows) ? studentRows : [];
    const student = studentRowsArray[0] ?? null;
    const collaboratorName = student?.name || 'A classmate';

    // 3. Fetch project title
    const [projectRows] = await conn.query(
      `SELECT title FROM projects WHERE id = ?`,
      [projectId]
    ) as any;
    const projectRowsArray = Array.isArray(projectRows) ? projectRows : [];
    const project = projectRowsArray[0] ?? null;
    const projectTitle = project?.title || 'your project';

    // 4. Update status in collaborators table
    await conn.query(
      `UPDATE collaborators SET status = 'ACCEPTED' WHERE project_id = ? AND student_id = ?`,
      [projectId, receiverId]
    );

    // 5. Insert into legacy project_collaborators table
    await conn.query(
      `INSERT IGNORE INTO project_collaborators (project_id, student_id) VALUES (?, ?)`,
      [projectId, receiverId]
    );

    // 6. Mark notification as read
    await conn.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = ?`,
      [id]
    );

    // 7. Create owner notification
    const ownerNotifId = `notif-${Date.now()}-${Math.random().toString().slice(2, 8)}`;
    await conn.query(
      `
      INSERT INTO notifications (id, receiver_id, sender_id, project_id, type, title, message, is_read)
      VALUES (?, ?, ?, ?, 'COLLAB_ACCEPT', 'Collaboration Accepted', ?, FALSE)
      `,
      [
        ownerNotifId,
        senderId,
        receiverId,
        projectId,
        `${collaboratorName} accepted your collaboration request for "${projectTitle}".`
      ]
    );

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
