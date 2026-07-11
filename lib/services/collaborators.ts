import { query } from '@/lib/db';

export interface Collaborator {
  id: string;
  projectId: string;
  studentId: string;
  role: 'OWNER' | 'COLLABORATOR';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

export async function addCollaborator(params: {
  id: string;
  projectId: string;
  studentId: string;
  role: 'OWNER' | 'COLLABORATOR';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}): Promise<void> {
  await query(
    `INSERT INTO collaborators (id, project_id, student_id, role, status)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role), status = VALUES(status)`,
    [params.id, params.projectId, params.studentId, params.role, params.status]
  );
}

export async function updateCollaboratorStatus(
  projectId: string,
  studentId: string,
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
): Promise<void> {
  await query(
    `UPDATE collaborators SET status = ? WHERE project_id = ? AND student_id = ?`,
    [status, projectId, studentId]
  );
}

export async function getCollaborators(projectId: string): Promise<Collaborator[]> {
  const [rows] = await query<any>(
    `SELECT id, project_id, student_id, role, status, created_at, updated_at
     FROM collaborators
     WHERE project_id = ?`,
    [projectId]
  );
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r: any) => ({
    id: r.id,
    projectId: r.project_id,
    studentId: r.student_id,
    role: r.role,
    status: r.status,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  }));
}

export async function getAcceptedCollaborators(projectId: string): Promise<Collaborator[]> {
  const [rows] = await query<any>(
    `SELECT id, project_id, student_id, role, status, created_at, updated_at
     FROM collaborators
     WHERE project_id = ? AND status = 'ACCEPTED'`,
    [projectId]
  );
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r: any) => ({
    id: r.id,
    projectId: r.project_id,
    studentId: r.student_id,
    role: r.role,
    status: r.status,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  }));
}

export async function getPendingCollaborators(projectId: string): Promise<Collaborator[]> {
  const [rows] = await query<any>(
    `SELECT id, project_id, student_id, role, status, created_at, updated_at
     FROM collaborators
     WHERE project_id = ? AND status = 'PENDING'`,
    [projectId]
  );
  const arr = Array.isArray(rows) ? rows : [];
  return arr.map((r: any) => ({
    id: r.id,
    projectId: r.project_id,
    studentId: r.student_id,
    role: r.role,
    status: r.status,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  }));
}
