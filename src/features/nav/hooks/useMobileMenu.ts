import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import { useOverlayScrollLock } from '../../../hooks/useOverlayScrollLock';
import {
  closeSearch,
  registerEscapeHandler,
  registerMobileMenuClose,
} from '../../../utils/headerController';
import { createFocusTrap, type FocusTrap } from '../../../utils/focusTrap';

export const MENU_LABEL_OPEN = 'Open navigation menu';
export const MENU_LABEL_CLOSED = 'Close navigation menu';

const DESKTOP_NAV_QUERY = '(min-width: 768px)';

export type MobileMenuRefs = {
  menu: RefObject<HTMLElement | null>;
  backdrop: RefObject<HTMLElement | null>;
  burger: RefObject<HTMLButtonElement | null>;
  status: RefObject<HTMLElement | null>;
};

function getInitialMenuFocus(menu: HTMLElement): HTMLElement | null {
  return menu.querySelector<HTMLElement>('.mobile-nav-link') ?? menu.querySelector<HTMLElement>('a[href]');
}

export function useMobileMenu(refs: MobileMenuRefs) {
  const [isOpen, setIsOpen] = useState(false);
  const focusTrapRef = useRef<FocusTrap | null>(null);
  const isOpenRef = useRef(isOpen);
  const { releaseNow: releaseScrollLockNow } = useOverlayScrollLock(isOpen);

  isOpenRef.current = isOpen;

  const close = useCallback(() => {
    releaseScrollLockNow();
    focusTrapRef.current?.deactivate();
    setIsOpen(false);
  }, [releaseScrollLockNow]);

  const open = useCallback(() => {
    closeSearch();
    setIsOpen(true);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) closeSearch();
      return !prev;
    });
  }, []);

  useEffect(() => {
    const menu = refs.menu.current;
    const burger = refs.burger.current;
    if (!menu || !burger) return;

    if (!focusTrapRef.current) {
      focusTrapRef.current = createFocusTrap(menu, {
        initialFocus: getInitialMenuFocus(menu),
        returnFocus: burger,
        fallbackFocus: menu,
      });
    }

    const trap = focusTrapRef.current;
    const status = refs.status.current;

    if (isOpen) {
      trap.activate();
      if (status) status.textContent = 'Navigation menu opened';
    } else {
      trap.deactivate();
      if (status) status.textContent = 'Navigation menu closed';
    }

    return () => {
      trap.deactivate();
    };
  }, [isOpen, refs.menu, refs.burger, refs.status]);

  useEffect(() => {
    const unregisterClose = registerMobileMenuClose(() => {
      if (isOpenRef.current) close();
    });

    const unregisterEscape = registerEscapeHandler({
      id: 'mobile-menu',
      priority: 1,
      isActive: () => isOpenRef.current,
      handle: () => close(),
    });

    return () => {
      unregisterClose();
      unregisterEscape();
    };
  }, [close]);

  useEffect(() => {
    if (!isOpen) return;

    const menu = refs.menu.current;
    const burger = refs.burger.current;
    const backdrop = refs.backdrop.current;
    if (!menu || !burger) return;

    const outsideClickHandler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menu.contains(target) || burger.contains(target) || backdrop?.contains(target)) {
        return;
      }
      close();
    };

    document.addEventListener('click', outsideClickHandler);
    return () => document.removeEventListener('click', outsideClickHandler);
  }, [isOpen, close, refs.menu, refs.burger, refs.backdrop]);

  useEffect(() => {
    const handlePageLoad = () => {
      if (isOpenRef.current) close();
    };

    document.addEventListener('astro:page-load', handlePageLoad);
    return () => document.removeEventListener('astro:page-load', handlePageLoad);
  }, [close]);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.(DESKTOP_NAV_QUERY);
    if (!mediaQuery) return;

    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches && isOpenRef.current) close();
    };

    mediaQuery.addEventListener('change', handleViewportChange);
    if (mediaQuery.matches && isOpenRef.current) close();

    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, [close]);

  const onBurgerClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      toggle();
    },
    [toggle],
  );

  const onBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (isOpenRef.current) close();
    },
    [close],
  );

  const onMenuLinkClick = useCallback(() => {
    close();
  }, [close]);

  return {
    isOpen,
    open,
    close,
    toggle,
    burgerLabel: isOpen ? MENU_LABEL_CLOSED : MENU_LABEL_OPEN,
    onBurgerClick,
    onBackdropClick,
    onMenuLinkClick,
  };
}
