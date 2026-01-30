/**
 * API client for backend routes (MySQL-backed).
 * Uses relative URLs; works with same-origin Next.js API routes.
 */

const BASE = '';

async function handleRes<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
  return data as T;
}

export async function apiStudents(): Promise<ApiStudent[]> {
  const res = await fetch(`${BASE}/api/students`);
  return handleRes<ApiStudent[]>(res);
}

export async function apiStudent(id: string): Promise<ApiStudent | null> {
  const res = await fetch(`${BASE}/api/students/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  return handleRes<ApiStudent>(res);
}

export interface ApiStudent {
  id: string;
  userId: string;
  name: string;
  registrationNo: string;
  uniqueId?: string;
  year: number;
  course?: string;
  email: string;
  mobileNo: string;
  department: string;
  section: string;
  linkedinUrl?: string;
  bio?: string;
  skills?: string[];
  avatar?: string;
  academicYear: string;
  projectsUploaded?: number;
  connectionsCount?: number;
  collaborationsCount?: number;
}

export async function apiUpdateStudent(studentId: string, data: Partial<ApiStudent>): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${BASE}/api/students/${encodeURIComponent(studentId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleRes(res);
}

export async function apiAuthValidate(studentId: string, password?: string): Promise<{ found: boolean; student?: ApiStudent }> {
  const res = await fetch(`${BASE}/api/auth/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, password }),
  });
  return handleRes(res);
}

export async function apiAuthSetup(studentId: string, password: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/api/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, password }),
  });
  return handleRes(res);
}

export async function apiProjects(params?: { studentId?: string; category?: string; forUserId?: string }): Promise<ApiProject[]> {
  const q = new URLSearchParams();
  if (params?.studentId) q.set('studentId', params.studentId);
  if (params?.category) q.set('category', params.category);
  if (params?.forUserId) q.set('forUserId', params.forUserId);
  const query = q.toString();
  const res = await fetch(`${BASE}/api/projects${query ? `?${query}` : ''}`);
  return handleRes<ApiProject[]>(res);
}

export async function apiProject(id: string): Promise<ApiProject | null> {
  const res = await fetch(`${BASE}/api/projects/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  return handleRes<ApiProject>(res);
}

export interface ApiProject {
  id: string;
  studentId: string;
  studentName: string;
  academicYear: string;
  title: string;
  description: string;
  category: string;
  uploadedAt: string;
  likes: number;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  savedBy: string[];
  collaborators: string[];
  userHasLiked?: boolean;
}

export async function apiCreateProject(body: {
  studentId: string;
  studentName?: string;
  title: string;
  description?: string;
  category?: string;
  fileName?: string;
  fileSize?: number;
}): Promise<ApiProject> {
  const res = await fetch(`${BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleRes<ApiProject>(res);
}

export async function apiDeleteProject(projectId: string, studentId: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${BASE}/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
  });
  return handleRes<{ deleted: boolean }>(res);
}

export async function apiLikeProject(projectId: string, studentId: string): Promise<{ liked: boolean; likes: number }> {
  const res = await fetch(`${BASE}/api/projects/${encodeURIComponent(projectId)}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
  });
  return handleRes(res);
} 

export async function apiSaveProject(projectId: string, studentId: string): Promise<{ saved: boolean }> {
  const res = await fetch(`${BASE}/api/projects/${encodeURIComponent(projectId)}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
  });
  return handleRes(res);
}

export async function apiJoinProject(projectId: string, studentId: string): Promise<{ joined: boolean; already?: boolean }> {
  const res = await fetch(`${BASE}/api/projects/${encodeURIComponent(projectId)}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
  });
  return handleRes(res);
}

export async function apiConnections(studentId: string): Promise<{
  connections: string[];
  sent: string[];
  received: string[];
}> {
  const res = await fetch(`${BASE}/api/connections?studentId=${encodeURIComponent(studentId)}`);
  return handleRes(res);
}

export async function apiConnectionRequest(fromStudentId: string, toStudentId: string): Promise<{ id: string; status: string }> {
  const res = await fetch(`${BASE}/api/connections/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromStudentId, toStudentId }),
  });
  return handleRes(res);
}

export async function apiConnectionAccept(studentId: string, otherStudentId: string): Promise<{ accepted: boolean }> {
  const res = await fetch(`${BASE}/api/connections/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, otherStudentId }),
  });
  return handleRes(res);
}

export async function apiStats(studentId: string): Promise<{ projectsUploaded: number; connections: number; collaborations: number }> {
  const res = await fetch(`${BASE}/api/stats/${encodeURIComponent(studentId)}`);
  return handleRes(res);
}

export async function apiStatsIncrement(
  studentId: string,
  delta: { projectsUploaded?: number; connections?: number; collaborations?: number }
): Promise<{ projectsUploaded: number; connections: number; collaborations: number }> {
  const res = await fetch(`${BASE}/api/stats/${encodeURIComponent(studentId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(delta),
  });
  return handleRes(res);
}
