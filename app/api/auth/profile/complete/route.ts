import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const registrationNo = (body.registrationNo || '').trim().toUpperCase();
    const department = (body.department || '').trim();
    const year = (body.year || '').trim();
    const section = (body.section || '').trim();

    if (!registrationNo || !department || !year || !section) {
      return Response.json({ error: 'All fields are mandatory.' }, { status: 400 });
    }

    // 1. Get user info
    const user = await queryOne<{ name: string; email: string; password_hash: string }>(
      'SELECT name, email, password_hash FROM students WHERE registration_no = ? LIMIT 1',
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

    // Get the actual students.id
    const studentRow = await queryOne<{ id: string | number }>(
      'SELECT id FROM students WHERE registration_no = ? LIMIT 1',
      [registrationNo]
    );

    if (!studentRow) {
      return Response.json({ error: 'User is not registered.' }, { status: 400 });
    }

    // 5. Initialize user stats
    await query(
      `INSERT IGNORE INTO student_stats (student_id, projects_uploaded, connections, collaborations)
       VALUES (?, 0, 0, 0)`,
      [studentRow.id]
    );

    return Response.json({
      success: true,
      message: 'Profile Created Successfully.'
    });
  } catch (error) {
    console.error('Profile Complete API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
