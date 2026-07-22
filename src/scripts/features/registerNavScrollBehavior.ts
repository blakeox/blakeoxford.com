type CleanupFn = () => void;

const SCROLL_COMPACT_THRESHOLD = 80;
/** Downward travel before auto-hide engages. */
const SCROLL_HIDE_DELTA = 12;

function isCommandCenterOpen(): boolean {
  return document.getElementById('search-overlay')?.getAttribute('data-state') === 'open';
}

/**
 * Compact header on scroll and auto-hide when scrolling down.
 * Reveals again on any upward scroll (sticky `top` offset — never transform).
 */
export function registerNavScrollBehavior(): CleanupFn {
  const shell = document.querySelector<HTMLElement>('.nav-shell');
  const nav = document.getElementById('navbar');
  if (!shell || !nav) {
    return () => {};
  }

  let lastScrollY = window.scrollY;

  const handleScroll = () => {
    const scrollY = Math.max(0, window.scrollY);
    const compact = scrollY > SCROLL_COMPACT_THRESHOLD;
    const menuOpen = shell.getAttribute('data-menu-state') === 'open';

    nav.classList.toggle('has-background', compact);
    shell.classList.toggle('nav-shell--scrolled', compact);

    const shouldBlockHide =
      menuOpen || isCommandCenterOpen() || scrollY <= SCROLL_COMPACT_THRESHOLD;

    if (shouldBlockHide) {
      shell.classList.remove('nav-shell--auto-hidden');
      lastScrollY = scrollY;
      return;
    }

    // Only advance the baseline when a hide/show decision fires so trackpad
    // micro-steps accumulate instead of resetting every frame.
    if (scrollY > lastScrollY + SCROLL_HIDE_DELTA) {
      shell.classList.add('nav-shell--auto-hidden');
      lastScrollY = scrollY;
    } else if (scrollY < lastScrollY) {
      // Any upward movement restores the bar.
      shell.classList.remove('nav-shell--auto-hidden');
      lastScrollY = scrollY;
    }
  };

  const resetOnNavigation = () => {
    lastScrollY = window.scrollY;
    shell.classList.remove('nav-shell--auto-hidden');
    handleScroll();
  };

  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('astro:page-load', resetOnNavigation);

  return () => {
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('astro:page-load', resetOnNavigation);
  };
}
