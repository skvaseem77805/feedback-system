import { NextRequest } from 'next/server';
import { getPool, query, queryOne } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { validateRegistrationNo } from '@/lib/validation';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const studentId = (id || '').trim().toUpperCase();
    const body = await request.json().catch(() => ({}));

    if (!studentId) {
      return Response.json({ error: 'Student ID required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: Array<string | number | null> = [];

    const setField = (field: string, value: unknown) => {
      updates.push(`${field} = ?`);
      values.push(value as string | number | null);
    };

    if (body.name !== undefined) setField('name', body.name);
    if (body.registrationNo !== undefined) {
      const validation = validateRegistrationNo(body.registrationNo);
      if (!validation.isValid) {
        return Response.json({ error: validation.error }, { status: 400 });
      }
      setField('registration_no', validation.cleaned);
    }
    if (body.year !== undefined) setField('year', Number(body.year));
    if (body.course !== undefined) setField('course', body.course);
    if (body.email !== undefined) setField('email', body.email);
    if (body.mobileNo !== undefined) setField('mobile_no', body.mobileNo);
    if (body.department !== undefined) setField('department', body.department);
    if (body.section !== undefined) setField('section', body.section);
    if (body.linkedinUrl !== undefined) setField('linkedin_url', body.linkedinUrl || null);
    if (body.githubUrl !== undefined) setField('github_url', body.githubUrl || null);
    if (body.bio !== undefined) setField('bio', body.bio || null);
    if (body.avatar !== undefined) setField('avatar', body.avatar || null);

    if (updates.length === 0) {
      return Response.json({ success: true, message: 'No changes' });
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, [...values, studentId]);
      await connection.commit();
      return Response.json({ success: true, message: 'Student updated' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const studentId = (id || '').trim().toUpperCase();
    if (!studentId) {
      return Response.json({ error: 'Student ID required' }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('DELETE FROM students WHERE id = ?', [studentId]);
      await connection.commit();
      return Response.json({ success: true, message: 'Student deleted' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const studentId = (id || '').trim().toUpperCase();

    if (!studentId) {
      return Response.json({ error: 'Student ID required' }, { status: 400 });
    }

    const [dbCols] = await query<any>('DESCRIBE students');
    const existingCols = new Set((dbCols || []).map(c => (c as any).Field));

    const optionalColumns = [
      'course',
      'mobile_no',
      'linkedin_url',
      'github_url',
      'bio',
      'skills',
      'avatar'
    ];

    const columnsToSelect = [
      'id',
      'name',
      'registration_no',
      'year',
      'email',
      'department',
      'section'
    ].filter(col => existingCols.has(col) && col !== 'unique_id');

    for (const col of optionalColumns) {
      if (existingCols.has(col) && col !== 'unique_id') {
        columnsToSelect.push(col);
      }
    }

    if (columnsToSelect.length === 0) {
      return Response.json({ error: 'No valid columns to query' }, { status: 500 });
    }

    const row = await queryOne<any>(
      `
      SELECT ${columnsToSelect.join(', ')}
      FROM students
      WHERE id = ? OR registration_no = ?
      LIMIT 1
      `,
      [studentId, studentId]
    );

    if (!row) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    let skills: string[] = [];
    if (row.skills) {
      try {
        skills = typeof row.skills === 'string' ? JSON.parse(row.skills) : row.skills;
      } catch {
        skills = [];
      }
    }

    const formatYear = (year: number): string => {
      const m: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: 'Final' };
      return m[year] ?? `${year}th`;
    };

    return Response.json({
      id: row.id,
      userId: row.id,
      name: row.name,
      registrationNo: row.registration_no,
      year: row.year,
      course: row.course ?? undefined,
      email: row.email || '',
      mobileNo: row.mobile_no || '',
      department: row.department || 'CSE',
      section: row.section || 'E',
      linkedinUrl: row.linkedin_url ?? undefined,
      githubUrl: row.github_url ?? undefined,
      bio: row.bio ?? undefined,
      skills,
      avatar: row.avatar ?? undefined,
      academicYear: formatYear(row.year),
    });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Database error' }, { status: 500 });
  }
}
