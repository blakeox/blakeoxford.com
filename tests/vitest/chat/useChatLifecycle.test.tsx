import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useChatLifecycle } from '@/features/chat/hooks/internal/useChatLifecycle';

function setup() {
  const panel = document.createElement('div');
  panel.setAttribute('data-ai-chat-panel', '');
  panel.setAttribute('data-lifecycle-test', '');
  const input = document.createElement('textarea');
  const menuControl = document.createElement('button');
  menuControl.textContent = 'Memory';
  panel.append(input, menuControl);
  const outside = document.createElement('button');
  outside.setAttribute('data-lifecycle-test', '');
  document.body.append(panel, outside);
  outside.focus();
  const { result } = renderHook(() =>
    useChatLifecycle({
      isOpen: false,
      setIsOpen: vi.fn(),
      setError: vi.fn(),
      setChatState: vi.fn(),
      isListening: false,
      toggleListening: vi.fn(),
      inputRef: { current: input },
      lastFocusedElementRef: { current: outside },
    })
  );
  return { result, panel, input, menuControl, outside };
}

describe('Ask opening focus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16)
    );
  });
  afterEach(() => {
    cleanup();
    document.querySelectorAll('[data-lifecycle-test]').forEach((node) => node.remove());
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('preserves a chosen dialog control through delayed opening focus, while allowing intentional composer focus', () => {
    const { result, input, menuControl } = setup();
    act(() => result.current.openChat());
    menuControl.focus();
    act(() => vi.advanceTimersByTime(100));
    expect(document.activeElement).toBe(menuControl);
    act(() => result.current.focusInputIfUnclaimed());
    act(() => vi.advanceTimersByTime(20));
    expect(document.activeElement).toBe(menuControl);
    act(() => result.current.focusInput());
    act(() => vi.advanceTimersByTime(20));
    expect(document.activeElement).toBe(input);
  });

  it('focuses the composer when no dialog control has claimed focus', () => {
    const { result, input } = setup();
    act(() => result.current.openChat());
    act(() => vi.advanceTimersByTime(100));
    expect(document.activeElement).toBe(input);
  });

  it('does not move focus into a dialog closed before its fallback runs', () => {
    const { result, panel, outside } = setup();
    act(() => result.current.openChat());
    panel.setAttribute('inert', '');
    act(() => vi.advanceTimersByTime(100));
    expect(document.activeElement).toBe(outside);
  });
});
