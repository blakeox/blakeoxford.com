import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { createFocusTrap } from '@/utils/focusTrap';
import { commandCenterEvents } from '@/features/command-center/lib/analytics';
import { flattenGroups } from '@/features/command-center/lib/groupResults';
import type { CommandItem } from '@/features/command-center/types';
import { useCommandQuery } from './useCommandQuery';
import { useCommandCenterOpenState } from './useCommandCenterOpenState';

/**
 * Open/close lifecycle + window API (compat export for callers that only need shell state).
 */
export function useCommandCenterShell() {
  return useCommandCenterOpenState();
}

/**
 * Full Command Center controller — open state, search query, keyboard/focus, and actions.
 * Keeps CommandCenter.tsx mostly presentational.
 */
export function useCommandCenter() {
  const {
    isOpen,
    close: closeCommandCenter,
    seedQuery,
    clearSeedQuery,
  } = useCommandCenterOpenState();
  const { query, setQuery, groups, isLoading, error, searchSource } = useCommandQuery(isOpen);

  const [activeIndex, setActiveIndex] = useState(0);
  const selectionTouchedRef = useRef(false);
  const previousResultsRef = useRef<{ scope: string; items: CommandItem[] }>({
    scope: '',
    items: [],
  });
  const selectActiveIndex = useCallback((index: number) => {
    selectionTouchedRef.current = true;
    setActiveIndex(index);
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<ReturnType<typeof createFocusTrap> | null>(null);
  const emptyTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!seedQuery) return;
    setQuery(seedQuery);
    clearSeedQuery();
  }, [seedQuery, setQuery, clearSeedQuery]);

  const findQuery = query.trim();

  const flatItems = useMemo(() => (findQuery ? flattenGroups(groups) : []), [groups, findQuery]);
  const hasResults = flatItems.length > 0;

  const close = useCallback(() => {
    focusTrapRef.current?.deactivate();
    closeCommandCenter();
  }, [closeCommandCenter]);

  useEffect(() => {
    if (!isOpen) {
      focusTrapRef.current?.deactivate();
      setActiveIndex(0);
      return;
    }

    const toggleButton = document.getElementById('search-toggle');
    focusTrapRef.current = createFocusTrap(panelRef.current, {
      modalRoot: panelRef.current?.closest<HTMLElement>('.overlay-root'),
      initialFocus: inputRef.current,
      returnFocus: toggleButton,
      fallbackFocus: panelRef.current,
    });
    focusTrapRef.current.activate();

    const panel = panelRef.current;
    const recoverFocus = () => {
      if (document.hasFocus() && !panel?.contains(document.activeElement)) {
        inputRef.current?.focus({ preventScroll: true });
      }
    };
    // Finalize focus after the lazy surface and background isolation have painted.
    let focusFrame = requestAnimationFrame(() => {
      focusFrame = requestAnimationFrame(recoverFocus);
    });
    const onFocusOut = () => {
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(recoverFocus);
    };
    panel?.addEventListener('focusout', onFocusOut);

    return () => {
      cancelAnimationFrame(focusFrame);
      panel?.removeEventListener('focusout', onFocusOut);
      focusTrapRef.current?.deactivate();
      // Retain a visible return target if a consuming layout hides the search trigger.
      const menuToggle = document.getElementById('nav-toggle');
      if (!toggleButton?.getClientRects().length && menuToggle?.getClientRects().length) {
        menuToggle.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    focusTrapRef.current?.update();
  }, [flatItems.length, isLoading]);

  useLayoutEffect(() => {
    const scope = findQuery;
    const previous = previousResultsRef.current;
    if (previous.scope !== scope) selectionTouchedRef.current = false;
    setActiveIndex((index) => {
      if (!flatItems.length) return -1;
      const selected = selectionTouchedRef.current ? previous.items[index]?.id : undefined;
      const nextIndex = selected ? flatItems.findIndex((item) => item.id === selected) : -1;
      return nextIndex >= 0 ? nextIndex : 0;
    });
    previousResultsRef.current = { scope, items: flatItems };
  }, [flatItems, findQuery]);

  const navigateTo = useCallback(
    (item: CommandItem, newTab = false) => {
      commandCenterEvents.resultClick({ kind: item.kind, href: item.href });
      close();
      if (newTab) {
        window.open(item.href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = item.href;
      }
    },
    [close]
  );

  useEffect(() => {
    if (!isOpen || isLoading || !findQuery || hasResults) {
      if (!findQuery) emptyTrackedRef.current = null;
      return;
    }
    if (emptyTrackedRef.current === findQuery) return;
    emptyTrackedRef.current = findQuery;
    commandCenterEvents.emptyImpression(findQuery.length);
  }, [findQuery, hasResults, isLoading, isOpen]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (!flatItems.length) return;

    if (event.key === 'ArrowDown') {
      selectionTouchedRef.current = true;
      event.preventDefault();
      setActiveIndex((prev) => (prev < 0 ? 0 : (prev + 1) % flatItems.length));
    } else if (event.key === 'ArrowUp') {
      selectionTouchedRef.current = true;
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? flatItems.length - 1 : prev - 1));
    } else if (event.key === 'Enter') {
      const index = activeIndex >= 0 ? activeIndex : 0;
      if (flatItems[index]) {
        event.preventDefault();
        navigateTo(flatItems[index], event.metaKey || event.ctrlKey);
      }
    }
  };

  useEffect(() => {
    const list = listRef.current;
    if (activeIndex < 0 || !list) return;
    const node = list.querySelector<HTMLElement>(`#command-result-${activeIndex}`);
    if (!node) return;
    const top = node.getBoundingClientRect().top - list.getBoundingClientRect().top;
    const bottom = top + node.offsetHeight;
    // Scroll only the result region; a tall row must keep its title in view.
    if (top < 0 || node.offsetHeight > list.clientHeight) list.scrollTop += top;
    else if (bottom > list.clientHeight) list.scrollTop += bottom - list.clientHeight;
  }, [activeIndex, flatItems]);

  const clearQuery = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, [setQuery]);

  return {
    isOpen,
    close,
    query,
    setQuery,
    findQuery,
    isLoading,
    error,
    searchSource,
    flatItems,
    hasResults,
    activeIndex,
    setActiveIndex: selectActiveIndex,
    inputRef,
    panelRef,
    listRef,
    handleInputKeyDown,
    navigateTo,
    clearQuery,
  };
}
