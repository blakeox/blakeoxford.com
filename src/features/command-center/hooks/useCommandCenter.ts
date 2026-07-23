import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { handoffToAiChat } from '@/lib/chat/ai-chat-bridge';
import { useOverlayScrollLock } from '@/lib/hooks/useOverlayScrollLock';
import { useTouchGestures } from '@/lib/hooks/useTouchGestures';
import { createFocusTrap } from '@/utils/focusTrap';
import { commandCenterEvents, type CommandCenterHandoffSource } from '@/features/command-center/lib/analytics';
import { flattenGroups } from '@/features/command-center/lib/groupResults';
import type { CommandCategory, CommandItem } from '@/features/command-center/types';
import { useCommandHistory } from './useCommandHistory';
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
  const { isOpen, close: closeCommandCenter, seedQuery, clearSeedQuery } = useCommandCenterOpenState();
  const { releaseNow: releaseScrollLockNow } = useOverlayScrollLock(isOpen);
  const { recentQueries, recentDestinations, pushQuery, pushDestination, clearHistory } =
    useCommandHistory();
  const { query, setQuery, category, setCategory, groups, isLoading, error, searchSource } =
    useCommandQuery(isOpen);

  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedHref, setCopiedHref] = useState<string | null>(null);
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

  useEffect(() => {
    if (!findQuery && category !== 'all') {
      setCategory('all');
    }
  }, [findQuery, category, setCategory]);

  const flatBrowseGroups = useMemo(() => {
    if (findQuery) return groups;
    if (recentQueries.length > 0 || recentDestinations.length > 0) {
      return groups.filter((group) => group.id !== 'recent');
    }
    return groups;
  }, [findQuery, groups, recentQueries.length, recentDestinations.length]);

  const flatItems = useMemo(() => flattenGroups(flatBrowseGroups), [flatBrowseGroups]);
  const hasResults = flatItems.length > 0;

  const close = useCallback(() => {
    releaseScrollLockNow();
    focusTrapRef.current?.deactivate();
    closeCommandCenter();
  }, [closeCommandCenter, releaseScrollLockNow]);

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures({
    enabled: isOpen,
    swipeThreshold: 100,
    onSwipeDown: close,
  });

  const askAi = useCallback(
    (prompt: string, analyticsSource: CommandCenterHandoffSource = 'empty_state') => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      pushQuery(trimmed);
      commandCenterEvents.askHandoff({
        source: analyticsSource,
        query_length: trimmed.length,
        auto_send: true,
      });
      handoffToAiChat({
        query: trimmed,
        autoSend: true,
      });
      close();
    },
    [close, pushQuery]
  );

  useEffect(() => {
    if (!isOpen) {
      focusTrapRef.current?.deactivate();
      setActiveIndex(0);
      return;
    }

    const toggleButton = document.getElementById('search-toggle');
    focusTrapRef.current = createFocusTrap(panelRef.current, {
      initialFocus: inputRef.current,
      returnFocus: toggleButton,
      fallbackFocus: panelRef.current,
    });
    focusTrapRef.current.activate();

    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);

    return () => {
      window.clearTimeout(timer);
      focusTrapRef.current?.deactivate();
    };
  }, [isOpen]);

  useEffect(() => {
    focusTrapRef.current?.update();
  }, [flatItems.length, isLoading]);

  useEffect(() => {
    if (!hasResults) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex((prev) => {
      if (prev < 0 || prev >= flatItems.length) return 0;
      return prev;
    });
  }, [flatItems.length, hasResults, findQuery, category]);

  const navigateTo = useCallback(
    (item: CommandItem, newTab = false) => {
      commandCenterEvents.resultClick({ kind: item.kind, href: item.href });
      pushQuery(findQuery || query);
      pushDestination({ title: item.title, href: item.href });
      close();
      if (newTab) {
        window.open(item.href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = item.href;
      }
    },
    [close, findQuery, pushDestination, pushQuery, query]
  );

  const handleCategoryChange = useCallback(
    (next: CommandCategory) => {
      setCategory(next);
      commandCenterEvents.filterChange(next);
    },
    [setCategory]
  );

  const copyActiveLink = useCallback(
    async (item?: CommandItem) => {
      const target = item ?? (activeIndex >= 0 ? flatItems[activeIndex] : undefined);
      if (!target) return;
      try {
        const absolute = new URL(target.href, window.location.origin).toString();
        await navigator.clipboard.writeText(absolute);
        setCopiedHref(target.href);
        commandCenterEvents.copyLink(target.kind);
        window.setTimeout(() => {
          setCopiedHref((prev) => (prev === target.href ? null : prev));
        }, 1600);
      } catch {
        // Clipboard can fail in restricted contexts — keep silent
      }
    },
    [activeIndex, flatItems]
  );

  const askAboutItemWithContext = useCallback(
    (item: CommandItem) => {
      pushQuery(findQuery || query);
      commandCenterEvents.askHandoff({
        source: 'result_row',
        query_length: (findQuery || item.title).length,
        item_kind: item.kind,
        auto_send: true,
      });
      handoffToAiChat({
        query: findQuery || item.title,
        autoSend: true,
        sourceHref: item.href,
        sourceTitle: item.title,
        sourceKind: item.kind,
      });
      close();
    },
    [close, findQuery, pushQuery, query]
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      setQuery(tag);
      setCategory('all');
      commandCenterEvents.tagDrillIn(tag.length);
      inputRef.current?.focus();
    },
    [setCategory, setQuery]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onCopyShortcut = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta || event.key.toLowerCase() !== 'c') return;
      const selection = window.getSelection()?.toString();
      if (selection && selection.length > 0 && document.activeElement === inputRef.current) {
        return;
      }
      if (activeIndex < 0 || !flatItems[activeIndex]) return;
      event.preventDefault();
      void copyActiveLink(flatItems[activeIndex]);
    };
    document.addEventListener('keydown', onCopyShortcut);
    return () => document.removeEventListener('keydown', onCopyShortcut);
  }, [activeIndex, copyActiveLink, flatItems, isOpen]);

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
    if (event.key === 'Escape') {
      event.preventDefault();
      if (query.trim()) {
        setQuery('');
        setCategory('all');
      } else {
        close();
      }
      return;
    }

    if (event.key === 'Tab' && findQuery.length >= 2 && flatItems.length > 0) {
      const firstTitle = flatItems.find((item) =>
        item.title.toLowerCase().includes(findQuery.toLowerCase())
      );
      if (firstTitle && firstTitle.title.toLowerCase() !== findQuery.toLowerCase()) {
        event.preventDefault();
        setQuery(firstTitle.title);
        return;
      }
    }

    if (!flatItems.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev < 0 ? 0 : (prev + 1) % flatItems.length));
    } else if (event.key === 'ArrowUp') {
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
    if (activeIndex < 0 || !listRef.current) return;
    const node = listRef.current.querySelector<HTMLElement>(`#command-result-${activeIndex}`);
    node?.scrollIntoView({ block: 'nearest' });
    inputRef.current?.setAttribute('aria-activedescendant', `command-result-${activeIndex}`);
  }, [activeIndex]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setCategory('all');
    inputRef.current?.focus();
  }, [setCategory, setQuery]);

  const selectRecentQuery = useCallback(
    (value: string) => {
      commandCenterEvents.recentClick(value.trim().length);
      setQuery(value);
    },
    [setQuery]
  );

  const selectDestination = useCallback(
    (destination: { title: string; href: string }) => {
      commandCenterEvents.suggestionClick('destination');
      pushDestination(destination);
      close();
      window.location.href = destination.href;
    },
    [close, pushDestination]
  );

  const selectEmptySuggestion = useCallback(
    (value: string) => {
      commandCenterEvents.suggestionClick('empty_chip');
      setQuery(value);
    },
    [setQuery]
  );

  const selectTitleSuggestion = useCallback(
    (title: string) => {
      commandCenterEvents.suggestionClick('title_autocomplete');
      setQuery(title);
      inputRef.current?.focus();
    },
    [setQuery]
  );

  return {
    isOpen,
    close,
    query,
    setQuery,
    category,
    findQuery,
    isLoading,
    error,
    searchSource,
    recentQueries,
    recentDestinations,
    clearHistory,
    flatBrowseGroups,
    flatItems,
    hasResults,
    activeIndex,
    setActiveIndex,
    copiedHref,
    inputRef,
    panelRef,
    listRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleInputKeyDown,
    handleCategoryChange,
    navigateTo,
    copyActiveLink,
    askAboutItemWithContext,
    handleTagClick,
    askAi,
    clearQuery,
    selectRecentQuery,
    selectDestination,
    selectEmptySuggestion,
    selectTitleSuggestion,
  };
}
