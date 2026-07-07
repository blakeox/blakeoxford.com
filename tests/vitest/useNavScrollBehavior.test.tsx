import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useRef } from 'react';

import { useNavScrollBehavior } from '../../src/features/nav/hooks/useNavScrollBehavior';

function ScrollHarness({ blockAutoHide = false }: { blockAutoHide?: boolean }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const { isScrolled, isAutoHidden } = useNavScrollBehavior(
    { shell: shellRef, nav: navRef },
    { blockAutoHide },
  );

  return (
    <div>
      <div ref={shellRef} className={`nav-shell${isAutoHidden ? ' nav-shell--auto-hidden' : ''}`}>
        <nav ref={navRef} id="navbar" />
      </div>
      <output data-scrolled={isScrolled ? 'true' : 'false'} />
      <output data-hidden={isAutoHidden ? 'true' : 'false'} />
    </div>
  );
}

describe('useNavScrollBehavior', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    document.body.style.minHeight = '2000px';
  });

  afterEach(() => {
    document.body.style.minHeight = '';
  });

  it('marks the header compact after scrolling past the threshold', async () => {
    const { container } = render(<ScrollHarness />);
    const nav = container.querySelector('#navbar') as HTMLElement;

    await act(async () => {
      window.scrollY = 120;
      window.dispatchEvent(new Event('scroll'));
    });

    expect(nav.classList.contains('has-background')).toBe(true);
    expect(container.querySelector('output[data-scrolled="true"]')).toBeTruthy();
  });

  it('auto-hides on downward scroll and restores on upward scroll', async () => {
    const { container } = render(<ScrollHarness />);

    await act(async () => {
      window.scrollY = 200;
      window.dispatchEvent(new Event('scroll'));
    });
    await act(async () => {
      window.scrollY = 260;
      window.dispatchEvent(new Event('scroll'));
    });

    expect(container.querySelector('.nav-shell--auto-hidden')).toBeTruthy();

    await act(async () => {
      window.scrollY = 220;
      window.dispatchEvent(new Event('scroll'));
    });

    expect(container.querySelector('.nav-shell--auto-hidden')).toBeFalsy();
  });

  it('does not auto-hide while blockAutoHide is true', async () => {
    const { container } = render(<ScrollHarness blockAutoHide />);

    await act(async () => {
      window.scrollY = 260;
      window.dispatchEvent(new Event('scroll'));
    });
    await act(async () => {
      window.scrollY = 320;
      window.dispatchEvent(new Event('scroll'));
    });

    expect(container.querySelector('.nav-shell--auto-hidden')).toBeFalsy();
  });
});
