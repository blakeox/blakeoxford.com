import { createPortal } from 'react-dom';
import { OverlayShell } from '@/features/overlay';
import { getSpinnerClasses } from '@/lib/design-system/recipes';
import { CommandResultRow } from './components/CommandResultRow';
import { useCommandCenter } from './hooks/useCommandCenter';

type CommandCenterProps = { mountRoot?: HTMLElement };

export default function CommandCenter({ mountRoot }: CommandCenterProps = {}) {
  const {
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
    setActiveIndex,
    inputRef,
    panelRef,
    listRef,
    handleInputKeyDown,
    navigateTo,
    clearQuery,
  } = useCommandCenter();
  if (typeof document === 'undefined') return null;

  const overlay = (
    <OverlayShell
      id={mountRoot ? undefined : 'search-overlay'}
      isOpen={isOpen}
      onClose={close}
      labelledBy="command-center-title"
      panelRef={panelRef}
      variant="find"
      rootProps={{
        'data-command-center': true,
        'data-search-has-query': !!findQuery,
        'data-search-loading': isLoading ? 'true' : 'false',
        'data-search-backend': searchSource,
        className: 'command-center',
      }}
      onPanelClick={(event) => event.stopPropagation()}
    >
      <h2 id="command-center-title" className="sr-only">
        Search
      </h2>
      <div className="search-field-row">
        <div className="search-field">
          <svg
            className="size-4 shrink-0 text-muted-foreground"
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
          <label className="sr-only" htmlFor="search-input">
            Search site content
          </label>
          <input
            ref={inputRef}
            id="search-input"
            type="search"
            maxLength={500}
            role="combobox"
            inputMode="search"
            enterKeyHint="go"
            aria-expanded={hasResults}
            aria-controls={hasResults ? 'search-results' : undefined}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `command-result-${activeIndex}` : undefined}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search the site…"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {isLoading ? <span className={getSpinnerClasses('sm')} aria-hidden="true" /> : null}
          {query ? (
            <button
              type="button"
              className="focus-ring-interactive flex min-h-11 shrink-0 items-center rounded px-2 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
              onClick={clearQuery}
            >
              Clear
            </button>
          ) : null}
        </div>
        <button
          id="close-search"
          type="button"
          className="focus-ring-interactive flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-surface-subtle hover:text-foreground"
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
              strokeWidth={1.6}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <p className="sr-only" role="status" aria-atomic="true">
        {!findQuery
          ? 'Start typing to search the site'
          : isLoading
            ? 'Searching…'
            : hasResults
              ? `${flatItems.length} result${flatItems.length === 1 ? '' : 's'} for ${findQuery}`
              : `No results for ${findQuery}`}
      </p>
      {findQuery ? (
        <div
          className="search-content focus-ring-interactive [overflow-anchor:none]"
          ref={listRef}
          tabIndex={0}
          role="region"
          aria-label="Search content"
        >
          {error ? (
            <p className="search-notice" role="status">
              {error}
            </p>
          ) : null}
          {isLoading && !hasResults ? (
            <p className="search-message" aria-hidden="true">
              Searching…
            </p>
          ) : null}
          {!isLoading && !hasResults ? (
            <div className="search-message">
              <p className="font-medium text-foreground">No matches found.</p>
              <p className="mt-1 text-muted-foreground">Try a name or a broader keyword.</p>
            </div>
          ) : null}
          {hasResults ? (
            <div id="search-results" role="listbox" aria-label="Search results" data-results>
              {flatItems.map((item, index) => (
                <CommandResultRow
                  key={item.id}
                  item={item}
                  index={index}
                  query={findQuery}
                  isActive={index === activeIndex}
                  onSelect={(selected) => navigateTo(selected)}
                  onHover={setActiveIndex}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </OverlayShell>
  );
  return mountRoot ? overlay : createPortal(overlay, document.body);
}
