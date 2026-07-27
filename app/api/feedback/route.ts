import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface FeedbackRow {
  id: string;
  userRole: 'student' | 'staff' | 'admin';
  userId: string;
  subject: string;
  message: string;
  isRead: number | boolean;
  isResolved: number | boolean;
  createdAt: string | Date;
}

export async function GET() {
  try {
    const [rows] = await query<FeedbackRow>(
      `SELECT
        id,
        user_role AS userRole,
        user_id AS userId,
        subject,
        message,
        is_read AS isRead,
        is_resolved AS isResolved,
        created_at AS createdAt
      FROM feedback
      ORDER BY created_at DESC`
    );

    const feedbackList = (rows || []).map((row) => {
      const createdAtDate = row.createdAt ? new Date(row.createdAt) : new Date();
      return {
        id: row.id,
        userRole: row.userRole,
        userId: row.userId,
        subject: row.subject,
        message: row.message,
        date: createdAtDate.toLocaleString('en-IN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        read: Boolean(row.isRead),
        resolved: Boolean(row.isResolved),
        createdAt: createdAtDate.toISOString(),
      };
    });

    const stats = {
      total: feedbackList.length,
      unread: feedbackList.filter((f) => !f.read).length,
      resolved: feedbackList.filter((f) => f.resolved).length,
      pending: feedbackList.filter((f) => !f.resolved).length,
    };

    return NextResponse.json({
      success: true,
      feedback: feedbackList,
      stats,
    });
  } catch (error: any) {
    console.error('[GET /api/feedback] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback records', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userRole, userId, subject, message } = body;

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.trim().length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters' }, { status: 400 });
    }

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const feedbackId = `feedback-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const role = (userRole && ['student', 'staff', 'admin'].includes(userRole)) ? userRole : 'student';

    await query(
      `INSERT INTO feedback (id, user_role, user_id, subject, message, is_read, is_resolved, created_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, NOW())`,
      [feedbackId, role, userId.trim(), subject.trim(), message.trim()]
    );

    const createdAtDate = new Date();
    const newFeedback = {
      id: feedbackId,
      userRole: role,
      userId: userId.trim(),
      subject: subject.trim(),
      message: message.trim(),
      date: createdAtDate.toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      read: false,
      resolved: false,
      createdAt: createdAtDate.toISOString(),
    };

    return NextResponse.json({
      success: true,
      feedback: newFeedback,
    });
  } catch (error: any) {
    console.error('[POST /api/feedback] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
