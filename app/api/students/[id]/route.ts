import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';

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
    const sid = (id || '').trim().toUpperCase();

    if (!sid) {
      return Response.json(
        { error: 'Student ID required' },
        { status: 400 }
      );
    }

    const row = await queryOne<any>(
      `
      SELECT
        id,
        name,
        registration_no,
        unique_id,
        year,
        course,
        email,
        mobile_no,
        department,
        section,
        linkedin_url,
        bio,
        skills,
        avatar
      FROM students
      WHERE id = ?
      LIMIT 1
      `,
      [sid]
    );

    if (!row) {
      return Response.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    let skills: string[] = [];

    if (row.skills) {
      try {
        skills =
          typeof row.skills === 'string'
            ? JSON.parse(row.skills)
            : row.skills;
      } catch {
        skills = [];
      }
    }

    return Response.json({
      id: row.id,
      userId: row.id,
      name: row.name,
      registrationNo: row.registration_no,
      uniqueId: row.unique_id,
      year: row.year,
      course: row.course,
      email: row.email || '',
      mobileNo: row.mobile_no || '',
      department: row.department || 'CSE',
      section: row.section || 'E',
      linkedinUrl: row.linkedin_url ?? undefined,
      bio: row.bio ?? undefined,
      skills,
      avatar: row.avatar ?? undefined,
      academicYear: formatYear(row.year),
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sid = (id || '').trim().toUpperCase();

    if (!sid) {
      return Response.json(
        { error: 'Student ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (body.email !== undefined) {
      updates.push('email = ?');
      values.push(body.email);
    }

    if (body.linkedinUrl !== undefined) {
      updates.push('linkedin_url = ?');
      values.push(body.linkedinUrl);
    }

    if (body.bio !== undefined) {
      updates.push('bio = ?');
      values.push(body.bio);
    }

    if (body.avatar !== undefined || body.profilePhoto !== undefined) {
      updates.push('avatar = ?');
      values.push(body.avatar || body.profilePhoto);
    }

    if (body.mobileNo !== undefined) {
      updates.push('mobile_no = ?');
      values.push(body.mobileNo);
    }

    if (body.skills !== undefined) {
      updates.push('skills = ?');
      values.push(JSON.stringify(body.skills));
    }

    if (body.academicYear !== undefined) {
      const mapping: Record<string, number> = {
        '1st': 1,
        '2nd': 2,
        '3rd': 3,
        '4th': 4,
        'Final': 4,
        'final': 4,
      };

      const y =
        mapping[String(body.academicYear)] ??
        Number(body.academicYear);

      if (y) {
        updates.push('year = ?');
        values.push(y);
      }
    }

    if (body.year !== undefined) {
      updates.push('year = ?');
      values.push(Number(body.year));
    }

    if (updates.length === 0) {
      return Response.json({
        message: 'No valid fields to update',
      });
    }

    values.push(sid);

    await query(
      `
      UPDATE students
      SET ${updates.join(', ')}
      WHERE id = ?
      `,
      values
    );

    return Response.json({
      success: true,
      message: 'Profile updated',
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}