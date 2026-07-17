type ElementHandle<T extends HTMLElement> =
  | T
  | null
  | undefined
  | { current: T | null | undefined };

import { registerNavTheme } from './registerNavTheme';
import { registerNavScrollBehavior } from './registerNavScrollBehavior';
import { registerHeaderOverlayLifecycle } from './registerHeaderOverlayLifecycle';
import { openCommandCenter } from '../../features/command-center/lib/commandEvents';

type ModernNavBarOptions = {
  navBar?: ElementHandle<HTMLElement>;
  themeToggle?: ElementHandle<HTMLButtonElement>;
};

type CleanupFn = () => void;

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

  const navBar =
    resolveElement(opts.navBar) ?? document.getElementById('navbar');
  const themeToggle =
    resolveElement(opts.themeToggle) ??
    (document.getElementById('theme-toggle') as HTMLButtonElement | null);

  const cleanupTheme = registerNavTheme({ themeToggle });
  // Mobile menu: bound by NavBar.astro classic inline script (not this module).
  // Module listeners were getting cleaned/raced away while data-js-nav stayed set.
  const cleanupScroll = registerNavScrollBehavior();
  const cleanupOverlay = registerHeaderOverlayLifecycle();

  navBar?.setAttribute('data-js-nav', 'true');
  (window as typeof window & { __navHydrated?: boolean }).__navHydrated = true;

  const onSearch = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('#search-toggle')) return;
    event.preventDefault();
    openCommandCenter();
  };
  document.addEventListener('click', onSearch);

  void import('../modules/MotionAccessibility')
    .then(({ initMotionAccessibility }) => {
      if ((window as typeof window & { __motionAccessibilityInit?: boolean }).__motionAccessibilityInit) {
        return;
      }
      initMotionAccessibility();
      (window as typeof window & { __motionAccessibilityInit?: boolean }).__motionAccessibilityInit =
        true;
    })
    .catch(() => {
      /* non-critical */
    });

  const cleanup: CleanupFn = () => {
    cleanupTheme();
    cleanupScroll();
    cleanupOverlay();
    document.removeEventListener('click', onSearch);
    if (activeCleanup === cleanup) activeCleanup = null;
  };

  activeCleanup = cleanup;
  return cleanup;
}

export function initModernNavBar(): CleanupFn | undefined {
  if (!document.getElementById('navbar')) {
    return undefined;
  }
  return registerModernNavBar();
}
