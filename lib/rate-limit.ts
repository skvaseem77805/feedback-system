import type { NextRequest } from 'next/server';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

type RateLimitState = {
  count: number;
  firstAttempt: number;
};

const attempts = new Map<string, RateLimitState>();

export function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

export function enforceRateLimit(key: string) {
  const now = Date.now();
  const state = attempts.get(key);

  if (!state || now - state.firstAttempt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttempt: now });
    return {
      allowed: true,
      remaining: MAX_ATTEMPTS - 1,
    };
  }

  if (state.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((state.firstAttempt + WINDOW_MS - now) / 1000),
      remaining: 0,
    };
  }

  state.count += 1;
  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - state.count,
  };
}
