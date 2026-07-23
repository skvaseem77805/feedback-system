import { NextRequest } from 'next/server';
import { queryOne, query, getPool } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const registrationNo = (body.registrationNo || '').trim().toUpperCase();
    const name = (body.name || '').trim().toUpperCase().replace(/ {2,}/g, ' ');
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const otp = (body.otp || '').trim();

    if (!registrationNo || !name || !email || !password || !otp) {
      return Response.json({ error: 'All fields and OTP are required.' }, { status: 400 });
    }

    // 1. Fetch OTP record
    const otpRecord = await queryOne<{ otp: string; expiry: string | Date }>(
      'SELECT otp, expiry FROM otps WHERE email = ? LIMIT 1',
      [email]
    );

    if (!otpRecord) {
      return Response.json({ error: 'Incorrect OTP.' }, { status: 400 });
    }

    // 2. Validate OTP match
    if (otpRecord.otp !== otp) {
      return Response.json({ error: 'Incorrect OTP.' }, { status: 400 });
    }

    // 3. Validate expiry
    const expiryTime = new Date(otpRecord.expiry).getTime();
    if (expiryTime < Date.now()) {
      return Response.json({ error: 'OTP expired.' }, { status: 400 });
    }

    // 4. Delete OTP immediately upon success
    await query('DELETE FROM otps WHERE email = ?', [email]);

    // 5. Hash password using bcrypt
    const passwordHash = await hashPassword(password);

    // 6. Insert student user directly into students table using a transaction
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let actualStudentId: string | number | null = null;

      // Check if registration number already exists in students table
      const [existingRows] = await connection.query(
        'SELECT id, created_at FROM students WHERE registration_no = ? LIMIT 1',
        [registrationNo]
      );

      if (Array.isArray(existingRows) && existingRows.length > 0) {
        // Exists: Update only authentication-related fields
        const existingStudent = existingRows[0] as any;
        const studentId = existingStudent.id;
        const hasCreatedVal = existingStudent.created_at !== null;
        
        await connection.query(
          `UPDATE students 
           SET name = ?, email = ?, password_hash = ?, email_verified = 1${hasCreatedVal ? '' : ', created_at = CURRENT_TIMESTAMP'}
           WHERE id = ?`,
          [name.toUpperCase(), email, passwordHash, studentId]
        );
        actualStudentId = studentId;
      } else {
        // Does not exist: Insert a new student row
        let insertResult: any;
        try {
          // Try inserting without specifying id (if it is auto-increment)
          const [res] = await connection.query(
            `INSERT INTO students (name, registration_no, email, password_hash, email_verified, created_at)
             VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [name.toUpperCase(), registrationNo, email, passwordHash]
          );
          insertResult = res;
        } catch (e) {
          // Fallback to inserting registrationNo as id
          const [res] = await connection.query(
            `INSERT INTO students (id, name, registration_no, email, password_hash, email_verified, created_at)
             VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            [registrationNo, name.toUpperCase(), registrationNo, email, passwordHash]
          );
          insertResult = res;
        }

        if (insertResult && insertResult.insertId) {
          actualStudentId = insertResult.insertId;
        } else {
          // Lookup the ID
          const [lookupRows] = await connection.query(
            'SELECT id FROM students WHERE registration_no = ? LIMIT 1',
            [registrationNo]
          );
          if (Array.isArray(lookupRows) && lookupRows.length > 0) {
            actualStudentId = (lookupRows[0] as any).id;
          }
        }
      }

      if (!actualStudentId) {
        throw new Error('Failed to obtain student ID after insertion/update.');
      }

      // Insert stats using numeric / actual ID
      await connection.query(
        `INSERT INTO student_stats (student_id, projects_uploaded, connections, collaborations)
         VALUES (?, 0, 0, 0)
         ON DUPLICATE KEY UPDATE student_id = student_id`,
        [actualStudentId]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return Response.json({
      success: true,
      message: 'Registration Completed Successfully.'
    });
  } catch (error) {
    console.error('Verify OTP API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
