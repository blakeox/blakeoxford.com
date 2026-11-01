import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import ChatLauncherIsland from '@/features/chat/ChatLauncherIsland';

function protectedArea(rect: DOMRect) {
  const element = document.createElement('div');
  element.setAttribute('data-chat-avoid-launcher', '');
  element.getBoundingClientRect = () => rect;
  document.body.appendChild(element);
  return element;
}

describe('ChatLauncherIsland content clearance', () => {
  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    document.body.removeAttribute('data-hide-ask-launcher');
  });

  afterEach(() => {
    cleanup();
    document.querySelectorAll('[data-chat-avoid-launcher]').forEach((element) => element.remove());
    document.body.removeAttribute('data-hide-ask-launcher');
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('protects a later card even when the first protected area is clear', () => {
    protectedArea(new DOMRect(0, 0, 400, 200));
    const laterCard = protectedArea(new DOMRect(960, 700, 100, 100));
    const { queryByRole } = render(<ChatLauncherIsland />);
    expect(queryByRole('button', { name: 'Open Ask' })).toBeNull();

    laterCard.getBoundingClientRect = () => new DOMRect(0, 0, 400, 200);
    act(() => window.dispatchEvent(new Event('scroll')));
    expect(queryByRole('button', { name: 'Open Ask' })).not.toBeNull();
  });

  it('keeps Ask available when every protected area is outside its footprint', () => {
    protectedArea(new DOMRect(0, 0, 400, 200));
    protectedArea(new DOMRect(0, 300, 400, 200));
    const { getByRole } = render(<ChatLauncherIsland />);
    expect(getByRole('button', { name: 'Open Ask' })).toBeTruthy();
  });

  it('honors the page-level hide state after navigation', () => {
    document.body.dataset.hideAskLauncher = 'true';
    const { queryByRole } = render(<ChatLauncherIsland />);
    expect(queryByRole('button', { name: 'Open Ask' })).toBeNull();
    document.body.dataset.hideAskLauncher = 'false';
    act(() => document.dispatchEvent(new Event('astro:page-load')));
    expect(queryByRole('button', { name: 'Open Ask' })).not.toBeNull();
  });
});
