import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { registerModernNavBar } from '../../src/scripts/features/ModernNavBar';
import { resetHeaderControllerForTests } from '../../src/utils/headerController';
import { resetScrollLockForTests } from '../../src/utils/scrollLock';

vi.mock('../../src/lib/theme', () => ({
  applySystemTheme: vi.fn(),
  cycleThemePreference: vi.fn(() => 'light'),
  getThemePreference: vi.fn(() => 'system'),
  updateThemeToggleButton: vi.fn(),
  readThemePreference: vi.fn(() => 'system'),
}));

vi.mock('../../src/utils/headerController', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/headerController')>();
  return {
    ...actual,
    closeSearch: vi.fn(),
  };
});

function mountNavDom() {
  document.body.innerHTML = `
    <div class="nav-shell" data-menu-state="closed">
      <div id="nav-menu-status" class="sr-only" aria-live="polite"></div>
      <nav id="navbar">
        <button id="nav-toggle" type="button" aria-expanded="false" aria-label="Open navigation menu">Menu</button>
      </nav>
      <div id="nav-mobile-backdrop" class="mobile-menu-backdrop" data-state="closed" aria-hidden="true"></div>
      <div id="nav-mobile-links" class="mobile-menu" data-state="closed" inert role="dialog">
        <a href="/about/" class="mobile-nav-link">About</a>
      </div>
    </div>
  `;

  return {
    shell: document.querySelector('.nav-shell') as HTMLElement,
    nav: document.getElementById('navbar') as HTMLElement,
    menu: document.getElementById('nav-mobile-links') as HTMLElement,
    backdrop: document.getElementById('nav-mobile-backdrop') as HTMLElement,
    burger: document.getElementById('nav-toggle') as HTMLButtonElement,
    status: document.getElementById('nav-menu-status') as HTMLElement,
  };
}

describe('ModernNavBar', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    resetHeaderControllerForTests();
    resetScrollLockForTests();
    document.body.style.cssText = '';
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    document.body.innerHTML = '';
    resetHeaderControllerForTests();
    resetScrollLockForTests();
  });

  it('opens the mobile menu with backdrop and updated burger label', () => {
    const { nav, menu, backdrop, burger, shell, status } = mountNavDom();

    cleanup = registerModernNavBar({
      navBar: nav,
      navShell: shell,
      mobileMenu: menu,
      mobileBackdrop: backdrop,
      burgerButton: burger,
      menuStatus: status,
    });

    burger.click();

    expect(menu.classList.contains('active')).toBe(true);
    expect(menu.dataset.state).toBe('open');
    expect(menu.inert).toBe(false);
    expect(backdrop.dataset.state).toBe('open');
    expect(backdrop.getAttribute('aria-hidden')).toBe('false');
    expect(shell.dataset.menuState).toBe('open');
    expect(burger.getAttribute('aria-expanded')).toBe('true');
    expect(burger.getAttribute('aria-label')).toBe('Close navigation menu');
    expect(status.textContent).toBe('Navigation menu opened');
  });

  it('closes the mobile menu when the burger is toggled again', () => {
    const { nav, menu, backdrop, burger, shell, status } = mountNavDom();

    cleanup = registerModernNavBar({
      navBar: nav,
      navShell: shell,
      mobileMenu: menu,
      mobileBackdrop: backdrop,
      burgerButton: burger,
      menuStatus: status,
    });

    burger.click();
    burger.click();

    expect(menu.classList.contains('active')).toBe(false);
    expect(menu.dataset.state).toBe('closed');
    expect(menu.inert).toBe(true);
    expect(backdrop.dataset.state).toBe('closed');
    expect(shell.dataset.menuState).toBe('closed');
    expect(burger.getAttribute('aria-expanded')).toBe('false');
    expect(burger.getAttribute('aria-label')).toBe('Open navigation menu');
    expect(status.textContent).toBe('Navigation menu closed');
  });

  it('closes the mobile menu when the backdrop is clicked', () => {
    const { nav, menu, backdrop, burger, shell, status } = mountNavDom();

    cleanup = registerModernNavBar({
      navBar: nav,
      navShell: shell,
      mobileMenu: menu,
      mobileBackdrop: backdrop,
      burgerButton: burger,
      menuStatus: status,
    });

    burger.click();
    backdrop.click();

    expect(menu.classList.contains('active')).toBe(false);
    expect(menu.dataset.state).toBe('closed');
  });

  it('marks the navbar as JS-enhanced', () => {
    const { nav, menu, backdrop, burger, shell } = mountNavDom();

    cleanup = registerModernNavBar({
      navBar: nav,
      navShell: shell,
      mobileMenu: menu,
      mobileBackdrop: backdrop,
      burgerButton: burger,
    });

    expect(nav.getAttribute('data-js-nav')).toBe('true');
  });
});
