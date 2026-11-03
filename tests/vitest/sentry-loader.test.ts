import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeEarlySentryEvents } from '../../src/scripts/sentry-early';
import {
  SENTRY_IDLE_SETTLE_MS,
  SENTRY_IDLE_TIMEOUT_MS,
  installDeferredSentry,
  scheduleDeferredSentry,
  type SentryLoadHost,
} from '../../src/scripts/sentry-loader';

vi.mock('@sentry/astro', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
}));

import {
  browserTracingIntegration,
  captureException,
  captureMessage,
  init,
  replayIntegration,
} from '@sentry/astro';
import { initDeferredSentry } from '../../src/scripts/sentry-browser';

interface FakeHost {
  host: SentryLoadHost;
  timeouts: Array<{ ms: number; cb: () => void }>;
  idles: Array<{ timeout: number; cb: () => void }>;
  fire: (type: string) => void;
}

function createHost(readyState = 'loading', withIdle = true): FakeHost {
  const listeners = new Map<string, Array<() => void>>();
  const timeouts: FakeHost['timeouts'] = [];
  const idles: FakeHost['idles'] = [];
  const host: SentryLoadHost = {
    document: { readyState },
    addEventListener(type, listener) {
      const list = listeners.get(type) ?? [];
      list.push(listener);
      listeners.set(type, list);
    },
    setTimeout(cb, ms) {
      timeouts.push({ ms, cb });
      return timeouts.length;
    },
  };
  if (withIdle) {
    host.requestIdleCallback = (cb, options) => {
      idles.push({ timeout: options.timeout, cb });
      return idles.length;
    };
  }
  return {
    host,
    timeouts,
    idles,
    fire(type) {
      for (const listener of [...(listeners.get(type) ?? [])]) listener();
    },
  };
}

describe('deferred Sentry scheduling', () => {
  it('waits until load settles, then uses requestIdleCallback', () => {
    const start = vi.fn();
    const fake = createHost('loading');
    scheduleDeferredSentry(start, fake.host);

    expect(start).not.toHaveBeenCalled();
    expect(fake.timeouts).toHaveLength(0);

    fake.fire('load');
    expect(fake.timeouts).toEqual([expect.objectContaining({ ms: SENTRY_IDLE_SETTLE_MS })]);
    fake.timeouts[0]?.cb();
    expect(fake.idles).toEqual([expect.objectContaining({ timeout: SENTRY_IDLE_TIMEOUT_MS })]);
    expect(start).not.toHaveBeenCalled();

    fake.idles[0]?.cb();
    expect(start).toHaveBeenCalledOnce();
  });

  it('falls back to setTimeout when requestIdleCallback is missing', () => {
    const start = vi.fn();
    const fake = createHost('complete', false);
    scheduleDeferredSentry(start, fake.host);

    expect(fake.timeouts[0]?.ms).toBe(SENTRY_IDLE_SETTLE_MS);
    fake.timeouts[0]?.cb();
    expect(fake.timeouts[1]?.ms).toBe(SENTRY_IDLE_TIMEOUT_MS);
    fake.timeouts[1]?.cb();
    expect(start).toHaveBeenCalledOnce();
  });

  it.each(['pointerdown', 'keydown', 'error'])('starts on %s before idle', (type) => {
    const start = vi.fn();
    const fake = createHost('loading');
    scheduleDeferredSentry(start, fake.host);
    fake.fire(type);
    fake.fire(type);
    expect(start).toHaveBeenCalledOnce();
  });
});

describe('deferred Sentry install and flush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.__boSentryInstall;
    delete window.__boSentryReady;
    delete window.__boSentryEarly;
  });

  it('loads immediately when an error was already queued', async () => {
    window.__boSentryEarly = [{ kind: 'error', value: new Error('boom') }];
    const load = vi.fn(() => Promise.resolve());
    installDeferredSentry(load);
    await Promise.resolve();
    expect(load).toHaveBeenCalledOnce();
  });

  it('does not statically import the SDK from the page entry', () => {
    const root = resolve(process.cwd());
    const client = readFileSync(resolve(root, 'sentry.client.config.ts'), 'utf8');
    const loader = readFileSync(resolve(root, 'src/scripts/sentry-loader.ts'), 'utf8');
    expect(client).not.toMatch(/@sentry\//);
    expect(client).not.toMatch(/Sentry\.init/);
    expect(loader).not.toMatch(/from ['"]@sentry/);
    expect(loader).toMatch(/import\('\.\/sentry-browser'\)/);
  });

  it('initializes once and flushes queued errors', () => {
    const early = new Error('before-init');
    window.__boSentryEarly = [
      { kind: 'error', value: early },
      { kind: 'rejection', value: 'rejected-string' },
    ];

    initDeferredSentry('https://public@o4512297421897728.ingest.us.sentry.io/0');
    initDeferredSentry('https://public@o4512297421897728.ingest.us.sentry.io/0');

    expect(init).toHaveBeenCalledOnce();
    expect(browserTracingIntegration).toHaveBeenCalledOnce();
    expect(replayIntegration).toHaveBeenCalledWith({
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true,
    });
    expect(captureException).toHaveBeenCalledWith(early);
    expect(captureMessage).toHaveBeenCalledWith('rejected-string');
    expect(window.__boSentryEarly).toBeUndefined();
    expect(consumeEarlySentryEvents()).toEqual([]);
  });
});
