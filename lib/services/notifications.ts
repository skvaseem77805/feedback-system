import { query } from '@/lib/db';

export interface Notification {
  id: string;
  receiverId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string | null;
  projectId: string | null;
  type: 'LIKE' | 'SAVE' | 'COLLAB_REQUEST' | 'COLLAB_ACCEPT' | 'COLLAB_REJECT';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export async function createNotification(params: {
  id: string;
  receiverId: string;
  senderId: string;
  projectId?: string | null;
  type: 'LIKE' | 'SAVE' | 'COLLAB_REQUEST' | 'COLLAB_ACCEPT' | 'COLLAB_REJECT';
  title: string;
  message: string;
}): Promise<void> {
  await query(
    `INSERT INTO notifications (id, receiver_id, sender_id, project_id, type, title, message, is_read)
     VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)`,
    [
      params.id,
      params.receiverId,
      params.senderId,
      params.projectId || null,
      params.type,
      params.title,
      params.message,
    ]
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  await query(
    `UPDATE notifications SET is_read = TRUE WHERE id = ?`,
    [id]
  );
}

export async function getNotifications(receiverId: string, limit: number = 50): Promise<Notification[]> {
  const [rows] = await query<any>(
    `SELECT 
       n.id, 
       n.receiver_id, 
       n.sender_id, 
       n.project_id, 
       n.type, 
       n.title, 
       n.message, 
       n.is_read, 
       n.created_at,
       s.name AS sender_name,
       s.avatar AS sender_avatar
     FROM notifications n
     INNER JOIN students s ON s.id = n.sender_id
     WHERE n.receiver_id = ?
     ORDER BY n.created_at DESC
     LIMIT ?`,
    [receiverId, limit]
  );
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r: any) => ({
    id: r.id,
    receiverId: r.receiver_id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    senderAvatar: r.sender_avatar || null,
    projectId: r.project_id,
    type: r.type,
    title: r.title,
    message: r.message,
    isRead: Boolean(r.is_read),
    createdAt: new Date(r.created_at),
  }));
}
