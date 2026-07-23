import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import cloudinary from '@/lib/cloudinary';

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

    // Fetch existing columns in students table
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
    ].filter(col => existingCols.has(col));

    for (const col of optionalColumns) {
      if (existingCols.has(col)) {
        columnsToSelect.push(col);
      }
    }

    if (columnsToSelect.length === 0) {
      return Response.json(
        { error: 'No valid columns to query' },
        { status: 500 }
      );
    }

    const row = await queryOne<any>(
      `
      SELECT ${columnsToSelect.join(', ')}
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

    return Response.json(
      { error: error.message || 'Database error', stack: error.stack },
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

    const isAvatarUpdated = body.avatar !== undefined || body.profilePhoto !== undefined;
    if (isAvatarUpdated) {
      const newAvatarVal = body.avatar || body.profilePhoto || null;
      // 1. Fetch current avatar URL
      const currentStudent = await queryOne<{ avatar: string | null }>(
        `SELECT avatar FROM students WHERE id = ? LIMIT 1`,
        [sid]
      );
      if (currentStudent && currentStudent.avatar && currentStudent.avatar !== newAvatarVal) {
        const oldAvatar = currentStudent.avatar;
        if (oldAvatar.includes('res.cloudinary.com')) {
          const parts = oldAvatar.split('/image/upload/');
          if (parts.length >= 2) {
            let path = parts[1];
            const versionMatch = path.match(/^v\d+\/(.+)$/);
            if (versionMatch) {
              path = versionMatch[1];
            }
            const dotIndex = path.lastIndexOf('.');
            const publicId = dotIndex !== -1 ? path.substring(0, dotIndex) : path;
            try {
              await cloudinary.uploader.destroy(publicId);
              console.log('Successfully deleted old Cloudinary image:', publicId);
            } catch (err) {
              console.error('Failed to destroy old Cloudinary image:', err);
            }
          }
        }
      }
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      const trimmedName = (body.name || '').trim();
      if (!trimmedName) {
        return Response.json({ error: 'Student Name is required.' }, { status: 400 });
      }
      if (!/^[a-zA-Z][a-zA-Z ]*$/.test(trimmedName)) {
        return Response.json({ error: 'Student name can contain only letters and spaces.' }, { status: 400 });
      }
      const formattedName = trimmedName.toUpperCase().replace(/ {2,}/g, ' ');
      if (formattedName.length > 20) {
        return Response.json({ error: 'Student name cannot exceed 20 characters.' }, { status: 400 });
      }
      updates.push('name = ?');
      values.push(formattedName);
    }

    if (body.department !== undefined) {
      const allowedDepts = ['CSE', 'CSY', 'AI&ML', 'AI&DS', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other'];
      const dept = (body.department || '').trim();
      if (!allowedDepts.includes(dept)) {
        return Response.json({ error: 'Invalid department.' }, { status: 400 });
      }
      updates.push('department = ?');
      values.push(dept);
    }

    if (body.section !== undefined) {
      const sec = (body.section || '').trim().toUpperCase();
      if (!/^[A-F]$/.test(sec)) {
        return Response.json({ error: 'Section must be A, B, C, D, E or F.' }, { status: 400 });
      }
      updates.push('section = ?');
      values.push(sec);
    }

    if (body.email !== undefined) {
      updates.push('email = ?');
      values.push(body.email);
    }

    if (body.linkedinUrl !== undefined) {
      updates.push('linkedin_url = ?');
      values.push(body.linkedinUrl);
    }

    if (body.githubUrl !== undefined) {
      updates.push('github_url = ?');
      values.push(body.githubUrl);
    }

    if (body.bio !== undefined) {
      updates.push('bio = ?');
      values.push(body.bio);
    }

    if (body.avatar !== undefined || body.profilePhoto !== undefined) {
      updates.push('avatar = ?');
      const val = body.avatar !== undefined ? body.avatar : body.profilePhoto;
      values.push(val === undefined || val === '' ? null : val);
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