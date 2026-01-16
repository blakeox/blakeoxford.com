/**
 * useMediaQuery - Hook for responsive media query matching
 *
 * Tracks whether a CSS media query matches, with SSR-safe implementation.
 * Returns false during SSR and updates on mount to prevent hydration mismatches.
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 * ```
 *
 * @param query - CSS media query string
 * @returns Whether the media query currently matches
 */
import { useCallback, useSyncExternalStore } from 'react';

/**
 * Custom hook to track CSS media query matches
 * Uses useSyncExternalStore for optimal performance and concurrent rendering support
 */
export function useMediaQuery(query: string): boolean {
  // Server-side rendering: always return false to avoid hydration mismatch
  const getServerSnapshot = useCallback((): boolean => false, []);

  // Get current snapshot from the media query
  const getSnapshot = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  }, [query]);

  // Subscribe to media query changes
  const subscribe = useCallback(
    (callback: () => void): (() => void) => {
      if (typeof window === 'undefined') return () => {};

      const mediaQuery = window.matchMedia(query);

      // Modern browsers support addEventListener
      mediaQuery.addEventListener('change', callback);

      return () => {
        mediaQuery.removeEventListener('change', callback);
      };
    },
    [query]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Predefined media query hooks for common breakpoints
 * Matches Tailwind CSS default breakpoints
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}
