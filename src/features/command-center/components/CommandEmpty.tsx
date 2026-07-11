import { SuggestionChip } from '../../overlay/SuggestionChip';
import { OVERLAY_FOOTER, SECTION_LABEL } from '../../overlay/overlayStyles';
import { SUGGESTED_QUERIES } from '../types';

type CommandEmptyProps = {
  query: string;
  onSuggestion: (value: string) => void;
  onAskAi: (query: string) => void;
};

export function CommandEmpty({ query, onSuggestion, onAskAi }: CommandEmptyProps) {
  const trimmed = query.trim();

  return (
    <div className="px-1 py-2">
      <p className="text-sm font-medium text-foreground">No results for &ldquo;{trimmed}&rdquo;</p>
      <p className="mt-1 text-sm text-muted-foreground">Try another keyword, or ask the assistant.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <SuggestionChip
          accent
          label={`Ask about “${trimmed}”`}
          onClick={() => onAskAi(trimmed)}
        />
        {SUGGESTED_QUERIES.slice(0, 3).map((item) => (
          <SuggestionChip key={item} label={item} onClick={() => onSuggestion(item)} />
        ))}
      </div>
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
  if (!recentQueries.length) return null;

  return (
    <section className="mb-3" aria-label="Recent searches">
      <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
        <h3 className={SECTION_LABEL}>Recent</h3>
        <button
          type="button"
          className="rounded text-xxs text-subtle-foreground transition hover:text-foreground focus-ring-interactive"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      <div className="flex flex-col">
        {recentQueries.map((item) => (
          <button
            key={item}
            type="button"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-subtle focus-ring-interactive"
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

export function CommandSuggestions({
  onSelect,
  className = 'mb-3',
}: {
  onSelect: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 px-1 ${className}`}>
      {SUGGESTED_QUERIES.map((item) => (
        <SuggestionChip key={item} label={item} onClick={() => onSelect(item)} />
      ))}
    </div>
  );
}

export function CommandFooter({
  isAskMode = false,
  searchSource,
  hasQuery = false,
}: {
  isAskMode?: boolean;
  searchSource?: string;
  hasQuery?: boolean;
}) {
  const backendLabel = (() => {
    if (isAskMode || !hasQuery) return null;
    if (searchSource === 'cloudflare-vectorize') return 'Semantic · Cloudflare Vectorize';
    if (searchSource === 'local-fallback') return 'Keyword · local index';
    return null;
  })();

  return (
    <div className={OVERLAY_FOOTER}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="hidden sm:inline">
          {isAskMode ? (
            <>
              <kbd className="rounded border border-border px-1 py-0.5 font-sans">↵</kbd> ask ·{' '}
              <kbd className="rounded border border-border px-1 py-0.5 font-sans">esc</kbd> close
            </>
          ) : (
            <>
              <kbd className="rounded border border-border px-1 py-0.5 font-sans">↑↓</kbd> navigate ·{' '}
              <kbd className="rounded border border-border px-1 py-0.5 font-sans">↵</kbd> open ·{' '}
              <kbd className="rounded border border-border px-1 py-0.5 font-sans">esc</kbd> close
            </>
          )}
        </span>
        <span className="sm:hidden text-subtle-foreground/80">
          {isAskMode ? 'Ask · Close' : 'Tap a result · Close'}
        </span>
        <span className="text-subtle-foreground/80">
          {backendLabel ? (
            <span data-search-backend={searchSource}>{backendLabel}</span>
          ) : isAskMode ? (
            'Find mode clears the ? prefix'
          ) : (
            <>
              <kbd className="rounded border border-border px-1 py-0.5 font-sans">?</kbd> or Ask to
              chat
            </>
          )}
        </span>
      </div>
    </div>
  );
}
