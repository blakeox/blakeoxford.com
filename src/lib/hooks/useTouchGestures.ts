/**
 * Touch Gestures Hook
 *
 * Custom React hook for managing touch gestures like swipe-to-dismiss.
 * Provides touch event handlers and state management for gesture interactions.
 *
 * @module hooks/useTouchGestures
 */

import { useCallback, useState } from 'react';

export interface UseTouchGesturesOptions {
  /** Callback fired when swipe down gesture is detected */
  onSwipeDown?: () => void;
  /** Minimum vertical distance (px) to trigger swipe (default: 100) */
  swipeThreshold?: number;
  /** Whether touch gestures are enabled */
  enabled?: boolean;
}

export interface UseTouchGesturesReturn {
  /** Current Y position when touch started */
  touchStartY: number | null;
  /** Current Y position during touch move */
  touchCurrentY: number | null;
  /** Handler for touchstart events */
  handleTouchStart: (event: React.TouchEvent) => void;
  /** Handler for touchmove events */
  handleTouchMove: (event: React.TouchEvent) => void;
  /** Handler for touchend events */
  handleTouchEnd: () => void;
}

/**
 * Custom hook for managing touch gestures
 *
 * Provides handlers and state for touch-based gestures like swipe-to-dismiss.
 * Tracks touch position throughout the gesture lifecycle and fires callbacks
 * when gesture thresholds are met.
 *
 * Features:
 * - Swipe down gesture detection
 * - Configurable swipe threshold
 * - Single-touch validation
 * - Automatic state cleanup
 * - Enable/disable control
 *
 * Common use cases:
 * - Swipe-to-dismiss panels
 * - Pull-to-refresh
 * - Gesture-based navigation
 * - Mobile drawer controls
 *
 * @param options - Configuration for touch gestures
 * @returns Touch gesture state and event handlers
 *
 * @example
 * ```tsx
 * const {
 *   touchStartY,
 *   touchCurrentY,
 *   handleTouchStart,
 *   handleTouchMove,
 *   handleTouchEnd
 * } = useTouchGestures({
 *   onSwipeDown: closePanel,
 *   swipeThreshold: 100,
 *   enabled: isOpen
 * });
 *
 * <div
 *   onTouchStart={handleTouchStart}
 *   onTouchMove={handleTouchMove}
 *   onTouchEnd={handleTouchEnd}
 * >
 *   Swipeable content
 * </div>
 * ```
 */
export function useTouchGestures(options: UseTouchGesturesOptions = {}): UseTouchGesturesReturn {
  const { onSwipeDown, swipeThreshold = 100, enabled = true } = options;

  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchCurrentY, setTouchCurrentY] = useState<number | null>(null);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled) return;
      if (event.touches.length === 1) {
        setTouchStartY(event.touches[0].clientY);
      }
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled) return;
      if (touchStartY !== null && event.touches.length === 1) {
        setTouchCurrentY(event.touches[0].clientY);
      }
    },
    [enabled, touchStartY]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled) {
      setTouchStartY(null);
      setTouchCurrentY(null);
      return;
    }

    if (touchStartY !== null && touchCurrentY !== null) {
      const deltaY = touchCurrentY - touchStartY;
      // Swipe down detected
      if (deltaY > swipeThreshold && onSwipeDown) {
        onSwipeDown();
      }
    }

    // Reset state
    setTouchStartY(null);
    setTouchCurrentY(null);
  }, [enabled, touchStartY, touchCurrentY, swipeThreshold, onSwipeDown]);

  return {
    touchStartY,
    touchCurrentY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
