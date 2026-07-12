'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook for context-aware origin-based Back navigation.
 * Uses query parameter `?from=...` to determine the exact previous page
 * and falls back to browser history or default fallback when not available.
 */
export function useSafeBack() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const safeBack = useCallback((fallbackRoute: string = '/projects') => {
    const from = searchParams.get('from');

    if (from === 'profile') {
      router.push('/profile');
    } else if (from === 'projects') {
      router.push('/projects');
    } else if (from === 'saved') {
      router.push('/saved-projects');
    } else if (from === 'notifications') {
      router.push('/notifications');
    } else if (from === 'collaborations') {
      router.push('/profile?tab=collaborations');
    } else if (from && from.startsWith('student-')) {
      const studentId = from.replace('student-', '');
      router.push(`/student/${studentId}`);
    } else {
      // Default fallback behavior: call browser back if history exists
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push(fallbackRoute);
      }
    }
  }, [router, searchParams]);

  return safeBack;
}
