import { SUGGESTED_QUERIES } from '../types';

type CommandEmptyProps = {
  query: string;
  recentQueries: string[];
  onSuggestion: (value: string) => void;
  onClearHistory: () => void;
  onAskAi: (query: string) => void;
};

export function CommandEmpty({ query, recentQueries, onSuggestion, onClearHistory, onAskAi }: CommandEmptyProps) {
  const trimmed = query.trim();

  if (!trimmed) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-surface/60 px-4 py-4 text-sm text-muted-foreground">
        <p>
          <strong className="font-medium text-foreground">Find</strong> jumps to pages and projects.
          {' '}
          <strong className="font-medium text-foreground">Ask AI</strong> opens the conversational assistant (bottom-right).
        </p>
        {recentQueries.length ? (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-label text-subtle-foreground">Recent</span>
              <button
                type="button"
                className="text-xs text-accent hover:underline"
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
                  className="rounded-full border border-border/60 px-3 py-1 text-xs transition hover:border-accent hover:text-accent"
                  onClick={() => onSuggestion(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-surface/60 px-4 py-4 text-sm text-muted-foreground">
      <p>No results for &ldquo;{trimmed}&rdquo;.</p>
      <p className="mt-2">Try a different keyword, ask the AI assistant, or browse a suggestion:</p>
      <div className="mt-3">
        <button
          type="button"
          className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/15"
          onClick={() => onAskAi(trimmed)}
        >
          Ask AI about &ldquo;{trimmed}&rdquo;
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTED_QUERIES.map((item) => (
          <button
            key={item}
            type="button"
            className="rounded-full border border-border/60 px-3 py-1 text-xs transition hover:border-accent hover:text-accent"
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
    <div className="hidden border-t border-border/50 px-4 py-2 text-xs text-subtle-foreground sm:block">
      <p className="mb-1">
        <strong className="font-medium text-foreground">Find</strong> = site search ·{' '}
        <strong className="font-medium text-foreground">Ask AI</strong> = chat assistant (AutoRAG)
      </p>
      <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
        <span>
          <kbd className="rounded border border-border px-1.5 py-0.5 font-sans">↑↓</kbd> navigate
        </span>
        <span>
          <kbd className="rounded border border-border px-1.5 py-0.5 font-sans">↵</kbd> open
        </span>
        <span>
          <kbd className="rounded border border-border px-1.5 py-0.5 font-sans">esc</kbd> close
        </span>
      </span>
    </div>
  );
}
