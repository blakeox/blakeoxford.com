import { createPortal } from 'react-dom';

import { OverlayShell } from '@/features/overlay';
import {
  OVERLAY_CLOSE_BUTTON,
  OVERLAY_FIELD,
  OVERLAY_HEADER,
} from '@/features/overlay/overlayStyles';
import { CommandCategoryFilters } from './components/CommandCategoryFilters';
import {
  CommandDestinationList,
  CommandEmpty,
  CommandFooter,
  CommandRecentList,
} from './components/CommandEmpty';
import { CommandGroupSection, CommandSkeletonList } from './components/CommandGroup';
import { CommandResultRow } from './components/CommandResultRow';
import { CommandTitleSuggestions } from './components/CommandTitleSuggestions';
import { useCommandCenter } from './hooks/useCommandCenter';

/**
 * Site search — navigate pages, projects, and posts.
 * Ask lives in the corner companion; search stays search-like.
 */
export default function CommandCenter() {
  const {
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
  } = useCommandCenter();

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
        'data-search-loading': isLoading ? 'true' : 'false',
        // Visibility + layout come from OverlayShell (.overlay-root, data-state).
        className: 'command-center group',
      }}
      onPanelClick={(event) => event.stopPropagation()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
              onClick={clearQuery}
            >
              <svg
                className="size-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
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
          <svg
            className="size-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
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

        {findQuery ? (
          <CommandCategoryFilters category={category} onChange={handleCategoryChange} />
        ) : null}

        {!findQuery && recentQueries.length > 0 ? (
          <CommandRecentList
            recentQueries={recentQueries}
            onSelect={selectRecentQuery}
            onClear={clearHistory}
          />
        ) : null}

        {!findQuery && recentDestinations.length > 0 ? (
          <CommandDestinationList destinations={recentDestinations} onSelect={selectDestination} />
        ) : null}

        {isLoading && !hasResults ? <CommandSkeletonList /> : null}

        {!isLoading && findQuery && !hasResults ? (
          <CommandEmpty
            query={findQuery}
            onSuggestion={selectEmptySuggestion}
            onAskAi={(value) => askAi(value, 'empty_state')}
          />
        ) : null}

        {findQuery && hasResults ? (
          <CommandTitleSuggestions
            query={findQuery}
            items={flatItems}
            onSelect={selectTitleSuggestion}
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
              <p className="sr-only">
                Use arrow keys to navigate results. Press Enter to open. Press Command C to copy the
                active link.
              </p>
            ) : null}
            <div data-results-container className="flex flex-col gap-3">
              {flatBrowseGroups.map((group) => (
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
                        onAsk={askAboutItemWithContext}
                        onCopyLink={(selected) => {
                          void copyActiveLink(selected);
                        }}
                        onTagClick={handleTagClick}
                        linkCopied={copiedHref === item.href}
                      />
                    );
                  })}
                </CommandGroupSection>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <CommandFooter searchSource={searchSource} showCopyHint={hasResults} />
    </OverlayShell>
  );

  return createPortal(overlay, document.body);
}
