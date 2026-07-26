import { NextRequest } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { updateAdminProject, deleteAdminProject } from '@/lib/services/admin-projects';
import { getProjectById } from '@/lib/services/projects';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    return Response.json(project);
  } catch (error: any) {
    console.error('get admin project detail error:', error);
    return Response.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const adminEmail = request.headers.get('x-admin-email') || 'Admin';

    const result = await updateAdminProject(id, body, adminEmail);
    return Response.json(result);
  } catch (error: any) {
    console.error('update admin project error:', error);
    return Response.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const adminEmail = request.headers.get('x-admin-email') || 'Admin';

    const result = await deleteAdminProject(id, adminEmail);
    return Response.json(result);
  } catch (error: any) {
    console.error('delete admin project error:', error);
    return Response.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
