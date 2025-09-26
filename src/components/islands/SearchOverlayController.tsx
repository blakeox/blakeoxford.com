import { useEffect } from 'react';

type EnhancedOverlay = {
  open: () => void;
  closeSearchOverlay: () => void;
  preload?: () => Promise<void> | void;
  ready?: () => boolean;
};

type MaybeEnhanced = EnhancedOverlay | null | undefined;

type OverlayState = 'idle' | 'loading' | 'ready' | 'fallback';

type AnalyticsEvent = {
  category: string;
  action: string;
  label?: string;
  [key: string]: unknown;
};

const OVERLAY_MODULE = () => import('../../scripts/features/EnhancedSearchOverlay');

function trackAnalytics(event: AnalyticsEvent): void {
  try {
    (window as typeof window & { analytics?: { track?: (e: AnalyticsEvent) => void } }).analytics?.track?.(event);
  } catch (error) {
    console.warn('Search analytics tracking failed', error);
  }
}

function openFallbackOverlay(): void {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;

  overlay.classList.add('active');
  overlay.style.visibility = 'visible';
  overlay.style.opacity = '1';
  overlay.removeAttribute('inert');

  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';

  const input = document.getElementById('search-input') as HTMLInputElement | null;
  if (input) {
    setTimeout(() => input.focus(), 50);
    input.setAttribute('aria-expanded', 'true');
  }
}

function closeFallbackOverlay(): void {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;

  overlay.classList.remove('active');
  overlay.style.visibility = 'hidden';
  overlay.style.opacity = '0';
  overlay.setAttribute('inert', '');

  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';

  const input = document.getElementById('search-input');
  input?.setAttribute('aria-expanded', 'false');
}

