type ElementHandle<T extends HTMLElement> =
  T | null | undefined | { current: T | null | undefined };

import { registerNavTheme } from './registerNavTheme';
import { registerNavScrollBehavior } from './registerNavScrollBehavior';
import { registerHeaderOverlayLifecycle } from './registerHeaderOverlayLifecycle';
import { openCommandCenter } from '@/features/command-center/lib/commandEvents';
import { registerMobileMenuClose } from '@/utils/headerController';
import { acquireScrollLock, releaseScrollLock } from '@/utils/scrollLock';

type ModernNavBarOptions = {
  navBar?: ElementHandle<HTMLElement>;
  themeToggle?: ElementHandle<HTMLButtonElement>;
};

type CleanupFn = () => void;

type BoNavWindow = Window & {
  __boCloseNavMenu?: () => void;
  __navHydrated?: boolean;
  __motionAccessibilityInit?: boolean;
};

let activeCleanup: CleanupFn | null = null;

function resolveElement<T extends HTMLElement>(handle?: ElementHandle<T>): T | null {
  if (!handle) return null;
  if (typeof (handle as { current?: T | null }).current !== 'undefined') {
    return (handle as { current?: T | null }).current ?? null;
  }
  return (handle as T) ?? null;
}

/** Wire theme, mobile menu, scroll behavior, and search for the Astro nav shell. */
export function registerModernNavBar(options?: ModernNavBarOptions): CleanupFn {
  const opts = options ?? {};
  // Prevent duplicate document-level listeners from HMR / double boot
  activeCleanup?.();
  activeCleanup = null;

  const navBar = resolveElement(opts.navBar) ?? document.getElementById('navbar');
  const themeToggle =
    resolveElement(opts.themeToggle) ??
    (document.getElementById('theme-toggle') as HTMLButtonElement | null);

  const cleanupTheme = registerNavTheme({ themeToggle });
  // Burger open/close is owned by NavBar.astro's classic inline script.
  // Bridge headerController.closeMobileMenu() → that script's close helper,
  // and keep the shared scroll-lock refcount in sync with data-menu-state.
  const cleanupMenuClose = registerMobileMenuClose(() => {
    (window as BoNavWindow).__boCloseNavMenu?.();
  });
  const cleanupMenuScrollLock = registerNavMenuScrollLock();
  const cleanupScroll = registerNavScrollBehavior();
  const cleanupOverlay = registerHeaderOverlayLifecycle();

  navBar?.setAttribute('data-js-nav', 'true');
  (window as BoNavWindow).__navHydrated = true;

  const onSearch = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('#search-toggle')) return;
    event.preventDefault();
    openCommandCenter();
  };
  document.addEventListener('click', onSearch);

  void import('@/scripts/modules/MotionAccessibility')
    .then(({ initMotionAccessibility }) => {
      if ((window as BoNavWindow).__motionAccessibilityInit) {
        return;
      }
      initMotionAccessibility();
      (window as BoNavWindow).__motionAccessibilityInit = true;
    })
    .catch(() => {
      /* non-critical */
    });

  const cleanup: CleanupFn = () => {
    cleanupTheme();
    cleanupMenuClose();
    cleanupMenuScrollLock();
    cleanupScroll();
    cleanupOverlay();
    document.removeEventListener('click', onSearch);
    if (activeCleanup === cleanup) activeCleanup = null;
  };

  activeCleanup = cleanup;
  return cleanup;
}

/** Keep acquireScrollLock() aligned with the inline menu's data-menu-state. */
function registerNavMenuScrollLock(): CleanupFn {
  const shell = document.querySelector<HTMLElement>('.nav-shell');
  if (!shell) return () => {};

  let held = false;
  const sync = () => {
    const open = shell.getAttribute('data-menu-state') === 'open';
    if (open && !held) {
      acquireScrollLock();
      held = true;
    } else if (!open && held) {
      releaseScrollLock();
      held = false;
    }
  };

  sync();
  const observer = new MutationObserver(sync);
  observer.observe(shell, { attributes: true, attributeFilter: ['data-menu-state'] });

  return () => {
    observer.disconnect();
    if (held) {
      releaseScrollLock();
      held = false;
    }
  };
}

export function initModernNavBar(): CleanupFn | undefined {
  if (!document.getElementById('navbar')) {
    return undefined;
  }
  return registerModernNavBar();
}
