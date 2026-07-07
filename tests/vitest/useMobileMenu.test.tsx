import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRef } from 'react';

import { useMobileMenu } from '../../src/features/nav/hooks/useMobileMenu';
import { closeSearch, resetHeaderControllerForTests } from '../../src/utils/headerController';
import { resetScrollLockForTests } from '../../src/utils/scrollLock';

vi.mock('../../src/utils/headerController', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/headerController')>();
  return {
    ...actual,
    closeSearch: vi.fn(),
  };
});

function MobileMenuFixture() {
  const menuRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const { isOpen, burgerLabel, onBurgerClick, onBackdropClick } = useMobileMenu({
    menu: menuRef,
    backdrop: backdropRef,
    burger: burgerRef,
    status: statusRef,
  });

  return (
    <div className="nav-shell" data-menu-state={isOpen ? 'open' : 'closed'}>
      <div ref={statusRef} id="nav-menu-status" />
      <button
        ref={burgerRef}
        id="nav-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-label={burgerLabel}
        onClick={onBurgerClick}
      >
        Menu
      </button>
      <div
        ref={backdropRef}
        id="nav-mobile-backdrop"
        data-state={isOpen ? 'open' : 'closed'}
        aria-hidden={isOpen ? 'false' : 'true'}
        onClick={onBackdropClick}
      />
      <div
        ref={menuRef}
        id="nav-mobile-links"
        data-state={isOpen ? 'open' : 'closed'}
        className={isOpen ? 'active' : ''}
      >
        <a href="/about/" className="mobile-nav-link">
          About
        </a>
      </div>
    </div>
  );
}

describe('useMobileMenu', () => {
  beforeEach(() => {
    resetHeaderControllerForTests();
    resetScrollLockForTests();
    document.body.style.cssText = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    resetHeaderControllerForTests();
    resetScrollLockForTests();
  });

  it('opens the mobile menu with backdrop and updated burger label', () => {
    render(<MobileMenuFixture />);

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));

    const menu = document.getElementById('nav-mobile-links')!;
    const backdrop = document.getElementById('nav-mobile-backdrop')!;
    const shell = document.querySelector('.nav-shell') as HTMLElement;
    const burger = screen.getByRole('button', { name: 'Close navigation menu' });
    const status = document.getElementById('nav-menu-status')!;

    expect(menu.classList.contains('active')).toBe(true);
    expect(menu.dataset.state).toBe('open');
    expect(backdrop.dataset.state).toBe('open');
    expect(backdrop.getAttribute('aria-hidden')).toBe('false');
    expect(shell.dataset.menuState).toBe('open');
    expect(burger.getAttribute('aria-expanded')).toBe('true');
    expect(status.textContent).toBe('Navigation menu opened');
  });

  it('closes the mobile menu when the burger is toggled again', () => {
    render(<MobileMenuFixture />);

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close navigation menu' }));

    const menu = document.getElementById('nav-mobile-links')!;
    const backdrop = document.getElementById('nav-mobile-backdrop')!;
    const shell = document.querySelector('.nav-shell') as HTMLElement;
    const status = document.getElementById('nav-menu-status')!;

    expect(menu.classList.contains('active')).toBe(false);
    expect(menu.dataset.state).toBe('closed');
    expect(backdrop.dataset.state).toBe('closed');
    expect(shell.dataset.menuState).toBe('closed');
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toBeTruthy();
    expect(status.textContent).toBe('Navigation menu closed');
  });

  it('closes the mobile menu when the backdrop is clicked', () => {
    render(<MobileMenuFixture />);

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    fireEvent.click(document.getElementById('nav-mobile-backdrop')!);

    const menu = document.getElementById('nav-mobile-links')!;
    expect(menu.classList.contains('active')).toBe(false);
    expect(menu.dataset.state).toBe('closed');
  });

  it('closes command center search when opening the mobile menu', () => {
    render(<MobileMenuFixture />);

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));

    expect(vi.mocked(closeSearch)).toHaveBeenCalledTimes(1);
  });
});
