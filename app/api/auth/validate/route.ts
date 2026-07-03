import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import { comparePassword } from '@/lib/auth-utils';import { NextRequest } from "next/server";
// import { queryOne } from "@/lib/db";
// import { comparePassword } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const studentId = (body?.studentId || body?.student_id || '')
      .trim()
      .toUpperCase();

    const password = body?.password || '';

    if (!studentId) {
      return Response.json(
        { error: 'Student ID required' },
        { status: 400 }
      );
    }

    if (!password) {
      return Response.json(
        { error: 'Password required' },
        { status: 400 }
      );
    }

    console.log("Student ID received:", studentId);

const row = await queryOne<{
  id: string;
  name: string;
  registration_no: string;
  year: number;
  course: string;
  email: string;
  mobile_no: string;
  department: string;
  section: string;
  password_hash: string | null;
}>(
  `
  SELECT
    id,
    name,
    registration_no,
    year,
    course,
    email,
    mobile_no,
    department,
    section,
    password_hash
  FROM students
  WHERE id = ?
  LIMIT 1
  `,
  [studentId]
);

console.log("DB Row:", row);

    if (!row) {
      return Response.json(
        {
          error: 'Student ID not found in database',
          found: false,
        },
        { status: 404 }
      );
    }

    if (password === studentId) {
      // Allow login with Student ID as password
    } else {
      if (!row.password_hash) {
        return Response.json(
          {
            error: 'Account not set up for login.',
            found: true,
          },
          { status: 401 }
        );
      }

      const isValid = await comparePassword(
        password,
        row.password_hash
      );

      if (!isValid) {
        return Response.json(
          {
            error: 'Invalid password',
            found: true,
          },
          { status: 401 }
        );
      }
    }

    const academicYear = formatYear(row.year);

    return Response.json({
      found: true,
      student: {
        id: row.id,
        userId: row.id,
        name: row.name,
        registrationNo: row.registration_no,
        year: row.year,
        course: row.course,
        email: row.email || '',
        mobileNo: row.mobile_no || '',
        department: row.department || 'CSE',
        section: row.section || 'E',
        academicYear,
      },
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

function formatYear(year: number): string {
  switch (year) {
    case 1:
      return '1st';
    case 2:
      return '2nd';
    case 3:
      return '3rd';
    case 4:
      return 'Final';
    default:
      return `${year}th`;
  }
}