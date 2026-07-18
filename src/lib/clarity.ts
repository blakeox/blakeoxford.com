/**
 * Microsoft Clarity — standard install snippet (https://clarity.microsoft.com).
 * Loaded client-side only when PUBLIC_CLARITY_PROJECT_ID is set.
 */

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };

let initialized = false;

export function initClarity(projectId: string): void {
  if (initialized || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const id = projectId.trim();
  if (!id) return;

  initialized = true;

  const win = window as Window & { clarity?: ClarityFn };
  win.clarity =
    win.clarity ||
    function clarityQueue(...args: unknown[]) {
      (win.clarity!.q = win.clarity!.q || []).push(args);
    };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${id}`;
  const firstScript = document.getElementsByTagName('script')[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);

  // Session-level context for filtering in Clarity
  win.clarity('set', 'site', 'blakeoxford.com');
  win.clarity(
    'set',
    'surface',
    typeof document !== 'undefined' ? document.body?.dataset?.surface || 'site' : 'site'
  );
}

export function trackClarityEvent(eventName: string): void {
  if (typeof window === 'undefined' || typeof window.clarity !== 'function') {
    return;
  }

  window.clarity('event', eventName);
}

/** Attach custom tags for session filtering (string values only). */
export function setClarityTags(tags: Record<string, string>): void {
  if (typeof window === 'undefined' || typeof window.clarity !== 'function') {
    return;
  }

  for (const [key, value] of Object.entries(tags)) {
    if (!key || value === undefined || value === null) continue;
    window.clarity('set', key, String(value).slice(0, 255));
  }
}

/** Test helper — reset module state between vitest cases. */
export function __resetClarityForTests(): void {
  initialized = false;
}
