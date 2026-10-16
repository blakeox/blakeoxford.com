import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const launcherScript = readFileSync('public/js/ai-chat-launcher.js', 'utf8');

describe('Ask launcher event contract', () => {
  let browser: Window;

  beforeEach(() => {
    browser = new Window();
    browser.document.body.innerHTML =
      '<button data-ai-launcher data-ai-action="open" aria-expanded="false">Open Ask</button>';
    new Function('window', 'document', 'CustomEvent', launcherScript)(
      browser,
      browser.document,
      browser.CustomEvent
    );
  });

  afterEach(async () => {
    await browser.happyDOM.close();
  });

  it('requests an open state on every activation, including after closing', () => {
    const requests: unknown[] = [];
    browser.addEventListener('ai-chat:open', (event) => {
      requests.push((event as CustomEvent).detail);
    });
    const launcher = browser.document.querySelector<HTMLButtonElement>('[data-ai-launcher]')!;

    for (let cycle = 0; cycle < 2; cycle += 1) {
      launcher.click();
      expect(requests[cycle]).toEqual({ source: 'launcher', open: true });
      browser.dispatchEvent(new browser.CustomEvent('ai-chat:state', { detail: { open: true } }));
      expect(launcher.getAttribute('aria-expanded')).toBe('true');
      browser.dispatchEvent(new browser.CustomEvent('ai-chat:state', { detail: { open: false } }));
      expect(launcher.getAttribute('aria-expanded')).toBe('false');
    }
  });

  it('reattaches once after an Astro navigation replaces the launcher', () => {
    const requests: unknown[] = [];
    browser.addEventListener('ai-chat:open', (event) => {
      requests.push((event as CustomEvent).detail);
    });
    browser.document.body.innerHTML =
      '<button data-ai-launcher data-ai-action="open">Open Ask</button>';
    browser.document.dispatchEvent(new browser.Event('astro:after-swap'));
    browser.document.dispatchEvent(new browser.Event('astro:after-swap'));
    browser.document.querySelector<HTMLButtonElement>('[data-ai-launcher]')!.click();

    expect(requests).toEqual([{ source: 'launcher', open: true }]);
  });
});
