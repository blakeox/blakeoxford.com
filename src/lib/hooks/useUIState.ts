/**
 * UI State Management Hook
 *
 * Custom React hook for managing multiple boolean UI states and expandable items.
 * Provides a clean API for toggling visibility states and managing expanded/collapsed items.
 *
 * @module hooks/useUIState
 */

import { useCallback, useState } from 'react';

export interface UseUIStateReturn {
  /** UI toggle states */
  showDigest: boolean;
  showAnalytics: boolean;
  showAdvancedControls: boolean;
  showFallbackSuggestions: boolean;
  composerFocused: boolean;
  showScrollToLatest: boolean;

  /** Expandable items state */
  expandedSources: Record<string, boolean>;
  expandedIndividualSources: Record<string, boolean>;

  /** Toggle functions */
  toggleDigest: () => void;
  toggleAnalytics: () => void;
  toggleAdvancedControls: () => void;
  setShowFallbackSuggestions: (show: boolean) => void;
  setComposerFocused: (focused: boolean) => void;
  setShowScrollToLatest: (show: boolean) => void;

  /** Expandable item functions */
  toggleExpandedSource: (messageId: string) => void;
  toggleIndividualSource: (sourceKey: string) => void;
  setExpandedSources: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setExpandedIndividualSources: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

/**
 * Custom hook for managing UI state in chat components
 *
 * Consolidates multiple boolean states and expandable item management into a single hook.
 * Provides clean, consistent API for toggling UI elements and managing expanded states.
 *
 * Features:
 * - Boolean toggle states for various UI elements
 * - Expandable source management with per-item tracking
 * - Individual source expansion tracking
 * - Type-safe state management
 * - Memoized toggle functions
 *
 * @returns UI state values and control functions
 *
 * @example
 * ```tsx
 * const {
 *   showDigest,
 *   toggleDigest,
 *   expandedSources,
 *   toggleExpandedSource
 * } = useUIState();
 *
 * // Toggle digest panel
 * <button onClick={toggleDigest}>
 *   {showDigest ? 'Hide' : 'Show'} Digest
 * </button>
 *
 * // Toggle source expansion
 * <button onClick={() => toggleExpandedSource(messageId)}>
 *   {expandedSources[messageId] ? 'Collapse' : 'Expand'} Sources
 * </button>
 * ```
 */
export function useUIState(): UseUIStateReturn {
  // Boolean UI states
  const [showDigest, setShowDigest] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [showFallbackSuggestions, setShowFallbackSuggestions] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);

  // Expandable items state
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [expandedIndividualSources, setExpandedIndividualSources] = useState<
    Record<string, boolean>
  >({});

  // Toggle functions
  const toggleDigest = useCallback(() => {
    setShowDigest((prev) => !prev);
  }, []);

  const toggleAnalytics = useCallback(() => {
    setShowAnalytics((prev) => !prev);
  }, []);

  const toggleAdvancedControls = useCallback(() => {
    setShowAdvancedControls((prev) => !prev);
  }, []);

  const toggleExpandedSource = useCallback((messageId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  }, []);

  const toggleIndividualSource = useCallback((sourceKey: string) => {
    setExpandedIndividualSources((prev) => ({
      ...prev,
      [sourceKey]: !prev[sourceKey],
    }));
  }, []);

  return {
    // Boolean states
    showDigest,
    showAnalytics,
    showAdvancedControls,
    showFallbackSuggestions,
    composerFocused,
    showScrollToLatest,

    // Expandable states
    expandedSources,
    expandedIndividualSources,

    // Toggle functions
    toggleDigest,
    toggleAnalytics,
    toggleAdvancedControls,
    setShowFallbackSuggestions,
    setComposerFocused,
    setShowScrollToLatest,

    // Expandable functions
    toggleExpandedSource,
    toggleIndividualSource,
    setExpandedSources,
    setExpandedIndividualSources,
  };
}
