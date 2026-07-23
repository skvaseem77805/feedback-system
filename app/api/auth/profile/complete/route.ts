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

    // Fetch existing columns in students table dynamically to avoid schema mismatch exceptions
    const [dbCols] = await query<any>('DESCRIBE students');
    const existingCols = new Set((dbCols || []).map(c => (c as any).Field));

    const colsToSelect = ['id', 'name', 'email', 'password_hash', 'registration_no'].filter(c => existingCols.has(c));
    if (colsToSelect.length === 0) {
      return Response.json({ error: 'Database schema mismatch.' }, { status: 500 });
    }

    // 1. Get user info
    const user = await queryOne<any>(
      `SELECT ${colsToSelect.join(', ')} FROM students WHERE registration_no = ? LIMIT 1`,
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

    // 3. Update the student record dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (existingCols.has('department')) {
      updates.push('department = ?');
      values.push(department);
    }
    if (existingCols.has('year')) {
      updates.push('year = ?');
      values.push(numericYear);
    }
    if (existingCols.has('course')) {
      updates.push('course = ?');
      values.push(courseName);
    }
    if (existingCols.has('section')) {
      updates.push('section = ?');
      values.push(section);
    }
    if (existingCols.has('email_verified')) {
      updates.push('email_verified = ?');
      values.push(1);
    }

    if (updates.length > 0) {
      values.push(registrationNo);
      await query(
        `UPDATE students 
         SET ${updates.join(', ')} 
         WHERE registration_no = ?`,
        values
      );
    }

    // 4. Initialize user stats using the user ID retrieved in step 1
    if (user.id) {
      await query(
        `INSERT IGNORE INTO student_stats (student_id, projects_uploaded, connections, collaborations)
         VALUES (?, 0, 0, 0)`,
        [user.id]
      );
    }

    // 5. Invalidate caches immediately so the updated profile data is loaded on the next page
    if (user.id) {
      invalidateStudentsCache();
      invalidateStudent(user.id);
    }

    return Response.json({
      success: true,
      message: 'Profile Created Successfully.'
    });
  } catch (error: any) {
    console.error('Profile Complete API Error:', error);
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
