import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { registerNavMobileMenu } from '../../src/scripts/features/registerNavMobileMenu';
import { resetHeaderControllerForTests } from '../../src/utils/headerController';
import { resetScrollLockForTests } from '../../src/utils/scrollLock';

vi.mock('../../src/utils/headerController', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/headerController')>();
  return {
    ...actual,
    closeSearch: vi.fn(),
  };
});

function mountNavFixture() {
  document.body.innerHTML = `
    <div class="nav-shell" data-menu-state="closed">
      <div id="nav-menu-status"></div>
      <nav id="navbar"></nav>
      <button id="nav-toggle" type="button" aria-expanded="false" aria-label="Open navigation menu">Menu</button>
      <div id="nav-mobile-backdrop" data-state="closed" aria-hidden="true"></div>
      <div id="nav-mobile-links" data-state="closed">
        <a href="/about/" class="mobile-nav-link">About</a>
      </div>
    </div>
  `;
  return registerNavMobileMenu();
}

describe('registerNavMobileMenu', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    resetHeaderControllerForTests();
    resetScrollLockForTests();
    document.body.style.cssText = '';
    cleanup = mountNavFixture();
  });

  afterEach(() => {
    cleanup?.();
    document.body.innerHTML = '';
    resetHeaderControllerForTests();
    resetScrollLockForTests();
  });

  it('opens the mobile menu with backdrop and updated burger label', () => {
    const burger = document.getElementById('nav-toggle') as HTMLButtonElement;
    burger.click();

    expect(burger.getAttribute('aria-expanded')).toBe('true');
    expect(burger.getAttribute('aria-label')).toBe('Close navigation menu');
    expect(document.getElementById('nav-mobile-links')?.classList.contains('active')).toBe(true);
    expect(document.querySelector('.nav-shell')?.getAttribute('data-menu-state')).toBe('open');
  });

  it('closes via backdrop click', () => {
    const burger = document.getElementById('nav-toggle') as HTMLButtonElement;
    burger.click();
    (document.getElementById('nav-mobile-backdrop') as HTMLElement).click();

    expect(burger.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('nav-mobile-links')?.classList.contains('active')).toBe(false);
  });
});
