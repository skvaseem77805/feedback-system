import { NextRequest } from 'next/server';
import { getPool, query, queryOne } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { parsePositiveInt, parseString } from '@/lib/security';

function formatYear(year: number | null | undefined): string {
    const m: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: 'Final' };
    return m[Number(year)] ?? `${year ?? 0}th`;
}

function parseSortField(value: string | null): 'name' | 'year' | 'department' | 'created_at' {
    switch (value) {
        case 'year':
        case 'department':
        case 'created_at':
            return value;
        case 'name':
        default:
            return 'name';
    }
}

function parseSortDirection(value: string | null): 'ASC' | 'DESC' {
    return value?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
}

export async function GET(request: NextRequest) {

    if (!isAdminAuthorized(request)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = parsePositiveInt(searchParams.get('page'), 1000, 1);
        const pageSize = parsePositiveInt(searchParams.get('pageSize'), 100, 20);
        const search = parseString(searchParams.get('search'));
        const yearParam = parseString(searchParams.get('year'));
        const branchParam = parseString(searchParams.get('branch'));
        const sortField = parseSortField(searchParams.get('sortField'));
        const sortDirection = parseSortDirection(searchParams.get('sortDirection'));

        const offset = (page - 1) * pageSize;
        const like = `%${search}%`;

        const whereClauses: string[] = [];
        const values: Array<string | number | null> = [];

        if (search) {
            whereClauses.push('(s.name LIKE ? OR s.registration_no LIKE ? OR s.email LIKE ? OR s.id LIKE ?)');
            values.push(like, like, like, like);
        }

        if (yearParam) {
            whereClauses.push('s.year = ?');
            values.push(Number(yearParam));
        }

        if (branchParam) {
            whereClauses.push('s.department = ?');
            values.push(branchParam);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const countSql = `
      SELECT COUNT(*) AS total
      FROM students s
      ${whereSql}
    `;
        const [[countRow]] = await query<{ total: number }>(countSql, values);
        const total = Number(countRow?.total || 0);

        const selectSql = `
      SELECT
        s.id,
        s.name,
        s.registration_no,
        s.unique_id,
        s.year,
        s.course,
        s.email,
        s.mobile_no,
        s.department,
        s.section,
        s.linkedin_url,
        s.github_url,
        s.bio,
        s.skills,
        s.avatar,
        s.created_at,
        COALESCE(ss.projects_uploaded, 0) AS projects_uploaded,
        COALESCE(ss.connections, 0) AS connections,
        COALESCE(ss.collaborations, 0) AS collaborations
      FROM students s
      LEFT JOIN student_stats ss ON ss.student_id = s.id
      ${whereSql}
      ORDER BY s.${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

        const queryParams = [...values, pageSize, offset];
        const [rows] = await query<any>(
            selectSql,
            queryParams
        );

        const students = rows.map((row: any) => {
            let skills: string[] = [];
            if (row.skills) {
                try {
                    skills = typeof row.skills === 'string' ? JSON.parse(row.skills) : row.skills;
                } catch {
                    skills = [];
                }
            }

            return {
                id: row.id,
                userId: row.id,
                name: row.name,
                registrationNo: row.registration_no,
                uniqueId: row.unique_id,
                year: Number(row.year),
                course: row.course,
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
                createdAt: row.created_at,
                projectsUploaded: Number(row.projects_uploaded) || 0,
                connectionsCount: Number(row.connections) || 0,
                collaborationsCount: Number(row.collaborations) || 0,
            };
        });

        return Response.json({
            students,
            page,
            pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        });
    } catch (error: any) {
        console.error(error);

        return Response.json(
            {
                message: error?.message,
                code: error?.code,
                sqlMessage: error?.sqlMessage,
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    if (!isAdminAuthorized(request)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const studentId = parseString(body?.id || body?.studentId || body?.rollNumber).toUpperCase();
        const name = parseString(body?.name);
        const registrationNo = parseString(body?.registrationNo || body?.registration_no || studentId);
        const year = Number(body?.year ?? body?.academicYear ?? 0);
        const course = parseString(body?.course || body?.branch);
        const email = parseString(body?.email).toLowerCase();
        const mobileNo = parseString(body?.mobileNo || body?.phone);
        const department = parseString(body?.department || body?.branch || 'CSE');
        const section = parseString(body?.section || 'E');
        const linkedinUrl = parseString(body?.linkedinUrl);
        const githubUrl = parseString(body?.githubUrl);
        const bio = parseString(body?.bio);
        const skills = Array.isArray(body?.skills) ? body.skills : [];
        const avatar = parseString(body?.avatar);

        if (!studentId || !name) {
            return Response.json({ error: 'Student ID and name are required' }, { status: 400 });
        }

        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            const existing = await connection.query(
                'SELECT id FROM students WHERE id = ? LIMIT 1',
                [studentId]
            );

            if (Array.isArray(existing[0]) && existing[0].length > 0) {
                await connection.query(
                    `
            UPDATE students
            SET name = ?, registration_no = ?, year = ?, course = ?, email = ?, mobile_no = ?, department = ?, section = ?, linkedin_url = ?, github_url = ?, bio = ?, skills = ?, avatar = ?
            WHERE id = ?
          `,
                    [name, registrationNo, Number.isFinite(year) ? year : 2, course, email, mobileNo, department, section, linkedinUrl || null, githubUrl || null, bio || null, JSON.stringify(skills), avatar || null, studentId]
                );
            } else {
                await connection.query(
                    `
            INSERT INTO students (
              id, name, registration_no, unique_id, year, course, email, mobile_no, department, section, linkedin_url, github_url, bio, skills, avatar
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
                    [studentId, name, registrationNo, registrationNo, Number.isFinite(year) ? year : 2, course, email, mobileNo, department, section, linkedinUrl || null, githubUrl || null, bio || null, JSON.stringify(skills), avatar || null]
                );
            }

            await connection.query(
                `
          INSERT INTO student_stats (student_id, projects_uploaded, connections, collaborations)
          VALUES (?, 0, 0, 0)
          ON DUPLICATE KEY UPDATE student_id = student_id
        `,
                [studentId]
            );

            await connection.commit();
            return Response.json({ success: true, message: 'Student saved successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);

        return Response.json(
            { error: "Database error" },
            { status: 500 }
        );
    }
}