type ElementHandle<T extends HTMLElement> =
  | T
  | null
  | undefined
  | { current: T | null | undefined };

import { registerNavTheme } from './registerNavTheme';

type ModernNavBarOptions = {
  navBar?: ElementHandle<HTMLElement>;
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

/** Theme toggle wiring for the nav bar. Mobile menu is handled by `useMobileMenu` in NavBarIsland. */
export function registerModernNavBar(options: ModernNavBarOptions): CleanupFn {
  const navBar = resolveElement(options.navBar);
  const cleanupTheme = registerNavTheme({ themeToggle: options.themeToggle });

  navBar?.setAttribute('data-js-nav', 'true');

  return () => {
    cleanupTheme();
  };
}

export function initModernNavBar(): CleanupFn | undefined {
  const navBar = document.getElementById('navbar');
  if (!navBar) {
    return undefined;
  }

  const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement | null;

  return registerModernNavBar({
    navBar,
    themeToggle,
  });
}
