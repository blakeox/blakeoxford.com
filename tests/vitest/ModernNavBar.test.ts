import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { registerModernNavBar } from '../../src/scripts/features/ModernNavBar';

vi.mock('../../src/lib/theme', () => ({
  applySystemTheme: vi.fn(),
  cycleThemePreference: vi.fn(() => 'light'),
  getThemePreference: vi.fn(() => 'system'),
  updateThemeToggleButton: vi.fn(),
  readThemePreference: vi.fn(() => 'system'),
}));

function mountNavDom() {
  document.body.innerHTML = `
    <nav id="navbar">
      <button id="theme-toggle" type="button">Theme</button>
    </nav>
  `;

  return {
    nav: document.getElementById('navbar') as HTMLElement,
    themeToggle: document.getElementById('theme-toggle') as HTMLButtonElement,
  };
}

describe('ModernNavBar', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    document.body.style.cssText = '';
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    document.body.innerHTML = '';
  });

  it('marks the navbar as JS-enhanced', () => {
    const { nav, themeToggle } = mountNavDom();

    cleanup = registerModernNavBar({
      navBar: nav,
      themeToggle,
    });

    expect(nav.getAttribute('data-js-nav')).toBe('true');
  });

  it('initializes the theme toggle button', async () => {
    const { updateThemeToggleButton } = await import('../../src/lib/theme');
    const { nav, themeToggle } = mountNavDom();

    cleanup = registerModernNavBar({
      navBar: nav,
      themeToggle,
    });

    expect(updateThemeToggleButton).toHaveBeenCalledWith(themeToggle, 'system');
  });
});
