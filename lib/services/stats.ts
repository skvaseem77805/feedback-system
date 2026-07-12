import { query } from '@/lib/db';
import { invalidateStudent } from '@/lib/services/students';

/**
 * Recalculates the actual statistics for a student from source-of-truth tables
 * and updates the student_stats cache table.
 */
export async function recalculateAndSyncStats(
  studentId: string,
  conn?: any
): Promise<{ projectsUploaded: number; connections: number; collaborations: number }> {
  // Use connection from parameter (useful for transactions) or fallback to global query
  const queryExecutor = conn || {
    query: async (sql: string, params?: any[]) => {
      const [rows] = await query<any>(sql, params);
      return [rows];
    },
  };

  // 1. Projects uploaded (created by this user)
  const [uploadedRows] = await queryExecutor.query(
    `SELECT COUNT(*) AS count FROM projects WHERE student_id = ?`,
    [studentId]
  );
  const projectsUploaded = Number(uploadedRows?.[0]?.count) || 0;

  // 2. Collaborations (accepted collaborations where student is COLLABORATOR)
  const [collabRows] = await queryExecutor.query(
    `SELECT COUNT(*) AS count FROM collaborators WHERE student_id = ? AND role = 'COLLABORATOR' AND status = 'ACCEPTED'`,
    [studentId]
  );
  const collaborations = Number(collabRows?.[0]?.count) || 0;

  // 3. Connections (accepted connection requests)
  const [connRows] = await queryExecutor.query(
    `SELECT COUNT(*) AS count FROM connection_requests WHERE (from_student_id = ? OR to_student_id = ?) AND status = 'accepted'`,
    [studentId, studentId]
  );
  const connections = Number(connRows?.[0]?.count) || 0;

  // Update student_stats cache table
  await queryExecutor.query(
    `
    INSERT INTO student_stats (student_id, projects_uploaded, connections, collaborations)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      projects_uploaded = VALUES(projects_uploaded),
      connections = VALUES(connections),
      collaborations = VALUES(collaborations)
    `,
    [studentId, projectsUploaded, connections, collaborations]
  );

  // Invalidate students cache in Next.js backend
  try {
    invalidateStudent(studentId);
  } catch (err) {
    console.error('[recalculateAndSyncStats] Cache invalidation error:', err);
  }

  return {
    projectsUploaded,
    connections,
    collaborations,
  };
}
