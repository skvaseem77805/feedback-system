import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { parseStudentId } from '@/lib/security';
import { recalculateAndSyncStats } from '@/lib/services/stats';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const body = await request.json().catch(() => ({}));

    const studentId = parseStudentId(body?.studentId || body?.student_id);

    if (!projectId || !studentId) {
      return Response.json(
        { error: 'projectId and studentId required' },
        { status: 400 }
      );
    }

    // Check if already joined
    const existing = await queryOne<any>(
      `
      SELECT student_id
      FROM project_collaborators
      WHERE project_id = ?
      AND student_id = ?
      `,
      [projectId, studentId]
    );

    if (existing) {
      return Response.json({
        joined: false,
        already: true,
      });
    }

    // Add collaborator to legacy table
    await query(
      `
      INSERT INTO project_collaborators
      (project_id, student_id)
      VALUES (?, ?)
      `,
      [projectId, studentId]
    );

    // Add collaborator to status-based collaborators table
    const collabId = `collab-${studentId}-${projectId}-${Date.now()}`;
    await query(
      `
      INSERT INTO collaborators (id, project_id, student_id, role, status)
      VALUES (?, ?, ?, 'COLLABORATOR', 'ACCEPTED')
      ON DUPLICATE KEY UPDATE status = 'ACCEPTED'
      `,
      [collabId, projectId, studentId]
    );

    // Recalculate stats for the student
    await recalculateAndSyncStats(studentId);

    return Response.json({
      joined: true,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}