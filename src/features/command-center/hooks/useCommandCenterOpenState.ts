import { useCallback, useEffect, useState } from 'react';

import { useOverlayScrollLock } from '@/lib/hooks/useOverlayScrollLock';
import {
  closeMobileMenu,
  registerEscapeHandler,
  registerSearchClose,
} from '@/utils/headerController';
import {
  COMMAND_CENTER_CLOSE,
  COMMAND_CENTER_OPEN,
  COMMAND_CENTER_TOGGLE,
  type CommandCenterOpenDetail,
} from '@/features/command-center/lib/commandEvents';
import { commandCenterEvents } from '@/features/command-center/lib/analytics';

/**
 * Open/close lifecycle, window API, and global shortcuts for Command Center.
 */
export function useCommandCenterOpenState() {
  const [isOpen, setIsOpen] = useState(false);
  const [seedQuery, setSeedQuery] = useState<string | null>(null);
  const { releaseNow: releaseScrollLockNow } = useOverlayScrollLock(isOpen);

  const open = useCallback((source: 'shortcut' | 'nav' | 'api' | 'unknown' = 'unknown') => {
    closeMobileMenu();
    setIsOpen(true);
    commandCenterEvents.open(source);
  }, []);

  const clearSeedQuery = useCallback(() => setSeedQuery(null), []);

  const close = useCallback(() => {
    releaseScrollLockNow();
    setIsOpen(false);
    commandCenterEvents.close();
    window.dispatchEvent(new Event('command-center:closed'));
  }, [releaseScrollLockNow]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        closeMobileMenu();
        commandCenterEvents.open('shortcut');
      } else {
        releaseScrollLockNow();
        commandCenterEvents.close();
        window.dispatchEvent(new Event('command-center:closed'));
      }
      return !prev;
    });
  }, [releaseScrollLockNow]);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<CommandCenterOpenDetail>).detail;
      if (typeof detail?.query === 'string' && detail.query.trim()) {
        setSeedQuery(detail.query.trim());
      }
      open('api');
    };
    const onClose = () => close();
    const onToggle = () => toggle();

    window.addEventListener(COMMAND_CENTER_OPEN, onOpen);
    window.addEventListener(COMMAND_CENTER_CLOSE, onClose);
    window.addEventListener(COMMAND_CENTER_TOGGLE, onToggle);

    return () => {
      window.removeEventListener(COMMAND_CENTER_OPEN, onOpen);
      window.removeEventListener(COMMAND_CENTER_CLOSE, onClose);
      window.removeEventListener(COMMAND_CENTER_TOGGLE, onToggle);
    };
  }, [open, close, toggle]);

  useEffect(() => {
    const mountRoot = document.getElementById('search-overlay');
    const toggleButton = document.getElementById('search-toggle');
    const setExpanded = (expanded: boolean) => {
      toggleButton?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    };

    setExpanded(isOpen);
    mountRoot?.setAttribute('data-state', isOpen ? 'open' : 'closed');
    mountRoot?.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    if (isOpen) mountRoot?.removeAttribute('inert');
    else mountRoot?.setAttribute('inert', '');
    mountRoot?.setAttribute('data-ready', 'true');
    toggleButton?.setAttribute('aria-controls', 'search-overlay');
    document.body.dataset.commandCenterReady = 'true';

    const api = {
      openSearchOverlay: open,
      closeSearchOverlay: close,
      open: open,
      close: close,
      toggle,
    };

    const win = window as typeof window & {
      commandCenter?: typeof api;
      searchOverlay?: typeof api;
      enhancedSearchOverlay?: typeof api;
    };

    win.commandCenter = api;
    win.searchOverlay = api;
    win.enhancedSearchOverlay = api;
    window.dispatchEvent(new Event('command-center:hydrated'));

    return () => {
      if (win.commandCenter === api) delete win.commandCenter;
      if (win.searchOverlay === api) delete win.searchOverlay;
      if (win.enhancedSearchOverlay === api) delete win.enhancedSearchOverlay;
      setExpanded(false);
      mountRoot?.setAttribute('data-state', 'closed');
      mountRoot?.setAttribute('aria-hidden', 'true');
      mountRoot?.setAttribute('inert', '');
      mountRoot?.setAttribute('data-ready', 'false');
      toggleButton?.removeAttribute('aria-controls');
      delete document.body.dataset.commandCenterReady;
    };
  }, [isOpen, open, close, toggle]);

  useEffect(() => {
    const handleToggleClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      open('nav');
    };

    const toggleButton = document.getElementById('search-toggle');
    toggleButton?.addEventListener('click', handleToggleClick, { passive: false });

    return () => toggleButton?.removeEventListener('click', handleToggleClick);
  }, [open]);

  useEffect(() => {
    const handleSlash = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.defaultPrevented) return;
      const active = document.activeElement as HTMLElement | null;
      if (active && ['INPUT', 'TEXTAREA'].includes(active.tagName)) return;
      event.preventDefault();
      open('shortcut');
    };

    const handleMetaK = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      toggle();
    };

    document.addEventListener('keydown', handleSlash, { passive: false });
    document.addEventListener('keydown', handleMetaK, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleSlash);
      document.removeEventListener('keydown', handleMetaK);
    };
  }, [open, toggle]);

  useEffect(() => {
    const handlePageLoad = () => {
      if (isOpen) close();
    };

    document.addEventListener('astro:page-load', handlePageLoad);
    return () => document.removeEventListener('astro:page-load', handlePageLoad);
  }, [isOpen, close]);

  useEffect(() => {
    const cleanupEscape = registerEscapeHandler({
      id: 'command-center',
      priority: 2,
      isActive: () => isOpen,
      handle: () => close(),
    });
    const cleanupSearchClose = registerSearchClose(close);
    return () => {
      cleanupEscape();
      cleanupSearchClose();
    };
  }, [isOpen, close]);

  return { isOpen, open, close, toggle, seedQuery, clearSeedQuery };
}
