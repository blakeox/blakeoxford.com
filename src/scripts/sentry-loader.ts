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

export function scheduleDeferredSentry(
  start: () => void | Promise<void>,
  host: SentryLoadHost
): void {
  let pending = false;
  let settled = false;
  const run = () => {
    if (pending || settled) return;
    pending = true;
    Promise.resolve()
      .then(() => start())
      .then(() => {
        settled = true;
      })
      .catch(() => {
        // A failed download must not consume the only interaction or idle chance.
        pending = false;
      });
  };

  host.addEventListener('error', run);
  host.addEventListener('unhandledrejection', run);
  for (const type of INTERACTION_EVENTS) {
    host.addEventListener(type, run, { passive: true });
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

  let inFlight: Promise<void> | null = null;
  const start = (): Promise<void> => {
    if (window.__boSentryReady) return Promise.resolve();
    if (inFlight) return inFlight;
    inFlight = load().then(
      () => {
        inFlight = null;
      },
      (error: unknown) => {
        inFlight = null;
        throw error;
      }
    );
    return inFlight;
  };

  if (hasQueuedSentryEvents()) {
    void start().catch(() => {
      // The scheduler still retries on the next interaction or idle.
    });
  }
  scheduleDeferredSentry(start, window);
}
