import { useEffect, useRef, useState, type RefObject } from 'react';

const SCROLL_COMPACT_THRESHOLD = 80;
const SCROLL_DIRECTION_DELTA = 12;

type NavScrollRefs = {
  shell: RefObject<HTMLElement | null>;
  nav: RefObject<HTMLElement | null>;
};

type NavScrollOptions = {
  /** When true, auto-hide is suppressed (mobile menu open, etc.). */
  blockAutoHide?: boolean;
};

function isCommandCenterOpen(): boolean {
  return document.getElementById('search-overlay')?.getAttribute('data-state') === 'open';
}

/**
 * Compact header on scroll and auto-hide when scrolling down.
 * Re-shows when the user scrolls up or returns near the top.
 */
export function useNavScrollBehavior(refs: NavScrollRefs, options: NavScrollOptions = {}) {
  const lastScrollY = useRef(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAutoHidden, setIsAutoHidden] = useState(false);

  useEffect(() => {
    const shell = refs.shell.current;
    const nav = refs.nav.current;
    if (!shell || !nav) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const compact = scrollY > SCROLL_COMPACT_THRESHOLD;

      nav.classList.toggle('has-background', compact);
      shell.classList.toggle('nav-shell--scrolled', compact);
      setIsScrolled(compact);

      const shouldBlockHide =
        options.blockAutoHide || isCommandCenterOpen() || scrollY <= SCROLL_COMPACT_THRESHOLD;

      if (shouldBlockHide) {
        setIsAutoHidden(false);
      } else if (scrollY > lastScrollY.current + SCROLL_DIRECTION_DELTA) {
        setIsAutoHidden(true);
      } else if (scrollY < lastScrollY.current - SCROLL_DIRECTION_DELTA) {
        setIsAutoHidden(false);
      }

      lastScrollY.current = scrollY;
    };

    const resetOnNavigation = () => {
      lastScrollY.current = window.scrollY;
      setIsAutoHidden(false);
      handleScroll();
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('astro:page-load', resetOnNavigation);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('astro:page-load', resetOnNavigation);
    };
  }, [options.blockAutoHide, refs.shell, refs.nav]);

  return { isScrolled, isAutoHidden };
}
