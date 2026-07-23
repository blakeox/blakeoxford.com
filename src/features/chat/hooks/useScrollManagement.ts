/**
 * Scroll Management Hook
 *
 * Custom React hook for managing scroll behavior in scrollable containers.
 * Provides automatic scrolling, scroll-to-bottom functionality, and scroll position tracking.
 *
 * @module hooks/useScrollManagement
 */

import { useCallback, useEffect, type RefObject } from 'react';

export interface UseScrollManagementOptions {
  /** Reference to the scrollable container element */
  containerRef: RefObject<HTMLElement | null>;
  /** Whether the container is visible/active */
  enabled: boolean;
  /** Dependency that triggers auto-scroll when changed (e.g., messages array) */
  scrollTrigger?: unknown;
  /** Whether to show scroll-to-latest button */
  showScrollButton: boolean;
  /** Callback to update scroll button visibility */
  onScrollButtonChange: (show: boolean) => void;
  /** Distance threshold (px) from bottom to hide scroll button (default: 48) */
  scrollThreshold?: number;
}

export interface UseScrollManagementReturn {
  /** Scrolls to the bottom of the container */
  scrollToLatest: () => void;
}

/**
 * Custom hook for managing scroll behavior in containers
 *
 * Provides comprehensive scroll management including:
 * - Automatic scrolling when content changes
 * - Manual scroll-to-bottom functionality
 * - Scroll position tracking
 * - Scroll-to-latest button visibility
 *
 * Features:
 * - Auto-scroll on content updates (unless user has scrolled up)
 * - Smooth scroll animation
 * - Distance-based scroll button visibility
 * - Automatic event listener cleanup
 * - Enable/disable control
 *
 * Common use cases:
 * - Chat interfaces with auto-scroll
 * - Activity feeds
 * - Log viewers
 * - Any scrollable content that updates
 *
 * @example
 * ```tsx
 * const { scrollToLatest } = useScrollManagement({
 *   containerRef: scrollContainerRef,
 *   enabled: isOpen,
 *   scrollTrigger: messages,
 *   showScrollButton,
 *   onScrollButtonChange: setShowScrollButton,
 *   scrollThreshold: 48,
 * });
 * ```
 *
 * @param options - Configuration options
 * @returns Scroll control functions
 */
export function useScrollManagement(
  options: UseScrollManagementOptions
): UseScrollManagementReturn {
  const {
    containerRef,
    enabled,
    scrollTrigger,
    showScrollButton,
    onScrollButtonChange,
    scrollThreshold = 48,
  } = options;

  /**
   * Scrolls container to bottom with smooth animation
   * Hides the scroll-to-latest button after scrolling
   */
  const scrollToLatest = useCallback(() => {
    if (!containerRef.current) return;

    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth',
    });

    onScrollButtonChange(false);
  }, [containerRef, onScrollButtonChange]);

  /**
   * Auto-scroll to bottom when content changes
   * Only scrolls if user hasn't manually scrolled up
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || showScrollButton) return;

    container.scrollTo({ top: container.scrollHeight });
  }, [containerRef, scrollTrigger, showScrollButton]);

  /**
   * Track scroll position and update button visibility
   * Shows button when user scrolls up more than threshold distance
   */
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const updateVisibility = () => {
      const distance = container.scrollHeight - (container.scrollTop + container.clientHeight);
      onScrollButtonChange(distance > scrollThreshold);
    };

    // Initial check
    updateVisibility();

    // Listen for scroll events
    container.addEventListener('scroll', updateVisibility);

    return () => {
      container.removeEventListener('scroll', updateVisibility);
    };
  }, [enabled, containerRef, scrollTrigger, onScrollButtonChange, scrollThreshold]);

  return {
    scrollToLatest,
  };
}
