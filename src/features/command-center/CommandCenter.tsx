import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { handoffToAiChat, openAiChat } from '../../lib/chat/ai-chat-bridge';
import { useOverlayScrollLock } from '../../hooks/useOverlayScrollLock';
import { createFocusTrap } from '../../utils/focusTrap';
import { ModeSwitch, OverlayShell } from '../overlay';
import { OVERLAY_CLOSE_BUTTON, OVERLAY_FIELD, OVERLAY_HEADER } from '../overlay/overlayStyles';
import { CommandAskHandoff, CommandAskState } from './components/CommandAskHandoff';
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
import { parseCommandQuery } from './lib/parseQuery';
import type { CommandItem, CommandMode } from './types';

type AskAiOptions = {
  analyticsSource?: CommandCenterHandoffSource;
  autoSend?: boolean;
};

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

  const parsedQuery = useMemo(() => parseCommandQuery(query), [query]);
  const isAskMode = parsedQuery.mode === 'ask';
  const findQuery = parsedQuery.query;
  const uiMode: CommandMode = isAskMode ? 'ask' : 'find';
  const lastModeRef = useRef<'find' | 'ask' | null>(null);

  useEffect(() => {
    if (!isOpen) {
      lastModeRef.current = null;
      return;
    }
    const mode = isAskMode ? 'ask' : 'find';
    if (lastModeRef.current === null) {
      lastModeRef.current = mode;
      return;
    }
    if (lastModeRef.current !== mode) {
      lastModeRef.current = mode;
      commandCenterEvents.modeChange(mode);
    }
  }, [isAskMode, isOpen]);

  const close = useCallback(() => {
    releaseScrollLockNow();
    focusTrapRef.current?.deactivate();
    closeCommandCenter();
  }, [closeCommandCenter, releaseScrollLockNow]);

  const flatItems = useMemo(() => flattenGroups(groups), [groups]);
  const hasResults = !isAskMode && flatItems.length > 0;
  const showQuietAskChip = !isAskMode && !isLoading && findQuery.length >= 3 && hasResults;

  const askAi = useCallback(
    (prompt: string, options?: AskAiOptions & {
      sourceTitle?: string;
      sourceHref?: string;
      sourceKind?: CommandItem['kind'];
    }) => {
      const trimmed = prompt.trim();
      if (!trimmed && !options?.sourceTitle) return;

      const trackQuery = trimmed || options?.sourceTitle || '';
      pushQuery(trackQuery);
      commandCenterEvents.askHandoff({
        source: options?.analyticsSource ?? 'ask_banner',
        query_length: trackQuery.length,
        auto_send: options?.autoSend ?? true,
        item_kind: options?.sourceKind,
      });
      handoffToAiChat({
        query: trimmed || options?.sourceTitle || '',
        autoSend: options?.autoSend ?? true,
        sourceTitle: options?.sourceTitle,
        sourceHref: options?.sourceHref,
        sourceKind: options?.sourceKind,
      });
      close();
    },
    [close, pushQuery],
  );

  const askAboutItem = useCallback(
    (item: CommandItem) => {
      askAi(findQuery || item.title, {
        analyticsSource: 'result_row',
        autoSend: true,
        sourceTitle: item.title,
        sourceHref: item.href,
        sourceKind: item.kind,
      });
    },
    [askAi, findQuery],
  );

  const setMode = useCallback(
    (mode: CommandMode) => {
      if (mode === 'ask') {
        const base = parseCommandQuery(query).query.trim();
        commandCenterEvents.modeChange('ask');
        if (base) {
          askAi(base, { analyticsSource: 'ask_banner', autoSend: true });
          return;
        }
        close();
        openAiChat();
        return;
      }
      setQuery(parseCommandQuery(query).query);
      commandCenterEvents.modeChange('find');
    },
    [askAi, close, query, setQuery],
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
  }, [flatItems.length, isLoading, isAskMode]);

  // Auto-select first result when results appear or list changes.
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

    if (isAskMode && event.key === 'Enter') {
      event.preventDefault();
      askAi(findQuery || query, { analyticsSource: 'prefix' });
      return;
    }

    if (!flatItems.length || isAskMode) return;

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
        <ModeSwitch mode={uiMode} onChange={setMode} />
        <div className={OVERLAY_FIELD}>
          {isAskMode ? (
            <svg className="size-4 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 3h5.5M21 11.5c0 4.418-4.03 8-9 8-1.15 0-2.26-.19-3.29-.54L3 21l1.1-3.3A8.35 8.35 0 0 1 3 11.5c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
            </svg>
          ) : (
            <svg className="size-4 shrink-0 text-subtle-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.8-4.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
            </svg>
          )}
          <input
            ref={inputRef}
            id="search-input"
            type="text"
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
            placeholder={isAskMode ? 'Ask about projects, case studies, or posts…' : 'Search pages, projects, and posts…'}
            aria-label={isAskMode ? 'Ask the AI assistant' : 'Search site content'}
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
            <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-accent/30 border-t-accent" aria-hidden="true" />
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
          {isAskMode ? 'Ask' : 'Find'}
        </h2>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {isAskMode
            ? 'Ask mode. Press Enter to send your question.'
            : isLoading
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

        {isAskMode ? (
          <CommandAskState query={findQuery} onAsk={() => askAi(findQuery, { analyticsSource: 'prefix' })} />
        ) : null}

        {!isAskMode && !findQuery ? (
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

        {!isAskMode && isLoading && !hasResults ? <CommandSkeletonList /> : null}

        {!isAskMode && !isLoading && findQuery && !hasResults ? (
          <CommandEmpty
            query={findQuery}
            onSuggestion={setQuery}
            onAskAi={(value) => askAi(value, { analyticsSource: 'empty_state' })}
          />
        ) : null}

        {!isAskMode && hasResults ? (
          <div id="search-results" role="listbox" aria-label="Search results" data-results className="flex flex-col gap-3">
            {showQuietAskChip ? (
              <CommandAskHandoff
                query={findQuery}
                onAsk={() => askAi(findQuery, { analyticsSource: 'ask_banner' })}
              />
            ) : null}
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
                        onAsk={askAboutItem}
                      />
                    );
                  })}
                </CommandGroupSection>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <CommandFooter isAskMode={isAskMode} searchSource={searchSource} hasQuery={Boolean(findQuery)} />
    </OverlayShell>
  );

  return createPortal(overlay, document.body);
}
