/**
 * useIntersectionObserver - Hook for tracking element visibility
 *
 * Uses the Intersection Observer API to track when elements enter or leave
 * the viewport. Useful for lazy loading, infinite scroll, animations on scroll,
 * and tracking element visibility.
 *
 * @example Basic usage
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * const entry = useIntersectionObserver(ref, { threshold: 0.5 });
 * const isVisible = entry?.isIntersecting ?? false;
 * ```
 *
 * @example Lazy loading images
 * ```tsx
 * const imgRef = useRef<HTMLImageElement>(null);
 * const entry = useIntersectionObserver(imgRef, { rootMargin: '100px' });
 * 
 * useEffect(() => {
 *   if (entry?.isIntersecting && imgRef.current) {
 *     imgRef.current.src = imgRef.current.dataset.src ?? '';
 *   }
 * }, [entry?.isIntersecting]);
 * ```
 *
 * @example Animation trigger
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * const entry = useIntersectionObserver(ref, { threshold: 0.1 });
 * const shouldAnimate = entry?.isIntersecting;
 * ```
 */
import { useEffect, useState, type RefObject } from 'react';

export interface UseIntersectionObserverOptions
  extends IntersectionObserverInit {
  /** Whether the observer should be active (default: true) */
  enabled?: boolean;
  /** Whether to disconnect after first intersection (default: false) */
  triggerOnce?: boolean;
}

export function useIntersectionObserver<T extends Element = Element>(
  elementRef: RefObject<T | null>,
  options: UseIntersectionObserverOptions = {}
): IntersectionObserverEntry | null {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    enabled = true,
    triggerOnce = false,
  } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    // Skip if disabled, no element, or already triggered (when triggerOnce)
    if (!enabled || !element || (triggerOnce && hasTriggered)) {
      return;
    }

    // Check for browser support
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: assume element is visible
      const mockEntry = {
        isIntersecting: true,
        intersectionRatio: 1,
        target: element,
        boundingClientRect: element.getBoundingClientRect(),
        intersectionRect: element.getBoundingClientRect(),
        rootBounds: null,
        time: Date.now(),
      } as IntersectionObserverEntry;
      setEntry(mockEntry);
      return;
    }

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        setEntry(observerEntry);

        // Disconnect after first intersection if triggerOnce
        if (triggerOnce && observerEntry.isIntersecting) {
          setHasTriggered(true);
          observer.disconnect();
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, threshold, root, rootMargin, enabled, triggerOnce, hasTriggered]);

  return entry;
}

/**
 * Simplified hook that returns just boolean visibility
 * @param elementRef - Ref to the element to observe
 * @param options - Intersection observer options
 */
export function useIsVisible<T extends Element = Element>(
  elementRef: RefObject<T | null>,
  options: UseIntersectionObserverOptions = {}
): boolean {
  const entry = useIntersectionObserver(elementRef, options);
  return entry?.isIntersecting ?? false;
}

/**
 * Hook for lazy loading - tracks visibility and provides loaded state
 * @param elementRef - Ref to the element to observe
 * @param rootMargin - Margin around the root (default: '100px' for pre-loading)
 */
export function useLazyLoad<T extends Element = Element>(
  elementRef: RefObject<T | null>,
  rootMargin: string = '100px'
): { isInView: boolean; hasLoaded: boolean } {
  const [hasLoaded, setHasLoaded] = useState(false);
  const entry = useIntersectionObserver(elementRef, {
    rootMargin,
    triggerOnce: true,
  });

  const isInView = entry?.isIntersecting ?? false;

  useEffect(() => {
    if (isInView && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isInView, hasLoaded]);

  return { isInView, hasLoaded };
}
