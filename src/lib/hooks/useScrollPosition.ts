/**
 * useScrollPosition - Hook for tracking scroll position with throttling
 *
 * Provides scroll position tracking with built-in throttling for performance.
 * Useful for scroll-based UI effects like sticky headers, parallax, or
 * scroll progress indicators.
 *
 * @example Basic usage
 * ```tsx
 * const { scrollY, scrollX, scrollDirection } = useScrollPosition();
 * const hasScrolled = scrollY > 80;
 * ```
 *
 * @example With custom throttle
 * ```tsx
 * const { scrollY } = useScrollPosition({ throttleMs: 100 });
 * ```
 *
 * @example With element reference
 * ```tsx
 * const scrollRef = useRef<HTMLDivElement>(null);
 * const { scrollY } = useScrollPosition({ element: scrollRef });
 * ```
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

export interface ScrollPosition {
  /** Current vertical scroll position in pixels */
  scrollY: number;
  /** Current horizontal scroll position in pixels */
  scrollX: number;
  /** Current scroll direction (up, down, or null if no scroll) */
  scrollDirection: ScrollDirection;
  /** Whether currently scrolling (resets after scroll ends) */
  isScrolling: boolean;
}

export interface UseScrollPositionOptions {
  /** Throttle interval in milliseconds (default: 16ms ~ 60fps) */
  throttleMs?: number;
  /** Element to track scroll on (default: window) */
  element?: React.RefObject<HTMLElement | null>;
  /** Initial scroll position values */
  initialPosition?: Partial<ScrollPosition>;
}

const DEFAULT_POSITION: ScrollPosition = {
  scrollY: 0,
  scrollX: 0,
  scrollDirection: null,
  isScrolling: false,
};

export function useScrollPosition(options: UseScrollPositionOptions = {}): ScrollPosition {
  const { throttleMs = 16, element, initialPosition } = options;

  const [position, setPosition] = useState<ScrollPosition>({
    ...DEFAULT_POSITION,
    ...initialPosition,
  });

  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    const scrollY = element?.current ? element.current.scrollTop : window.scrollY;
    const scrollX = element?.current ? element.current.scrollLeft : window.scrollX;

    const direction: ScrollDirection =
      scrollY > lastScrollY.current ? 'down' : scrollY < lastScrollY.current ? 'up' : null;

    lastScrollY.current = scrollY;

    setPosition({
      scrollY,
      scrollX,
      scrollDirection: direction,
      isScrolling: true,
    });

    // Reset isScrolling after scroll ends
    if (scrollingTimeoutRef.current) {
      clearTimeout(scrollingTimeoutRef.current);
    }
    scrollingTimeoutRef.current = setTimeout(() => {
      setPosition((prev) => ({ ...prev, isScrolling: false }));
    }, 150);

    ticking.current = false;
  }, [element]);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      ticking.current = true;
      if (throttleMs > 0) {
        setTimeout(updatePosition, throttleMs);
      } else {
        requestAnimationFrame(updatePosition);
      }
    }
  }, [throttleMs, updatePosition]);

  useEffect(() => {
    const target = element?.current ?? window;

    // Initialize with current scroll position
    updatePosition();

    target.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      target.removeEventListener('scroll', handleScroll);
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
    };
  }, [element, handleScroll, updatePosition]);

  return position;
}

/**
 * Simplified hook that returns just whether user has scrolled past a threshold
 * @param threshold - Scroll threshold in pixels (default: 80)
 */
export function useHasScrolled(threshold: number = 80): boolean {
  const { scrollY } = useScrollPosition();
  return scrollY > threshold;
}
