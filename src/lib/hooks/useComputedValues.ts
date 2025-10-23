import { useMemo } from 'react';
import type { SearchFallback } from '../chat-types.js';

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

	// Limit preview to 2 results when not expanded
	const fallbackPreviewLimit = 2;

	// Compute visible fallback results based on toggle state
	const visibleFallbackResults = useMemo(() => {
		return showFallbackSuggestions
			? fallbackResults
			: fallbackResults.slice(0, fallbackPreviewLimit);
	}, [showFallbackSuggestions, fallbackResults, fallbackPreviewLimit]);

	// Check if there are more results available
	const hasMoreFallbackResults = useMemo(() => {
		return fallbackResults.length > visibleFallbackResults.length;
	}, [fallbackResults.length, visibleFallbackResults.length]);

	return {
		visibleFallbackResults,
		hasMoreFallbackResults,
	};
}
