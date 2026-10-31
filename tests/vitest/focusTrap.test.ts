import { afterEach, describe, expect, it } from 'vitest';
import { createFocusTrap } from '@/utils/focusTrap';

function visible(element: HTMLElement) {
  element.getClientRects = () => [new DOMRect(0, 0, 80, 44)] as unknown as DOMRectList;
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('modal keyboard focus sequence', () => {
  it('cycles eligible controls in both directions and restores the trigger', () => {
    const trigger = visible(document.createElement('button'));
    const panel = document.createElement('div');
    const first = visible(document.createElement('input'));
    const excluded = visible(document.createElement('button'));
    excluded.tabIndex = -1;
    const last = visible(document.createElement('button'));
    panel.append(first, excluded, last);
    document.body.append(trigger, panel);
    trigger.focus();
    const trap = createFocusTrap(panel);
    trap.activate();
    expect(document.activeElement).toBe(first);
    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    );
    expect(document.activeElement).toBe(last);
    last.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    );
    expect(document.activeElement).toBe(first);
    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
    );
    expect(document.activeElement).toBe(last);
    trap.deactivate();
    expect(document.activeElement).toBe(trigger);
  });

  it('ignores hidden and inert content and recovers when a focused control is removed', () => {
    const panel = document.createElement('div');
    const first = visible(document.createElement('input'));
    const hiddenGroup = document.createElement('div');
    hiddenGroup.hidden = true;
    hiddenGroup.append(visible(document.createElement('button')));
    const inertGroup = document.createElement('div');
    inertGroup.setAttribute('inert', '');
    inertGroup.append(visible(document.createElement('button')));
    const last = visible(document.createElement('button'));
    panel.append(first, hiddenGroup, inertGroup, last);
    document.body.append(panel);
    const trap = createFocusTrap(panel);
    trap.activate();
    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    );
    expect(document.activeElement).toBe(last);
    last.remove();
    trap.update();
    expect(document.activeElement).toBe(first);
    trap.deactivate();
  });
  it('respects Tab already handled by an inner control', () => {
    const panel = document.createElement('div');
    const input = visible(document.createElement('input'));
    panel.append(input, visible(document.createElement('button')));
    document.body.append(panel);
    input.addEventListener('keydown', (event) => event.preventDefault());
    const trap = createFocusTrap(panel);
    trap.activate();
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    );
    expect(document.activeElement).toBe(input);
    trap.deactivate();
  });
});
