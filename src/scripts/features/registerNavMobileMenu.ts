import { acquireScrollLock, releaseScrollLock } from '@/utils/scrollLock';
import {
  closeSearch,
  registerEscapeHandler,
  registerMobileMenuClose,
} from '@/utils/headerController';
import { createFocusTrap, type FocusTrap } from '@/utils/focusTrap';

export const MENU_LABEL_OPEN = 'Open navigation menu';
export const MENU_LABEL_CLOSED = 'Close navigation menu';

const DESKTOP_NAV_QUERY = '(min-width: 768px)';

type CleanupFn = () => void;

type NavEls = {
  shell: HTMLElement;
  menu: HTMLElement;
  backdrop: HTMLElement | null;
  burger: HTMLButtonElement;
  status: HTMLElement | null;
};

function queryNavEls(): NavEls | null {
  const shell = document.querySelector<HTMLElement>('.nav-shell');
  const menu = document.getElementById('nav-mobile-links');
  const burger = document.getElementById('nav-toggle') as HTMLButtonElement | null;
  if (!shell || !menu || !burger) return null;
  return {
    shell,
    menu,
    backdrop: document.getElementById('nav-mobile-backdrop'),
    burger,
    status: document.getElementById('nav-menu-status'),
  };
}

function getInitialMenuFocus(menu: HTMLElement): HTMLElement | null {
  return (
    menu.querySelector<HTMLElement>('.mobile-nav-link') ??
    menu.querySelector<HTMLElement>('a[href]')
  );
}

function isMenuOpen(shell: HTMLElement): boolean {
  return shell.getAttribute('data-menu-state') === 'open';
}

/**
 * Progressive-enhancement mobile menu for the Astro nav shell.
 * Binds directly to the burger (idempotent) so HMR / re-init cannot leave a dead button.
 * Outside close uses the backdrop only — never document capture — to avoid same-tap close races.
 */
export function registerNavMobileMenu(): CleanupFn {
  const els = queryNavEls();
  if (!els) {
    return () => {};
  }

  let scrollLocked = false;
  let focusTrap: FocusTrap | null = null;
  const cleanups: CleanupFn[] = [];

  const releaseLock = () => {
    if (!scrollLocked) return;
    releaseScrollLock();
    scrollLocked = false;
  };

  const setOpen = (next: boolean) => {
    const current = queryNavEls();
    if (!current) return;
    if (next === isMenuOpen(current.shell)) return;

    const { shell, menu, backdrop, burger, status } = current;

    shell.setAttribute('data-menu-state', next ? 'open' : 'closed');
    burger.setAttribute('aria-expanded', String(next));
    burger.setAttribute('aria-label', next ? MENU_LABEL_CLOSED : MENU_LABEL_OPEN);
    burger.classList.toggle('active', next);
    menu.setAttribute('data-state', next ? 'open' : 'closed');
    if (next) {
      menu.removeAttribute('inert');
    } else {
      menu.setAttribute('inert', '');
    }

    if (backdrop) {
      backdrop.setAttribute('data-state', next ? 'open' : 'closed');
      backdrop.setAttribute('aria-hidden', next ? 'false' : 'true');
    }

    if (status) {
      status.textContent = next ? 'Navigation menu opened' : 'Navigation menu closed';
    }

    focusTrap?.deactivate();
    focusTrap = createFocusTrap(menu, {
      initialFocus: getInitialMenuFocus(menu),
      returnFocus: burger,
      fallbackFocus: menu,
    });

    if (next) {
      closeSearch();
      if (!scrollLocked) {
        acquireScrollLock();
        scrollLocked = true;
      }
      requestAnimationFrame(() => {
        if (isMenuOpen(shell)) focusTrap?.activate();
      });
    } else {
      releaseLock();
      focusTrap.deactivate();
    }
  };

  const close = () => setOpen(false);
  const toggle = () => {
    const shell = document.querySelector<HTMLElement>('.nav-shell');
    if (!shell) return;
    setOpen(!isMenuOpen(shell));
  };

  // Direct binding — reassignment is safe across HMR / double init
  const onBurgerClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    toggle();
  };
  els.burger.addEventListener('click', onBurgerClick);
  cleanups.push(() => {
    const burger = document.getElementById('nav-toggle');
    burger?.removeEventListener('click', onBurgerClick);
  });

  const onBackdropClick = (event: MouseEvent) => {
    event.preventDefault();
    close();
  };
  els.backdrop?.addEventListener('click', onBackdropClick);
  if (els.backdrop) {
    cleanups.push(() => {
      document.getElementById('nav-mobile-backdrop')?.removeEventListener('click', onBackdropClick);
    });
  }

  const onMenuClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('a[href]')) close();
  };
  els.menu.addEventListener('click', onMenuClick);
  cleanups.push(() => {
    document.getElementById('nav-mobile-links')?.removeEventListener('click', onMenuClick);
  });

  cleanups.push(
    registerMobileMenuClose(() => {
      const shell = document.querySelector<HTMLElement>('.nav-shell');
      if (shell && isMenuOpen(shell)) close();
    })
  );

  cleanups.push(
    registerEscapeHandler({
      id: 'mobile-menu',
      priority: 1,
      isActive: () => {
        const shell = document.querySelector<HTMLElement>('.nav-shell');
        return Boolean(shell && isMenuOpen(shell));
      },
      handle: () => close(),
    })
  );

  const handlePageLoad = () => {
    const shell = document.querySelector<HTMLElement>('.nav-shell');
    if (shell && isMenuOpen(shell)) close();
  };
  document.addEventListener('astro:page-load', handlePageLoad);
  cleanups.push(() => document.removeEventListener('astro:page-load', handlePageLoad));

  const mediaQuery = window.matchMedia?.(DESKTOP_NAV_QUERY);
  if (mediaQuery) {
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) close();
    };
    mediaQuery.addEventListener('change', handleViewportChange);
    cleanups.push(() => mediaQuery.removeEventListener('change', handleViewportChange));
  }

  // Sync initial closed DOM
  const initial = queryNavEls();
  if (initial) {
    initial.shell.setAttribute('data-menu-state', 'closed');
    initial.burger.setAttribute('aria-expanded', 'false');
    initial.burger.setAttribute('aria-label', MENU_LABEL_OPEN);
    initial.burger.classList.remove('active');
    initial.menu.setAttribute('data-state', 'closed');
    initial.menu.setAttribute('inert', '');
    if (initial.backdrop) {
      initial.backdrop.setAttribute('data-state', 'closed');
      initial.backdrop.setAttribute('aria-hidden', 'true');
    }
  }

  return () => {
    releaseLock();
    focusTrap?.deactivate();
    cleanups.forEach((fn) => fn());
  };
}
