/**
 * Core Web Vitals → Zaraz/GA4.
 * Uses native PerformanceObserver APIs (no extra dependency).
 */

import { trackEvent } from './analytics';

type VitalName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';

interface VitalMetric {
  name: VitalName;
  value: number;
  rating: 'good' | 'needs_improvement' | 'poor';
  navigationType: string;
}

const reported = new Set<VitalName>();
let initialized = false;

const THRESHOLDS: Record<VitalName, [number, number]> = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

function ratingFor(name: VitalName, value: number): VitalMetric['rating'] {
  const [good, poor] = THRESHOLDS[name];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs_improvement';
  return 'poor';
}

function navigationType(): string {
  try {
    const entry = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    return entry?.type ?? 'navigate';
  } catch {
    return 'navigate';
  }
}

function report(name: VitalName, value: number, once = true): void {
  if (once && reported.has(name)) return;
  if (once) reported.add(name);
  if (!Number.isFinite(value) || value < 0) return;

  const metric: VitalMetric = {
    name,
    value: name === 'CLS' ? Number(value.toFixed(4)) : Math.round(value),
    rating: ratingFor(name, value),
    navigationType: navigationType(),
  };

  trackEvent('web_vitals', {
    metric_name: metric.name,
    value: metric.value,
    metric_rating: metric.rating,
    navigation_type: metric.navigationType,
  });
}

function observeLcp(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) report('LCP', last.startTime);
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    const finalize = () => {
      observer.disconnect();
    };
    addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'hidden') finalize();
      },
      { once: true }
    );
  } catch {
    /* unsupported */
  }
}

function observeCls(): void {
  try {
    let cls = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEntry[]) {
        const layout = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!layout.hadRecentInput && typeof layout.value === 'number') {
          cls += layout.value;
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });

    const finalize = () => {
      observer.disconnect();
      report('CLS', cls);
    };
    addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'hidden') finalize();
      },
      { once: true }
    );
    addEventListener('pagehide', finalize, { once: true });
  } catch {
    /* unsupported */
  }
}

function observeInp(): void {
  try {
    let maxDuration = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const eventEntry = entry as PerformanceEntry & {
          interactionId?: number;
          duration: number;
        };
        if (eventEntry.interactionId && eventEntry.duration > maxDuration) {
          maxDuration = eventEntry.duration;
        }
      }
    });
    observer.observe({
      type: 'event',
      buffered: true,
      durationThreshold: 16,
    } as PerformanceObserverInit);

    const finalize = () => {
      observer.disconnect();
      if (maxDuration > 0) report('INP', maxDuration);
    };
    addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'hidden') finalize();
      },
      { once: true }
    );
    addEventListener('pagehide', finalize, { once: true });
  } catch {
    /* unsupported */
  }
}

function observeFcp(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          report('FCP', entry.startTime);
          observer.disconnect();
        }
      }
    });
    observer.observe({ type: 'paint', buffered: true });
  } catch {
    /* unsupported */
  }
}

function observeTtfb(): void {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    if (nav && nav.responseStart > 0) {
      report('TTFB', nav.responseStart);
    }
  } catch {
    /* unsupported */
  }
}

/**
 * Start Core Web Vitals collection. Safe to call once per page load.
 */
export function initWebVitals(): void {
  if (initialized || typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return;
  }
  initialized = true;

  observeTtfb();
  observeFcp();
  observeLcp();
  observeCls();
  observeInp();
}

/** Test helper — reset module state between vitest cases. */
export function __resetWebVitalsForTests(): void {
  initialized = false;
  reported.clear();
}
