import type { ReactNode } from 'react';
import { SuggestionChip } from '@/features/overlay/SuggestionChip';
import {
  OVERLAY_FOOTER,
  getOverlaySoftRowClasses,
  SECTION_LABEL,
} from '@/features/overlay/overlayStyles';
import { getKbdClasses } from '@/lib/design-system/recipes';
import { SUGGESTED_QUERIES } from '@/features/command-center/types';

const IDLE_RECENT_LIMIT = 3;

type CommandEmptyProps = {
  query: string;
  onSuggestion: (value: string) => void;
  onAskAi: (query: string) => void;
  onSearchAll?: () => void;
};

export function CommandEmpty({ query, onSuggestion, onAskAi, onSearchAll }: CommandEmptyProps) {
  const trimmed = query.trim();
  const suggestions = SUGGESTED_QUERIES.slice(0, 2);

  return (
    <div className="search-empty px-2 py-8 [overflow-wrap:anywhere]">
      <p className="text-base font-semibold text-foreground">
        No results for &ldquo;{trimmed}&rdquo;
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Try a shorter keyword, or pick an example.
      </p>
      {onSearchAll ? (
        <button
          type="button"
          className="focus-ring-interactive mt-3 inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm text-foreground transition hover:bg-surface-subtle"
          onClick={onSearchAll}
        >
          Search all content
        </button>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <SuggestionChip key={item} label={item} onClick={() => onSuggestion(item)} />
        ))}
      </div>
      <button
        type="button"
        className="focus-ring-interactive mt-4 inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-2 transition hover:text-accent hover:underline"
        onClick={() => onAskAi(trimmed)}
      >
        Ask about “{trimmed}” instead
      </button>
    </div>
  );
}

export function CommandRecentList({
  recentQueries,
  onSelect,
  onClear,
}: {
  recentQueries: string[];
  onSelect: (value: string) => void;
  onClear: () => void;
}) {
  const visible = recentQueries.slice(0, IDLE_RECENT_LIMIT);
  if (!visible.length) return null;

  return (
    <section className="mb-3" aria-label="Recent searches">
      <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
        <h3 className={SECTION_LABEL}>Recent searches</h3>
        <button
          type="button"
          className="focus-ring-interactive min-h-11 rounded px-2 text-xs text-subtle-foreground transition hover:text-foreground"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      <div className="flex flex-col">
        {visible.map((item) => (
          <button
            key={item}
            type="button"
            className={getOverlaySoftRowClasses()}
            onClick={() => onSelect(item)}
          >
            <span className="truncate">{item}</span>
            <span className="shrink-0 text-xxs text-subtle-foreground" aria-hidden="true">
              ↵
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function CommandDestinationList({
  destinations,
  onSelect,
}: {
  destinations: Array<{ title: string; href: string; description?: string }>;
  onSelect: (destination: { title: string; href: string }) => void;
}) {
  return (
    <section className="mx-2" aria-label="Browse pages">
      <h3 className={`${SECTION_LABEL} mb-3`}>Explore</h3>
      <div className="grid gap-x-4 sm:grid-cols-2">
        {destinations.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="focus-ring-interactive flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-surface-subtle"
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onSelect(item);
            }}
          >
            <span>{item.title}</span>
            <span className="text-subtle-foreground" aria-hidden="true">
              →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function CommandSuggestions({
  onSelect,
  className = 'mb-2',
}: {
  onSelect: (value: string) => void;
  className?: string;
}) {
  return (
    <section className={className} aria-label="Suggested searches">
      <h3 className={`${SECTION_LABEL} mb-1.5 px-1`}>Try a topic</h3>
      <div className="flex flex-wrap gap-2 px-1">
        {SUGGESTED_QUERIES.map((item) => (
          <SuggestionChip key={item} label={item} onClick={() => onSelect(item)} />
        ))}
      </div>
    </section>
  );
}

export function CommandFooter({
  searchSource,
  hasResults = false,
  actions,
}: {
  searchSource?: string;
  hasResults?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div
      className={`${OVERLAY_FOOTER} search-footer flex shrink-0 flex-wrap items-center justify-between gap-3`}
      data-search-backend={searchSource || undefined}
    >
      <span className="hidden items-center gap-3 sm:flex">
        {hasResults ? (
          <>
            <span>
              <kbd className={getKbdClasses()}>↑↓</kbd> navigate
            </span>
            <span>
              <kbd className={getKbdClasses()}>↵</kbd> open
            </span>
          </>
        ) : (
          <span>
            <kbd className={getKbdClasses()}>Tab</kbd> browse
          </span>
        )}
        <span>
          <kbd className={getKbdClasses()}>esc</kbd> close
        </span>
      </span>
      {!actions ? <span className="sm:hidden">Tap a page to open</span> : null}
      {actions}
    </div>
  );
}
