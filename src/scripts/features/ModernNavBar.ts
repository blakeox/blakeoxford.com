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
  mobileMenu?: ElementHandle<HTMLElement>;
  burgerButton?: ElementHandle<HTMLButtonElement>;
  closeButton?: ElementHandle<HTMLButtonElement>;
  themeToggle?: ElementHandle<HTMLButtonElement>;
};

type CleanupFn = () => void;

function resolveElement<T extends HTMLElement>(handle?: ElementHandle<T>): T | null {
  if (!handle) return null;
  if (typeof (handle as { current?: T | null }).current !== 'undefined') {
    return (handle as { current?: T | null }).current ?? null;
  }
  return (handle as T) ?? null;
}

function isTestEnv(): boolean {
  return (
    typeof window !== 'undefined' &&
    (((typeof location !== 'undefined') &&
      (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) ||
      (typeof navigator !== 'undefined' && (navigator as Navigator & { webdriver?: boolean }).webdriver))
  );
}

function cycleTheme(button: HTMLButtonElement | null) {
  const nextPreference = cycleThemePreference();
  updateThemeToggleButton(button, nextPreference);
}

function getInitialMenuFocus(menu: HTMLElement): HTMLElement | null {
  return menu.querySelector<HTMLElement>('.mobile-nav-link') ?? menu.querySelector<HTMLElement>('a[href]');
}

function openMobileMenu(
  menu: HTMLElement,
  toggle: HTMLButtonElement,
  focusTrap: FocusTrap,
): void {
  closeSearch();
  menu.inert = false;
  menu.style.visibility = '';
  menu.style.pointerEvents = '';
  menu.classList.add('active');
  toggle.setAttribute('aria-expanded', 'true');
  toggle.classList.add('active');
  acquireScrollLock();

  focusTrap.activate();
}

function closeMobileMenu(
  menu: HTMLElement,
  toggle: HTMLButtonElement,
  focusTrap: FocusTrap,
): void {
  menu.classList.remove('active');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.classList.remove('active');
  focusTrap.deactivate();
  releaseScrollLock();

  const hideMenu = () => {
    if (!menu.classList.contains('active')) {
      menu.style.visibility = 'hidden';
      menu.style.pointerEvents = 'none';
      menu.inert = true;
    }
  };

  if (isTestEnv()) {
    hideMenu();
  } else {
    setTimeout(hideMenu, 250);
  }
}

export function registerModernNavBar(options: ModernNavBarOptions): CleanupFn {
  const navBar = resolveElement(options.navBar);
  const mobileMenu = resolveElement(options.mobileMenu);
  const burgerButton = resolveElement(options.burgerButton);
  const closeButton = resolveElement(options.closeButton);
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

    const close = () => closeMobileMenu(mobileMenu, burgerButton, focusTrap);
    const open = () => openMobileMenu(mobileMenu, burgerButton, focusTrap);

    const toggleHandler = (event: Event) => {
      event.preventDefault();
      if (mobileMenu.classList.contains('active')) {
        close();
      } else {
        open();
      }
    };

    const closeHandler = (event: Event) => {
      event.preventDefault();
      if (mobileMenu.classList.contains('active')) {
        close();
      }
    };

    burgerButton.addEventListener('click', toggleHandler);
    cleanupFns.push(() => burgerButton.removeEventListener('click', toggleHandler));

    closeButton?.addEventListener('click', closeHandler);
    if (closeButton) {
      cleanupFns.push(() => closeButton.removeEventListener('click', closeHandler));
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
      if (mobileMenu.contains(target) || burgerButton.contains(target)) return;
      close();
    };
    document.addEventListener('click', outsideClickHandler);
    cleanupFns.push(() => document.removeEventListener('click', outsideClickHandler));
  }

  // Mark JS-enhanced nav for CSS (hides no-JS fallback)
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

  const mobileMenu = document.getElementById('nav-mobile-links');
  const burgerButton = document.getElementById('nav-toggle') as HTMLButtonElement | null;
  const closeButton = document.getElementById('close-mobile-menu') as HTMLButtonElement | null;
  const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement | null;

  return registerModernNavBar({
    navBar,
    mobileMenu,
    burgerButton,
    closeButton,
    themeToggle,
  });
}
