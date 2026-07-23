import {
  applySystemTheme,
  cycleThemePreference,
  getThemePreference,
  updateThemeToggleButton,
  readThemePreference,
} from '@/lib/theme';

type ElementHandle<T extends HTMLElement> =
  T | null | undefined | { current: T | null | undefined };

type NavThemeOptions = {
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

function cycleTheme(button: HTMLButtonElement | null) {
  const nextPreference = cycleThemePreference();
  updateThemeToggleButton(button, nextPreference);
}

export function registerNavTheme(options: NavThemeOptions): CleanupFn {
  const themeToggle = resolveElement(options.themeToggle);
  const cleanupFns: CleanupFn[] = [];

  if (!themeToggle) {
    return () => undefined;
  }

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

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}
