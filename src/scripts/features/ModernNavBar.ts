type ElementHandle<T extends HTMLElement> =
  | T
  | null
  | undefined
  | { current: T | null | undefined };

import {
  applySystemTheme,
  cycleThemePreference,
  getThemePreference,
  updateThemeToggleButton,
  readThemePreference,
} from '../../lib/theme';
import {
  closeSearch,
  registerEscapeHandler,
  registerMobileMenuClose,
} from '../../utils/headerController';
import { createFocusTrap, type FocusTrap } from '../../utils/focusTrap';
import { acquireScrollLock, releaseScrollLock } from '../../utils/scrollLock';

type ModernNavBarOptions = {
  navBar?: ElementHandle<HTMLElement>;
  navShell?: ElementHandle<HTMLElement>;
  mobileMenu?: ElementHandle<HTMLElement>;
  mobileBackdrop?: ElementHandle<HTMLElement>;
  burgerButton?: ElementHandle<HTMLButtonElement>;
  menuStatus?: ElementHandle<HTMLElement>;
  themeToggle?: ElementHandle<HTMLButtonElement>;
};

type CleanupFn = () => void;

const MENU_LABEL_OPEN = 'Open navigation menu';
const MENU_LABEL_CLOSED = 'Close navigation menu';

function resolveElement<T extends HTMLElement>(handle?: ElementHandle<T>): T | null {
  if (!handle) return null;
  if (typeof (handle as { current?: T | null }).current !== 'undefined') {
    return (handle as { current?: T | null }).current ?? null;
  }
  return (handle as T) ?? null;
}

function cycleTheme(button: HTMLButtonElement | null) {
  const nextPreference = cycleThemePreference();
  updateThemeToggleButton(button, nextPreference);
}

function getInitialMenuFocus(menu: HTMLElement): HTMLElement | null {
  return menu.querySelector<HTMLElement>('.mobile-nav-link') ?? menu.querySelector<HTMLElement>('a[href]');
}

function setMenuOpenState(
  open: boolean,
  menu: HTMLElement,
  toggle: HTMLButtonElement,
  backdrop: HTMLElement | null,
  shell: HTMLElement | null,
  status: HTMLElement | null,
): void {
  menu.dataset.state = open ? 'open' : 'closed';
  menu.classList.toggle('active', open);
  menu.inert = !open;

  if (backdrop) {
    backdrop.dataset.state = open ? 'open' : 'closed';
    backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  if (shell) {
    shell.dataset.menuState = open ? 'open' : 'closed';
  }

  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.classList.toggle('active', open);
  toggle.setAttribute('aria-label', open ? MENU_LABEL_CLOSED : MENU_LABEL_OPEN);

  if (status) {
    status.textContent = open ? 'Navigation menu opened' : 'Navigation menu closed';
  }
}

function openMobileMenu(
  menu: HTMLElement,
  toggle: HTMLButtonElement,
  backdrop: HTMLElement | null,
  shell: HTMLElement | null,
  status: HTMLElement | null,
  focusTrap: FocusTrap,
): void {
  closeSearch();
  setMenuOpenState(true, menu, toggle, backdrop, shell, status);
  acquireScrollLock();
  focusTrap.activate();
}

function closeMobileMenu(
  menu: HTMLElement,
  toggle: HTMLButtonElement,
  backdrop: HTMLElement | null,
  shell: HTMLElement | null,
  status: HTMLElement | null,
  focusTrap: FocusTrap,
): void {
  setMenuOpenState(false, menu, toggle, backdrop, shell, status);
  focusTrap.deactivate();
  releaseScrollLock();
}

export function registerModernNavBar(options: ModernNavBarOptions): CleanupFn {
  const navBar = resolveElement(options.navBar);
  const navShell = resolveElement(options.navShell);
  const mobileMenu = resolveElement(options.mobileMenu);
  const mobileBackdrop = resolveElement(options.mobileBackdrop);
  const burgerButton = resolveElement(options.burgerButton);
  const menuStatus = resolveElement(options.menuStatus);
  const themeToggle = resolveElement(options.themeToggle);

  const cleanupFns: CleanupFn[] = [];

  if (themeToggle) {
    updateThemeToggleButton(themeToggle, getThemePreference());
    const handler = (event: Event) => {
      event.preventDefault();
      cycleTheme(themeToggle);
    };
    themeToggle.addEventListener('click', handler);
    cleanupFns.push(() => themeToggle.removeEventListener('click', handler));

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    const systemThemeListener = (event: MediaQueryListEvent) => {
      if (readThemePreference() !== 'system') return;
      const inferredTheme = event.matches ? 'dark' : 'light';
      applySystemTheme(inferredTheme);
      updateThemeToggleButton(themeToggle, 'system');
    };

    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', systemThemeListener);
      cleanupFns.push(() => mediaQuery.removeEventListener('change', systemThemeListener));
    }
  }

  if (burgerButton && mobileMenu) {
    const focusTrap = createFocusTrap(mobileMenu, {
      initialFocus: getInitialMenuFocus(mobileMenu),
      returnFocus: burgerButton,
      fallbackFocus: mobileMenu,
    });

    const close = () =>
      closeMobileMenu(mobileMenu, burgerButton, mobileBackdrop, navShell, menuStatus, focusTrap);
    const open = () =>
      openMobileMenu(mobileMenu, burgerButton, mobileBackdrop, navShell, menuStatus, focusTrap);

    const toggleHandler = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      if (mobileMenu.classList.contains('active')) {
        close();
      } else {
        open();
      }
    };

    burgerButton.addEventListener('click', toggleHandler);
    cleanupFns.push(() => burgerButton.removeEventListener('click', toggleHandler));

    if (mobileBackdrop) {
      const backdropHandler = (event: Event) => {
        event.preventDefault();
        if (mobileMenu.classList.contains('active')) close();
      };
      mobileBackdrop.addEventListener('click', backdropHandler);
      cleanupFns.push(() => mobileBackdrop.removeEventListener('click', backdropHandler));
    }

    cleanupFns.push(
      registerMobileMenuClose(() => {
        if (mobileMenu.classList.contains('active')) close();
      }),
    );

    cleanupFns.push(
      registerEscapeHandler({
        id: 'mobile-menu',
        priority: 1,
        isActive: () => mobileMenu.classList.contains('active'),
        handle: () => close(),
      }),
    );

    const outsideClickHandler = (event: MouseEvent) => {
      if (!mobileMenu.classList.contains('active')) return;
      const target = event.target as Node;
      if (
        mobileMenu.contains(target) ||
        burgerButton.contains(target) ||
        mobileBackdrop?.contains(target)
      ) {
        return;
      }
      close();
    };
    document.addEventListener('click', outsideClickHandler);
    cleanupFns.push(() => document.removeEventListener('click', outsideClickHandler));
  }

  navBar?.setAttribute('data-js-nav', 'true');

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}

export function initModernNavBar(): CleanupFn | undefined {
  const navBar = document.getElementById('navbar');
  if (!navBar) {
    return undefined;
  }

  const navShell = navBar.closest('.nav-shell');
  const mobileMenu = document.getElementById('nav-mobile-links');
  const mobileBackdrop = document.getElementById('nav-mobile-backdrop');
  const burgerButton = document.getElementById('nav-toggle') as HTMLButtonElement | null;
  const menuStatus = document.getElementById('nav-menu-status');
  const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement | null;

  return registerModernNavBar({
    navBar,
    navShell: navShell instanceof HTMLElement ? navShell : null,
    mobileMenu,
    mobileBackdrop,
    burgerButton,
    menuStatus,
    themeToggle,
  });
}
