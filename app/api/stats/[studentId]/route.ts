import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { invalidateStudent } from '@/lib/services/students';
import { parseStudentId } from '@/lib/security';
import { recalculateAndSyncStats } from '@/lib/services/stats';

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

    // Resolve sid to actual students.id
    const studentRow = await queryOne<{ id: string | number }>(
      'SELECT id FROM students WHERE id = ? OR registration_no = ? LIMIT 1',
      [sid, sid]
    );
    if (!studentRow) {
      return Response.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    const actualSid = studentRow.id;

    // Recalculate stats dynamically from the actual tables
    const stats = await recalculateAndSyncStats(actualSid);

    return Response.json({
      projectsUploaded: stats.projectsUploaded,
      connections: stats.connections,
      collaborations: stats.collaborations,
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

    // Resolve sid to actual students.id
    const studentRow = await queryOne<{ id: string | number }>(
      'SELECT id FROM students WHERE id = ? OR registration_no = ? LIMIT 1',
      [sid, sid]
    );
    if (!studentRow) {
      return Response.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    const actualSid = studentRow.id;

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
        [actualSid]
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
        actualSid,
        projectsUploaded,
        connections,
        collaborations,
      ]
    );

    // Sync from source-of-truth tables to overwrite any manual offsets with correct dynamic stats
    const syncedStats = await recalculateAndSyncStats(actualSid);

    return Response.json({
      projectsUploaded: syncedStats.projectsUploaded,
      connections: syncedStats.connections,
      collaborations: syncedStats.collaborations,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}