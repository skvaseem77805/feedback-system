import { NextRequest } from 'next/server';
import { getAdmins } from '@/lib/admins';

// Checks admin auth either via custom request headers (existing behavior)
// or via cookies (fallback). Some production proxies or CDNs may strip
// custom client headers; reading cookies provides a more reliable signal
// while preserving the existing security model.
export function isAdminAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-admin-auth') ?? request.cookies.get('adminAuth')?.value;
  const adminEmail = (request.headers.get('x-admin-email')?.trim().toLowerCase()) ?? request.cookies.get('adminEmail')?.value?.trim().toLowerCase();
  const adminId = (request.headers.get('x-admin-id')?.trim().toLowerCase()) ?? request.cookies.get('adminId')?.value?.trim().toLowerCase();

  if (authHeader === 'true') {
    return true;
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
