import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  applySecurityHeaders(response.headers);
  return response;
}
