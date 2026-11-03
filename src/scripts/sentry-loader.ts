import { hasQueuedSentryEvents } from './sentry-early';

/**
 * requestIdleCallback's timeout is a deadline, not a delay: on a quiet page it
 * runs on the first idle, which is still inside Lighthouse's post-load quiet
 * window and the main-thread work that becomes TBT. Arm it only after load has
 * settled. Errors and the first interaction skip the wait.
 */
export const SENTRY_IDLE_SETTLE_MS = 2500;
export const SENTRY_IDLE_TIMEOUT_MS = 2000;

const INTERACTION_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;

export interface SentryLoadHost {
  requestIdleCallback?: (callback: () => void, options: { timeout: number }) => number;
  setTimeout: (callback: () => void, delayMs: number) => number;
  addEventListener: (
    type: string,
    listener: () => void,
    options?: { once?: boolean; passive?: boolean }
  ) => void;
  document: { readyState: string };
}

async function defaultLoadSentry(): Promise<void> {
  const mod = await import('./sentry-browser');
  mod.initDeferredSentry();
}

export function scheduleDeferredSentry(start: () => void, host: SentryLoadHost): void {
  let started = false;
  const run = () => {
    if (started) return;
    started = true;
    start();
  };

  host.addEventListener('error', run, { once: true });
  host.addEventListener('unhandledrejection', run, { once: true });
  for (const type of INTERACTION_EVENTS) {
    host.addEventListener(type, run, { once: true, passive: true });
  }

  const armIdle = () => {
    if (typeof host.requestIdleCallback === 'function') {
      host.requestIdleCallback(run, { timeout: SENTRY_IDLE_TIMEOUT_MS });
      return;
    }
    host.setTimeout(run, SENTRY_IDLE_TIMEOUT_MS);
  };

  const armAfterSettle = () => {
    host.setTimeout(armIdle, SENTRY_IDLE_SETTLE_MS);
  };

  if (host.document.readyState === 'complete') armAfterSettle();
  else host.addEventListener('load', armAfterSettle, { once: true });
}

/** Arm the browser SDK without putting it on the initial module graph. */
export function installDeferredSentry(load: () => Promise<void> = defaultLoadSentry): void {
  if (typeof window === 'undefined' || window.__boSentryInstall) return;
  window.__boSentryInstall = true;

  let loading = false;
  const start = () => {
    if (loading || window.__boSentryReady) return;
    loading = true;
    void load().catch(() => {
      loading = false;
    });
  };

  if (hasQueuedSentryEvents()) start();
  scheduleDeferredSentry(start, window);
}
