import { useEffect } from 'react';

type OverlayState = 'idle' | 'fallback';

function openFallbackOverlay(): void {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;

  overlay.dataset.state = 'open';
  overlay.classList.remove('hidden');
  overlay.removeAttribute('inert');

  document.body.dataset.searchOpen = 'true';
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

  overlay.dataset.state = 'closed';
  overlay.setAttribute('inert', '');

  // Defer hiding to allow exit transition
  setTimeout(() => {
    if (overlay.dataset.state === 'closed') {
      overlay.classList.add('hidden');
    }
  }, 200);

  delete document.body.dataset.searchOpen;
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

    const win = window as typeof window & {
      enhancedSearchOverlay?: undefined;
    };
    delete win.enhancedSearchOverlay;

    const doc = document;

    const openOverlay = () => {
      if (cancelled || overlayElement?.dataset.state === 'open') return;
      state = 'fallback';
      openFallbackOverlay();
      // analytics removed; no-op
    };

    const closeOverlay = () => {
      if (overlayElement?.dataset.state === 'closed') return;
      closeFallbackOverlay();
      // analytics removed; no-op
    };

    const toggleButton = doc.getElementById('search-toggle');
    const closeButton = doc.getElementById('close-search');
    const overlayElement = doc.getElementById('search-overlay');
    const backdropElement = overlayElement?.querySelector('[data-overlay-backdrop]');
    const searchInput = doc.getElementById('search-input');

    const handleToggleClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      openOverlay();
    };

    const handleCloseClick = (event: Event) => {
      event.preventDefault();
      closeOverlay();
    };

    const handleSlashShortcut = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.defaultPrevented) return;
      const activeElement = doc.activeElement as HTMLElement | null;
      if (activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName)) {
        return;
      }
      event.preventDefault();
      openOverlay();
    };

    const handleMetaKShortcut = (event: KeyboardEvent) => {
      const metaKey = event.metaKey || event.ctrlKey;
      if (!metaKey || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      openOverlay();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (overlayElement?.dataset.state !== 'open' && state !== 'fallback') return;
      event.preventDefault();
      closeOverlay();
    };

    const handleBackdrop = (event: MouseEvent) => {
      if (!overlayElement || event.target !== backdropElement) return;
      closeOverlay();
    };

    const handleFocusTrap = (event: FocusEvent) => {
      if (overlayElement?.dataset.state !== 'open') return;
      if (!overlayElement.contains(event.target as Node)) {
        event.stopPropagation();
        searchInput?.focus();
      }
    };

    toggleButton?.addEventListener('click', handleToggleClick, { passive: false });
    closeButton?.addEventListener('click', handleCloseClick, { passive: false });
    backdropElement?.addEventListener('click', handleBackdrop, { passive: true });

    doc.addEventListener('keydown', handleSlashShortcut, { passive: false });
    doc.addEventListener('keydown', handleMetaKShortcut, { passive: false });
    doc.addEventListener('keydown', handleEscape, { passive: true });
    doc.addEventListener('focusin', handleFocusTrap, { passive: true });

    return () => {
      cancelled = true;
      toggleButton?.removeEventListener('click', handleToggleClick);
      closeButton?.removeEventListener('click', handleCloseClick);
      backdropElement?.removeEventListener('click', handleBackdrop);
      doc.removeEventListener('keydown', handleSlashShortcut);
      doc.removeEventListener('keydown', handleMetaKShortcut);
      doc.removeEventListener('keydown', handleEscape);
      doc.removeEventListener('focusin', handleFocusTrap);
    };
  }, []);

  return null;
}
