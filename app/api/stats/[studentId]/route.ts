import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { invalidateStudent } from '@/lib/services/students';
import { parseStudentId } from '@/lib/security';

/**
 * GET /api/stats/[studentId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const sid = parseStudentId(studentId);

    if (!sid) {
      return Response.json(
        { error: 'studentId required' },
        { status: 400 }
      );
    }

    const row = await queryOne<any>(
      `
      SELECT
        projects_uploaded,
        connections,
        collaborations
      FROM student_stats
      WHERE student_id = ?
      LIMIT 1
      `,
      [sid]
    );

    if (!row) {
      return Response.json({
        projectsUploaded: 0,
        connections: 0,
        collaborations: 0,
      });
    }

    return Response.json({
      projectsUploaded: Number(row.projects_uploaded) || 0,
      connections: Number(row.connections) || 0,
      collaborations: Number(row.collaborations) || 0,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/stats/[studentId]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const sid = parseStudentId(studentId);

    if (!sid) {
      return Response.json(
        { error: 'studentId required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const set = body?.set;

    let projectsUploaded = 0;
    let connections = 0;
    let collaborations = 0;

    if (set && typeof set === 'object') {
      projectsUploaded = Number(set.projectsUploaded) || 0;
      connections = Number(set.connections) || 0;
      collaborations = Number(set.collaborations) || 0;
    } else {
      const current = await queryOne<any>(
        `
        SELECT
          projects_uploaded,
          connections,
          collaborations
        FROM student_stats
        WHERE student_id = ?
        LIMIT 1
        `,
        [sid]
      );

      const curP = Number(current?.projects_uploaded) || 0;
      const curC = Number(current?.connections) || 0;
      const curCol = Number(current?.collaborations) || 0;

      const incP = Number(body?.projectsUploaded) || 0;
      const incC = Number(body?.connections) || 0;
      const incCol = Number(body?.collaborations) || 0;

      if (incP === 0 && incC === 0 && incCol === 0) {
        return Response.json(
          {
            error:
              'Provide projectsUploaded, connections or collaborations',
          },
          { status: 400 }
        );
      }

      projectsUploaded = curP + incP;
      connections = curC + incC;
      collaborations = curCol + incCol;
    }

    await query(
      `
      INSERT INTO student_stats
      (
        student_id,
        projects_uploaded,
        connections,
        collaborations
      )
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        projects_uploaded = VALUES(projects_uploaded),
        connections = VALUES(connections),
        collaborations = VALUES(collaborations)
      `,
      [
        sid,
        projectsUploaded,
        connections,
        collaborations,
      ]
    );
    // Invalidate student cache after stats update
    invalidateStudent(sid);
    return Response.json({
      projectsUploaded,
      connections,
      collaborations,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}