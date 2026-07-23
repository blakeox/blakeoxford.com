import { useMemo } from 'react';
import type { SearchFallback } from '@/lib/chat';

/**
 * Options for the computed values hook
 */
interface UseComputedValuesOptions {
  /** Whether to show all fallback suggestions */
  showFallbackSuggestions: boolean;
  /** Array of fallback search results */
  fallbackResults: SearchFallback[];
}

/**
 * Return type for the computed values hook
 */
interface UseComputedValuesReturn {
  /** Visible fallback results (limited or all) */
  visibleFallbackResults: SearchFallback[];
  /** Whether there are more fallback results to show */
  hasMoreFallbackResults: boolean;
}

/**
 * Custom hook for computed/derived values
 *
 * Manages memoized computed values that are derived from state:
 * - Visible fallback results (respects show/hide toggle)
 * - Whether more results are available
 *
 * This hook consolidates all computed values that don't require
 * their own state management, keeping them organized and memoized
 * for performance.
 *
 * @param options - Configuration including state values
 * @returns Computed values
 *
 * @example
 * ```tsx
 * const { visibleFallbackResults, hasMoreFallbackResults } = useComputedValues({
 *   showFallbackSuggestions,
 *   fallbackResults,
 * });
 *
 * // Use in UI
 * {visibleFallbackResults.map(result => <Result key={result.id} {...result} />)}
 * {hasMoreFallbackResults && <button>Show More</button>}
 * ```
 */
export function useComputedValues(options: UseComputedValuesOptions): UseComputedValuesReturn {
  const { showFallbackSuggestions, fallbackResults } = options;

  // Collapsed = no list (one-line disclosure). Expanded = up to 3 titles.
  const visibleFallbackResults = useMemo(() => {
    return showFallbackSuggestions ? fallbackResults.slice(0, 3) : [];
  }, [showFallbackSuggestions, fallbackResults]);

  const hasMoreFallbackResults = useMemo(() => {
    return showFallbackSuggestions && fallbackResults.length > visibleFallbackResults.length;
  }, [showFallbackSuggestions, fallbackResults.length, visibleFallbackResults.length]);

  return {
    visibleFallbackResults,
    hasMoreFallbackResults,
  };
}
