import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';
import { enforceRateLimit, getRequestIp } from '@/lib/rate-limit';
import { parseString } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    const limitState = enforceRateLimit(`auth-setup:${ip}`);
    if (!limitState.allowed) {
      return Response.json(
        {
          error: 'Too many password setup attempts. Try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(limitState.retryAfter ?? 60),
          },
        }
      );
    }

    const body = await request.json().catch(() => ({}));

    const studentId = parseString(body?.studentId).toUpperCase();
    const password = parseString(body?.password);

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