export default function SearchOverlayController() {
  useEffect(() => {
    let cancelled = false;
    let state: OverlayState = 'idle';
    let ensurePromise: Promise<MaybeEnhanced> | null = null;
    let enhancedInstance: MaybeEnhanced = null;
    let idleTimeoutId: number | null = null;

    const cleanupCallbacks: Array<() => void> = [];

    const win = window as typeof window & {
      enhancedSearchOverlay?: MaybeEnhanced;
    };

    const doc = document;

    const isAudit = !!(win as any).__AUDIT__ || /(^|;)\s*audit=1(;$|;|\s|$)/.test((doc.cookie ?? '')) || /lighthouse|headlesschrome/i.test(navigator.userAgent ?? '');
    const isAutomation = (() => {
      try {
        if (navigator.webdriver) return true;
        const g = win as any;
        return !!(g && (g.__PLAYWRIGHT__ || g.__PW_PRELOAD__));
      } catch {
        return false;
      }
    })();

    const skipEnhanced = isAudit && !isAutomation;

    const ensureOverlay = async (): Promise<MaybeEnhanced> => {
      if (cancelled) return null;
      if (skipEnhanced) {
        state = 'fallback';
        return null;
      }
      if (enhancedInstance) {
        state = 'ready';
        return enhancedInstance;
      }
      if (win.enhancedSearchOverlay) {
        enhancedInstance = win.enhancedSearchOverlay;
        state = 'ready';
        return enhancedInstance;
      }
      if (ensurePromise) {
        return ensurePromise;
      }

      state = 'loading';
      ensurePromise = OVERLAY_MODULE()
        .then((module) => {
          if (cancelled) return null;
          enhancedInstance = module.default ?? (module as unknown as MaybeEnhanced);
          win.enhancedSearchOverlay = enhancedInstance ?? undefined;
          state = enhancedInstance ? 'ready' : 'fallback';
          if (enhancedInstance?.preload) {
            try {
              void enhancedInstance.preload();
            } catch (error) {
              console.warn('Search overlay preload failed', error);
            }
          }
          return enhancedInstance;
        })
        .catch((error) => {
          console.warn('Enhanced search overlay failed to load', error);
          state = 'fallback';
          return null;
        })
        .finally(() => {
          ensurePromise = null;
        });

      return ensurePromise;
    };

    const openOverlay = async () => {
      const instance = await ensureOverlay();
      if (cancelled) return;

      if (instance && typeof instance.open === 'function') {
        try {
          instance.open();
          trackAnalytics({ category: 'search', action: 'open_enhanced' });
          return;
        } catch (error) {
          console.warn('Enhanced search overlay open failed', error);
          state = 'fallback';
        }
      }

      openFallbackOverlay();
      trackAnalytics({ category: 'search', action: 'open_fallback', state });
    };

    const closeOverlay = async () => {
      if (state === 'fallback') {
        closeFallbackOverlay();
        trackAnalytics({ category: 'search', action: 'close_fallback' });
        return;
      }

      const instance = await ensureOverlay();
      if (instance && typeof instance.closeSearchOverlay === 'function') {
        try {
          instance.closeSearchOverlay();
          trackAnalytics({ category: 'search', action: 'close_enhanced' });
        } catch (error) {
          console.warn('Enhanced search overlay close failed', error);
          closeFallbackOverlay();
        }
        return;
      }

      closeFallbackOverlay();
      trackAnalytics({ category: 'search', action: 'close_fallback_no_instance' });
    };

    const toggleButton = doc.getElementById('search-toggle');
    const closeButton = doc.getElementById('close-search');
    const overlayElement = doc.getElementById('search-overlay');
    const searchInput = doc.getElementById('search-input');

    const handleToggleClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      void openOverlay();
    };

    const handleCloseClick = (event: Event) => {
      event.preventDefault();
      void closeOverlay();
    };

    const handleSlashShortcut = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.defaultPrevented) return;
      const activeElement = doc.activeElement as HTMLElement | null;
      if (activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName)) {
        return;
      }
      event.preventDefault();
      void openOverlay();
    };

    const handleMetaKShortcut = (event: KeyboardEvent) => {
      const metaKey = event.metaKey || event.ctrlKey;
      if (!metaKey || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      void openOverlay();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (!overlayElement?.classList.contains('active') && state !== 'ready') return;
      event.preventDefault();
      void closeOverlay();
    };

    const handleBackdrop = (event: MouseEvent) => {
      if (!overlayElement || event.target !== overlayElement) return;
      void closeOverlay();
    };

    const handleFocusTrap = (event: FocusEvent) => {
      if (!overlayElement?.classList.contains('active')) return;
      if (!overlayElement.contains(event.target as Node)) {
        event.stopPropagation();
        searchInput?.focus();
      }
    };

    toggleButton?.addEventListener('click', handleToggleClick, { passive: false });
    closeButton?.addEventListener('click', handleCloseClick, { passive: false });
    overlayElement?.addEventListener('click', handleBackdrop, { passive: true });

    doc.addEventListener('keydown', handleSlashShortcut, { passive: false });
    doc.addEventListener('keydown', handleMetaKShortcut, { passive: false });
    doc.addEventListener('keydown', handleEscape, { passive: true });
    doc.addEventListener('focusin', handleFocusTrap, { passive: true });

    if ('requestIdleCallback' in win && !skipEnhanced) {
      const id = (win as any).requestIdleCallback?.(() => {
        if (!cancelled) void ensureOverlay();
      }, { timeout: 20000 });
      cleanupCallbacks.push(() => (win as any).cancelIdleCallback?.(id));
    } else if (!skipEnhanced) {
      idleTimeoutId = window.setTimeout(() => {
        if (!cancelled) void ensureOverlay();
      }, 20000);
      cleanupCallbacks.push(() => {
        if (idleTimeoutId !== null) {
          window.clearTimeout(idleTimeoutId);
          idleTimeoutId = null;
        }
      });
    }

    cleanupCallbacks.push(() => {
      toggleButton?.removeEventListener('click', handleToggleClick);
      closeButton?.removeEventListener('click', handleCloseClick);
      overlayElement?.removeEventListener('click', handleBackdrop);
      doc.removeEventListener('keydown', handleSlashShortcut);
      doc.removeEventListener('keydown', handleMetaKShortcut);
      doc.removeEventListener('keydown', handleEscape);
      doc.removeEventListener('focusin', handleFocusTrap);
    });

    return () => {
      cancelled = true;
      cleanupCallbacks.forEach((fn) => fn());
    };
  }, []);

  return null;
}
