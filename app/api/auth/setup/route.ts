import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const studentId = (body?.studentId || '').trim().toUpperCase();
    const password = body?.password || '';

    if (!studentId || !password) {
      return Response.json(
        { error: 'Student ID and password required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await queryOne<{
      id: string;
      password_hash: string | null;
    }>(
      `
      SELECT id, password_hash
      FROM students
      WHERE id = ?
      LIMIT 1
      `,
      [studentId]
    );

    if (!student) {
      return Response.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (student.password_hash) {
      return Response.json(
        {
          error: 'Password already set. Please login or contact admin.',
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update password
    await query(
      `
      UPDATE students
      SET password_hash = ?
      WHERE id = ?
      `,
      [hashedPassword, studentId]
    );

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: 'Database error',
      },
      { status: 500 }
    );
  }
}