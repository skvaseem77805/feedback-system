import { NextRequest } from 'next/server';
import { getAdmins } from '@/lib/admins';

export function isAdminAuthorized(request: NextRequest): boolean {
  const authHeaderRaw = request.headers.get('x-admin-auth');
  const adminEmailRaw = request.headers.get('x-admin-email');
  const adminIdRaw = request.headers.get('x-admin-id');

  const authHeader = (authHeaderRaw ?? '').toString().trim().toLowerCase();
  const adminEmail = (adminEmailRaw ?? '').toString().trim().toLowerCase();
  const adminId = (adminIdRaw ?? '').toString().trim().toLowerCase();

  if (authHeader !== 'true') {
    return false;
  }

  const admins = getAdmins();
  return admins.some((admin) => {
    const matchesEmail = !adminEmail || admin.email.toLowerCase() === adminEmail;
    const matchesId = !adminId || (admin.id || '').toLowerCase() === adminId;
    return matchesEmail && matchesId;
  });
}

export function getAdminAuthHeaders(email?: string | null, id?: string | null) {
  return {
    'x-admin-auth': 'true',
    'x-admin-email': email || '',
    'x-admin-id': id || '',
  } as Record<string, string>;
}
