import { useCallback, useEffect, useState } from 'react';

import {
  closeMobileMenu,
  closeAiChat,
  registerEscapeHandler,
  registerSearchClose,
} from '../../../utils/headerController';
import {
  COMMAND_CENTER_CLOSE,
  COMMAND_CENTER_OPEN,
  COMMAND_CENTER_TOGGLE,
} from '../lib/commandEvents';

export function useCommandCenter() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    closeMobileMenu();
    closeAiChat();
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) closeMobileMenu();
      return !prev;
    });
  }, []);

  useEffect(() => {
    const onOpen = () => open();
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
    const toggleButton = document.getElementById('search-toggle');
    const setExpanded = (expanded: boolean) => {
      toggleButton?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    };

    setExpanded(isOpen);

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

    return () => {
      if (win.commandCenter === api) delete win.commandCenter;
      if (win.searchOverlay === api) delete win.searchOverlay;
      if (win.enhancedSearchOverlay === api) delete win.enhancedSearchOverlay;
      setExpanded(false);
    };
  }, [isOpen, open, close, toggle]);

  useEffect(() => {
    const handleToggleClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      open();
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
      open();
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

  return { isOpen, open, close, toggle };
}
