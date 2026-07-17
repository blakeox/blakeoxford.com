import { SuggestionChip } from '../../overlay/SuggestionChip';
import { OVERLAY_FOOTER, SECTION_LABEL } from '../../overlay/overlayStyles';
import { SUGGESTED_QUERIES } from '../types';

const IDLE_RECENT_LIMIT = 3;

type CommandEmptyProps = {
  query: string;
  onSuggestion: (value: string) => void;
  onAskAi: (query: string) => void;
};

export function CommandEmpty({ query, onSuggestion, onAskAi }: CommandEmptyProps) {
  const trimmed = query.trim();
  // Always lead with a known-good corpus term (Microsoft Fabric), then one more.
  const suggestions = SUGGESTED_QUERIES.slice(0, 2);

  return (
    <div className="px-1 py-3">
      <p className="text-sm font-medium text-foreground">No results for &ldquo;{trimmed}&rdquo;</p>
      <p className="mt-1 text-sm text-muted-foreground">Try a shorter keyword, or pick an example.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <SuggestionChip key={item} label={item} onClick={() => onSuggestion(item)} />
        ))}
      </div>
      <button
        type="button"
        className="focus-ring-interactive mt-4 text-xs text-muted-foreground underline-offset-2 transition hover:text-accent hover:underline"
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
        {visible.map((item) => (
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

export function CommandDestinationList({
  destinations,
  onSelect,
}: {
  destinations: Array<{ title: string; href: string }>;
  onSelect: (destination: { title: string; href: string }) => void;
}) {
  const visible = destinations.slice(0, 4);
  if (!visible.length) return null;

  return (
    <section className="mb-3" aria-label="Continue browsing">
      <div className="mb-1.5 px-1">
        <h3 className={SECTION_LABEL}>Continue</h3>
      </div>
      <div className="flex flex-col">
        {visible.map((item) => (
          <button
            key={item.href}
            type="button"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-subtle focus-ring-interactive"
            onClick={() => onSelect(item)}
          >
            <span className="truncate">{item.title}</span>
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
  className = 'mb-2',
}: {
  onSelect: (value: string) => void;
  className?: string;
}) {
  return (
    <section className={className} aria-label="Suggested searches">
      <h3 className={`${SECTION_LABEL} mb-1.5 px-1`}>Try</h3>
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
  showCopyHint = false,
}: {
  isAskMode?: boolean;
  searchSource?: string;
  hasQuery?: boolean;
  showCopyHint?: boolean;
}) {
  return (
    <div className={OVERLAY_FOOTER} data-search-backend={searchSource || undefined}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="hidden text-subtle-foreground/90 sm:inline">
          <kbd className="rounded border border-border/70 px-1 py-0.5 font-sans">↑↓</kbd> ·{' '}
          <kbd className="rounded border border-border/70 px-1 py-0.5 font-sans">↵</kbd> open ·{' '}
          <kbd className="rounded border border-border/70 px-1 py-0.5 font-sans">⌘↵</kbd> new tab
          {showCopyHint ? (
            <>
              {' '}
              · <kbd className="rounded border border-border/70 px-1 py-0.5 font-sans">⌘C</kbd> copy
            </>
          ) : null}{' '}
          · <kbd className="rounded border border-border/70 px-1 py-0.5 font-sans">esc</kbd>
        </span>
        <span className="text-subtle-foreground/80 sm:hidden">Tap to open</span>
      </div>
    </div>
  );
}
