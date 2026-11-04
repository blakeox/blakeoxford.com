export interface EarlySentryEvent {
  kind: 'error' | 'rejection';
  value: unknown;
}

declare global {
  interface Window {
    /** Inline head script already installed the early-error queue. */
    __boSentryQueueReady?: boolean;
    /** Errors seen before the SDK is imported. Cleared once they are flushed. */
    __boSentryEarly?: EarlySentryEvent[];
    /** Deferred loader has been armed for this document. */
    __boSentryInstall?: boolean;
    /** Browser SDK init has completed. */
    __boSentryReady?: boolean;
  }
}

export const EARLY_SENTRY_LIMIT = 20;

export function hasQueuedSentryEvents(): boolean {
  return Array.isArray(window.__boSentryEarly) && window.__boSentryEarly.length > 0;
}

/** Take queued pre-init failures and stop the inline recorder. */
export function consumeEarlySentryEvents(): EarlySentryEvent[] {
  if (typeof window === 'undefined') return [];
  const queued = window.__boSentryEarly;
  window.__boSentryEarly = undefined;
  if (!Array.isArray(queued)) return [];
  return queued.slice();
}
