import { closeAllHeaderOverlays } from '../../utils/headerController';
import { forceReleaseScrollLock } from '../../utils/scrollLock';

type CleanupFn = () => void;

/**
 * Close header overlays on Astro client navigations so persisted nav/search
 * state does not leak across routes with scroll lock attached.
 */
export function registerHeaderOverlayLifecycle(): CleanupFn {
  if (typeof document === 'undefined') return () => undefined;

  const handlePageLoad = () => {
    closeAllHeaderOverlays();
    requestAnimationFrame(() => {
      const menuOpen =
        document.getElementById('nav-mobile-links')?.getAttribute('data-state') === 'open';
      const searchOpen =
        document.getElementById('search-overlay')?.getAttribute('data-state') === 'open';
      if (!menuOpen && !searchOpen) {
        forceReleaseScrollLock();
      }
    });
  };

  document.addEventListener('astro:page-load', handlePageLoad);

  return () => {
    document.removeEventListener('astro:page-load', handlePageLoad);
  };
}
