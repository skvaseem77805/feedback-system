import { useState, useEffect, useCallback } from 'react';

/**
 * Utility functions and reusable hooks for state preservation and scroll restoration
 * across page navigations in the CRR Project Hub application.
 */

export function savePageState<T extends Record<string, any>>(pageKey: string, state: T): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`page_state_${pageKey}`, JSON.stringify(state));
  } catch (e) {
    // Ignore storage quota errors
  }
}

export function loadPageState<T extends Record<string, any>>(pageKey: string, defaultState: T): T {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = sessionStorage.getItem(`page_state_${pageKey}`);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch (e) {
    return defaultState;
  }
}

export function saveScrollPosition(pageKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`scroll_pos_${pageKey}`, String(window.scrollY));
  } catch (e) {
    // Ignore
  }
}

export function restoreScrollPosition(pageKey: string, delayMs = 60): void {
  if (typeof window === 'undefined') return;
  try {
    const saved = sessionStorage.getItem(`scroll_pos_${pageKey}`);
    if (saved !== null) {
      const scrollY = parseInt(saved, 10);
      if (!isNaN(scrollY) && scrollY > 0) {
        setTimeout(() => {
          window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
        }, delayMs);
      }
    }
  } catch (e) {
    // Ignore
  }
}

/**
 * Scalable, reusable React Hook for state and scroll preservation across all pages.
 */
export function usePreservedState<T extends Record<string, any>>(
  pageKey: string,
  initialState: T
): [T, (updates: Partial<T> | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(() => loadPageState(pageKey, initialState));

  useEffect(() => {
    savePageState(pageKey, state);
  }, [pageKey, state]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (window.scrollY > 0) {
        saveScrollPosition(pageKey);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pageKey]);

  const updateState = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      return next;
    });
  }, []);

  const restoreScroll = useCallback(() => {
    restoreScrollPosition(pageKey);
  }, [pageKey]);

  return [state, updateState, restoreScroll];
}
