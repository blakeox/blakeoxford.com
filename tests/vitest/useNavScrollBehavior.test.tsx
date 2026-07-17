import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { registerNavScrollBehavior } from '../../src/scripts/features/registerNavScrollBehavior';

describe('registerNavScrollBehavior', () => {
  let cleanup: () => void;

  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    document.body.style.minHeight = '2000px';
    document.body.innerHTML = `
      <div class="nav-shell" data-menu-state="closed">
        <nav id="navbar"></nav>
      </div>
    `;
    cleanup = registerNavScrollBehavior();
  });

  afterEach(() => {
    cleanup?.();
    document.body.innerHTML = '';
    document.body.style.minHeight = '';
  });

  it('marks the header compact after scrolling past the threshold', () => {
    const nav = document.getElementById('navbar') as HTMLElement;

    window.scrollY = 120;
    window.dispatchEvent(new Event('scroll'));

    expect(nav.classList.contains('has-background')).toBe(true);
    expect(document.querySelector('.nav-shell--scrolled')).toBeTruthy();
  });

  it('auto-hides on downward scroll and restores on upward scroll', () => {
    window.scrollY = 200;
    window.dispatchEvent(new Event('scroll'));
    window.scrollY = 260;
    window.dispatchEvent(new Event('scroll'));

    expect(document.querySelector('.nav-shell--auto-hidden')).toBeTruthy();

    window.scrollY = 220;
    window.dispatchEvent(new Event('scroll'));

    expect(document.querySelector('.nav-shell--auto-hidden')).toBeFalsy();
  });

  it('does not auto-hide while the mobile menu is open', () => {
    document.querySelector('.nav-shell')?.setAttribute('data-menu-state', 'open');

    window.scrollY = 260;
    window.dispatchEvent(new Event('scroll'));
    window.scrollY = 320;
    window.dispatchEvent(new Event('scroll'));

    expect(document.querySelector('.nav-shell--auto-hidden')).toBeFalsy();
  });
});
