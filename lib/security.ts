export function parseString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function parsePositiveInt(
  value: string | null | undefined,
  max = 100,
  fallback = 0
): number {
  const parsed = Number(value ?? '');
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.trunc(parsed), max);
}

export function ensureMaxLength(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export function parseStudentId(value: unknown): string | null {
  const s = parseString(value).toUpperCase();
  if (!s) return null;
  // Allow letters, numbers, dash, underscore, dot. Limit length to 64.
  const ok = /^[A-Z0-9._-]{3,64}$/.test(s);
  return ok ? s : null;
}

export const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-XSS-Protection': '1; mode=block',
};

export function applySecurityHeaders(headers: Headers) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
}
