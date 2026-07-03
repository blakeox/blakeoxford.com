import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { handoffToAiChat } from '../../lib/chat/ai-chat-bridge';
import { acquireScrollLock, releaseScrollLock } from '../../utils/scrollLock';
import { createFocusTrap } from '../../utils/focusTrap';
import { CommandAskHandoff, CommandAskPanel } from './components/CommandAskHandoff';
import { CommandEmpty, CommandFooter } from './components/CommandEmpty';
import { CommandGroupSection, CommandSkeletonList } from './components/CommandGroup';
import { CommandModeTabs } from './components/CommandModeTabs';
import { CommandResultRow } from './components/CommandResultRow';
import { useCommandCenter } from './hooks/useCommandCenter';
import { useCommandHistory } from './hooks/useCommandHistory';
import { useCommandQuery } from './hooks/useCommandQuery';
import { flattenGroups } from './lib/groupResults';
import { parseCommandQuery } from './lib/parseQuery';
import type { CommandCategory, CommandItem, CommandMode } from './types';
import { CATEGORY_LABELS } from './types';

const CATEGORIES: CommandCategory[] = ['all', 'projects', 'blog', 'pages'];

export default function CommandCenter() {
  const { isOpen, close } = useCommandCenter();
  const { recentQueries, pushQuery, clearHistory } = useCommandHistory();
  const { query, setQuery, category, setCategory, groups, isLoading, error } = useCommandQuery(isOpen);

  const [mode, setMode] = useState<CommandMode>('find');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<ReturnType<typeof createFocusTrap> | null>(null);

  const flatItems = useMemo(() => flattenGroups(groups), [groups]);
  const hasResults = mode === 'find' && flatItems.length > 0;
  const findQuery = parseCommandQuery(query).query;

  const askAi = useCallback(
    (prompt: string, options?: { sourceTitle?: string; autoSend?: boolean }) => {
      const trimmed = prompt.trim();
      if (!trimmed) {
        handoffToAiChat({ query: '', autoSend: false });
        close();
        return;
      }
      pushQuery(findQuery || trimmed);
      handoffToAiChat({
        query: trimmed,
        autoSend: options?.autoSend ?? true,
        sourceTitle: options?.sourceTitle,
      });
      close();
    },
    [close, findQuery, pushQuery],
  );

  useEffect(() => {
    if (parseCommandQuery(query).mode === 'ask') {
      setMode('ask');
    }
  }, [query]);

  useEffect(() => {
    if (!isOpen) setMode('find');
  }, [isOpen]);

  const navigateTo = useCallback(
    (item: CommandItem, newTab = false) => {
      pushQuery(query);
      close();
      if (newTab) {
        window.open(item.href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = item.href;
      }
    },
    [close, pushQuery, query],
  );

  useEffect(() => {
    if (!isOpen) {
      releaseScrollLock();
      focusTrapRef.current?.deactivate();
      setActiveIndex(-1);
      return;
    }

    acquireScrollLock();

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
      releaseScrollLock();
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
    if (activeIndex >= flatItems.length) {
      setActiveIndex(flatItems.length - 1);
    }
  }, [activeIndex, flatItems.length, hasResults]);

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

    if (mode === 'ask' && event.key === 'Enter') {
      event.preventDefault();
      askAi(findQuery || query);
      return;
    }

    if (!flatItems.length || mode !== 'find') return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev < 0 ? 0 : (prev + 1) % flatItems.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? flatItems.length - 1 : prev - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0 && flatItems[activeIndex]) {
      event.preventDefault();
      navigateTo(flatItems[activeIndex], event.metaKey || event.ctrlKey);
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
    <div
      id="search-overlay"
      data-command-center
      data-state={isOpen ? 'open' : 'closed'}
      data-search-loading={isLoading ? 'true' : 'false'}
      className={`command-center group fixed inset-0 z-search flex ${
        isOpen ? 'active opacity-100' : 'pointer-events-none opacity-0'
      } transition duration-normal ease-standard motion-reduce:transition-none`}
      role="presentation"
      aria-hidden={!isOpen}
      inert={!isOpen}
      style={
        isOpen
          ? { display: 'block', visibility: 'visible' as const, opacity: 1 }
          : { display: 'none', visibility: 'hidden' as const, opacity: 0 }
      }
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-background-dark/55 backdrop-blur-sm"
        aria-label="Close search"
        tabIndex={-1}
        onClick={close}
      />

      <div className="relative flex min-h-full w-full items-end justify-center sm:items-start sm:px-4 sm:pb-8 sm:pt-16 md:pt-20 lg:pt-24">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-center-title"
          className="overlay-panel flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-surface/95 shadow-lg backdrop-blur-xl motion-safe:transition-transform motion-safe:duration-normal motion-safe:ease-standard sm:rounded-3xl sm:translate-y-0 motion-reduce:transition-none"
          data-panel
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
            <div className="relative flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border/60 bg-field-bg px-3 py-2.5 shadow-sm focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/40">
              <svg className="size-5 shrink-0 text-subtle-foreground/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.8-4.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
              </svg>
              <input
                ref={inputRef}
                id="search-input"
                type="search"
                role="combobox"
                aria-expanded={hasResults}
                aria-controls="search-results"
                aria-autocomplete="list"
                aria-activedescendant={activeIndex >= 0 ? `command-result-${activeIndex}` : undefined}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder={mode === 'ask' ? 'Ask a conversational question…' : 'Search pages, projects, and blog posts…'}
                aria-label="Search site content"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-subtle-foreground/70 focus:outline-none"
              />
              {query ? (
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs text-subtle-foreground hover:text-foreground"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery('');
                    setActiveIndex(-1);
                    inputRef.current?.focus();
                  }}
                >
                  Clear
                </button>
              ) : null}
              {isLoading ? (
                <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-accent/30 border-t-accent" aria-hidden="true" />
              ) : null}
            </div>
            <button
              id="close-search"
              type="button"
              className="touch-target focus-ring-interactive inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-surface text-foreground transition hover:border-border"
              aria-label="Close search"
              onClick={close}
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <CommandModeTabs mode={mode} onChange={setMode} />

          {mode === 'find' ? (
          <div className="border-b border-border/40 px-4 py-2 sm:px-5">
            <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Search categories">
              {CATEGORIES.map((value) => {
                const isActive = category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    data-category={value}
                    aria-pressed={isActive}
                    className={`search-pill shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition touch-target focus-ring-interactive ${
                      isActive
                        ? 'border-accent/40 bg-accent/15 text-accent ring-1 ring-accent/30'
                        : 'border-border/60 text-muted-foreground hover:border-accent hover:text-accent'
                    }`}
                    onClick={() => {
                      setCategory(value);
                      setActiveIndex(-1);
                    }}
                  >
                    {CATEGORY_LABELS[value]}
                  </button>
                );
              })}
            </div>
          </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5" ref={listRef}>
            <h2 id="command-center-title" className="sr-only">
              Search
            </h2>
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {isLoading
                ? 'Searching…'
                : hasResults
                  ? `${flatItems.length} results${query.trim() ? ` for ${query.trim()}` : ''}`
                  : query.trim()
                    ? `No results for ${query.trim()}`
                    : 'Start typing to search the site'}
            </p>

            {error ? (
              <div className="mb-3 rounded-2xl border border-border/60 bg-surface/80 px-4 py-3 text-sm text-muted-foreground">
                {error}
              </div>
            ) : null}

            {mode === 'ask' ? (
              <CommandAskPanel query={findQuery || query} onAsk={(prompt) => askAi(prompt)} />
            ) : null}

            {mode === 'find' && findQuery ? (
              <div className="mb-4">
                <CommandAskHandoff query={findQuery} compact onAsk={() => askAi(findQuery)} />
              </div>
            ) : null}

            {mode === 'find' && isLoading && !hasResults ? <CommandSkeletonList /> : null}

            {mode === 'find' && !isLoading && !hasResults ? (
              <CommandEmpty
                query={findQuery}
                recentQueries={recentQueries}
                onSuggestion={setQuery}
                onClearHistory={clearHistory}
                onAskAi={(value) => askAi(value)}
              />
            ) : null}

            {mode === 'find' && hasResults ? (
              <div id="search-results" role="listbox" aria-label="Search results" data-results className="flex flex-col gap-4">
                <div data-results-container className="flex flex-col gap-4">
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
                            query={query}
                            isActive={index === activeIndex}
                            onSelect={(item) => navigateTo(item)}
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

          <CommandFooter />
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
