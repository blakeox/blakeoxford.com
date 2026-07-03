import { SUGGESTED_QUERIES } from '../types';

type CommandEmptyProps = {
  query: string;
  recentQueries: string[];
  onSuggestion: (value: string) => void;
  onClearHistory: () => void;
  onAskAi: (query: string) => void;
};

function BrowseHint({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-surface/80 px-3 py-2.5">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function CommandEmpty({ query, recentQueries, onSuggestion, onClearHistory, onAskAi }: CommandEmptyProps) {
  const trimmed = query.trim();

  if (!trimmed) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <BrowseHint title="Find" description="Search pages, projects, and blog posts — press ↵ to open." />
          <BrowseHint title="Ask AI" description="Conversational answers with citations — opens the chat assistant." />
        </div>

        {recentQueries.length ? (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-label text-subtle-foreground">Recent searches</span>
              <button
                type="button"
                className="text-xs text-accent hover:underline focus-ring-interactive rounded"
                onClick={onClearHistory}
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentQueries.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-full border border-border/60 bg-surface/80 px-3 py-1.5 text-xs transition hover:border-accent hover:text-accent focus-ring-interactive"
                  onClick={() => onSuggestion(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-label text-subtle-foreground">
              Try searching
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.slice(0, 4).map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-full border border-border/60 bg-surface/80 px-3 py-1.5 text-xs transition hover:border-accent hover:text-accent focus-ring-interactive"
                  onClick={() => onSuggestion(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-surface/60 px-4 py-4 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">No results for &ldquo;{trimmed}&rdquo;</p>
      <p className="mt-1">Try a different keyword or ask the AI assistant for a conversational answer.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/15 focus-ring-interactive"
          onClick={() => onAskAi(trimmed)}
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 3h5.5M21 11.5c0 4.418-4.03 8-9 8-1.15 0-2.26-.19-3.29-.54L3 21l1.1-3.3A8.35 8.35 0 0 1 3 11.5c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
          </svg>
          Ask AI about &ldquo;{trimmed}&rdquo;
        </button>
        {SUGGESTED_QUERIES.map((item) => (
          <button
            key={item}
            type="button"
            className="rounded-full border border-border/60 px-3 py-1.5 text-xs transition hover:border-accent hover:text-accent focus-ring-interactive"
            onClick={() => onSuggestion(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CommandFooter() {
  return (
    <div className="border-t border-border/50 px-4 py-2 text-xxs text-subtle-foreground sm:text-xs">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="hidden sm:inline">
          <kbd className="rounded border border-border px-1 py-0.5 font-sans">↑↓</kbd> navigate ·{' '}
          <kbd className="rounded border border-border px-1 py-0.5 font-sans">a</kbd> ask AI ·{' '}
          <kbd className="rounded border border-border px-1 py-0.5 font-sans">↵</kbd> open ·{' '}
          <kbd className="rounded border border-border px-1 py-0.5 font-sans">esc</kbd> close
        </span>
        <span className="sm:hidden">
          <kbd className="rounded border border-border px-1 py-0.5 font-sans">↵</kbd> open ·{' '}
          <kbd className="rounded border border-border px-1 py-0.5 font-sans">esc</kbd> close
        </span>
        <span className="text-subtle-foreground/80">
          <span className="font-medium text-foreground">Find</span> = search ·{' '}
          <span className="font-medium text-foreground">Ask AI</span> = chat
        </span>
      </div>
    </div>
  );
}
