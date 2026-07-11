import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { handoffToAiChat } from '../../lib/chat/ai-chat-bridge';
import { useOverlayScrollLock } from '../../hooks/useOverlayScrollLock';
import { createFocusTrap } from '../../utils/focusTrap';
import { OverlayShell } from '../overlay';
import { OVERLAY_CLOSE_BUTTON, OVERLAY_FIELD, OVERLAY_HEADER } from '../overlay/overlayStyles';
import {
  CommandEmpty,
  CommandFooter,
  CommandRecentList,
  CommandSuggestions,
} from './components/CommandEmpty';
import { CommandGroupSection, CommandSkeletonList } from './components/CommandGroup';
import { CommandResultRow } from './components/CommandResultRow';
import { useCommandCenter } from './hooks/useCommandCenter';
import { useCommandHistory } from './hooks/useCommandHistory';
import { useCommandQuery } from './hooks/useCommandQuery';
import { commandCenterEvents, type CommandCenterHandoffSource } from './lib/analytics';
import { flattenGroups } from './lib/groupResults';
import type { CommandItem } from './types';

/**
 * Site search — navigate pages, projects, and posts.
 * Ask lives in the corner companion; search stays search-like.
 */
export default function CommandCenter() {
  const { isOpen, close: closeCommandCenter } = useCommandCenter();
  const { releaseNow: releaseScrollLockNow } = useOverlayScrollLock(isOpen);
  const { recentQueries, pushQuery, clearHistory } = useCommandHistory();
  const { query, setQuery, groups, isLoading, error, searchSource } = useCommandQuery(isOpen);

  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<ReturnType<typeof createFocusTrap> | null>(null);

  const findQuery = query.trim();
  const flatItems = useMemo(() => flattenGroups(groups), [groups]);
  const hasResults = flatItems.length > 0;

  const close = useCallback(() => {
    releaseScrollLockNow();
    focusTrapRef.current?.deactivate();
    closeCommandCenter();
  }, [closeCommandCenter, releaseScrollLockNow]);

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
    [close, pushQuery],
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
  }, [flatItems.length, hasResults, findQuery]);

  const navigateTo = useCallback(
    (item: CommandItem, newTab = false) => {
      commandCenterEvents.resultClick({ kind: item.kind, href: item.href });
      pushQuery(findQuery || query);
      close();
      if (newTab) {
        window.open(item.href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = item.href;
      }
    },
    [close, findQuery, pushQuery, query],
  );

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (query.trim()) {
        setQuery('');
      } else {
        close();
      }
      return;
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

  if (typeof document === 'undefined') return null;

  let resultIndex = -1;

  const overlay = (
    <OverlayShell
      id="search-overlay"
      isOpen={isOpen}
      onClose={close}
      labelledBy="command-center-title"
      panelRef={panelRef}
      variant="find"
      rootProps={{
        'data-command-center': true,
        'data-state': isOpen ? 'open' : 'closed',
        'data-search-loading': isLoading ? 'true' : 'false',
        className: `command-center group fixed inset-0 z-search flex ${
          isOpen ? 'active opacity-100' : 'pointer-events-none opacity-0'
        } transition duration-normal ease-standard motion-reduce:transition-none`,
      }}
      onPanelClick={(event) => event.stopPropagation()}
    >
      <div className={OVERLAY_HEADER}>
        <div className={OVERLAY_FIELD}>
          <svg
            className="size-4 shrink-0 text-subtle-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.8-4.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
            />
          </svg>
          <input
            ref={inputRef}
            id="search-input"
            type="search"
            role="combobox"
            inputMode="search"
            enterKeyHint="search"
            aria-expanded={hasResults}
            aria-controls="search-results"
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `command-result-${activeIndex}` : undefined}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search pages, projects, and posts…"
            aria-label="Search site content"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-subtle-foreground/70 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              className="rounded-md p-1 text-subtle-foreground hover:text-foreground"
              aria-label="Clear search"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
          {isLoading ? (
            <span
              className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-accent/30 border-t-accent"
              aria-hidden="true"
            />
          ) : null}
        </div>
        <button
          id="close-search"
          type="button"
          className={OVERLAY_CLOSE_BUTTON}
          aria-label="Close search"
          onClick={close}
        >
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4" ref={listRef}>
        <h2 id="command-center-title" className="sr-only">
          Search
        </h2>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {isLoading
            ? 'Searching…'
            : hasResults
              ? `${flatItems.length} results${findQuery ? ` for ${findQuery}` : ''}`
              : findQuery
                ? `No results for ${findQuery}`
                : 'Start typing to search the site'}
        </p>

        {error ? (
          <div className="mb-3 rounded-lg border border-border/60 bg-surface/80 px-3 py-2.5 text-sm text-muted-foreground">
            {error}
          </div>
        ) : null}

        {!findQuery ? (
          <>
            {recentQueries.length > 0 ? (
              <CommandRecentList
                recentQueries={recentQueries}
                onSelect={setQuery}
                onClear={clearHistory}
              />
            ) : null}
            <CommandSuggestions onSelect={setQuery} />
          </>
        ) : null}

        {isLoading && !hasResults ? <CommandSkeletonList /> : null}

        {!isLoading && findQuery && !hasResults ? (
          <CommandEmpty
            query={findQuery}
            onSuggestion={setQuery}
            onAskAi={(value) => askAi(value, 'empty_state')}
          />
        ) : null}

        {hasResults ? (
          <div
            id="search-results"
            role="listbox"
            aria-label="Search results"
            data-results
            className="flex flex-col gap-3"
          >
            {findQuery ? (
              <p className="sr-only">Use arrow keys to navigate results. Press Enter to open.</p>
            ) : null}
            <div data-results-container className="flex flex-col gap-3">
              {groups.map((group) => (
                <CommandGroupSection key={group.id} label={group.label}>
                  {group.items.map((item) => {
                    resultIndex += 1;
                    const index = resultIndex;
                    return (
                      <CommandResultRow
                        key={item.id}
                        item={item}
                        index={index}
                        query={findQuery}
                        isActive={index === activeIndex}
                        onSelect={(selected) => navigateTo(selected)}
                        onHover={setActiveIndex}
                      />
                    );
                  })}
                </CommandGroupSection>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <CommandFooter searchSource={searchSource} hasQuery={Boolean(findQuery)} />
    </OverlayShell>
  );

  return createPortal(overlay, document.body);
}
