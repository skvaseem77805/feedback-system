import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { invalidateStudentsCache, invalidateStudent } from '@/lib/services/students';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const registrationNo = (body.registrationNo || '').trim().toUpperCase();
    const department = (body.department || '').trim();
    const year = (body.year || '').trim();
    const section = (body.section || '').trim().toUpperCase();

    if (!registrationNo || !department || !year || !section) {
      return Response.json({ error: 'All fields are mandatory.' }, { status: 400 });
    }

    // Backend validation of Section
    if (!/^[A-F]$/.test(section)) {
      return Response.json({ error: 'Section must be a single uppercase character from A to F.' }, { status: 400 });
    }

    // 1. Get user info
    const user = await queryOne<{ id: string; name: string; email: string; password_hash: string }>(
      'SELECT id, name, email, password_hash FROM students WHERE registration_no = ? LIMIT 1',
      [registrationNo]
    );

    if (!user) {
      return Response.json({ error: 'User is not registered.' }, { status: 400 });
    }

    // 2. Map year dropdown values to numerical representation for students table
    let numericYear = 2;
    if (year.includes('1')) numericYear = 1;
    else if (year.includes('2')) numericYear = 2;
    else if (year.includes('3')) numericYear = 3;
    else if (year.includes('4')) numericYear = 4;

    const courseName = `B.Tech- ${department}`;

    // 3. Update the student record in students table
    await query(
      `UPDATE students 
       SET department = ?, year = ?, course = ?, section = ?, email_verified = 1 
       WHERE registration_no = ?`,
      [department, numericYear, courseName, section, registrationNo]
    );

    // 4. Initialize user stats using the user ID retrieved in step 1
    await query(
      `INSERT IGNORE INTO student_stats (student_id, projects_uploaded, connections, collaborations)
       VALUES (?, 0, 0, 0)`,
      [user.id]
    );

    // 5. Invalidate caches immediately so the updated profile data is loaded on the next page
    invalidateStudentsCache();
    invalidateStudent(user.id);

    return Response.json({
      success: true,
      message: 'Profile Created Successfully.'
    });
  } catch (error: any) {
    console.error('Profile Complete API Error:', error);
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
