type CommandAskHandoffProps = {
  query: string;
  onAsk: () => void;
  compact?: boolean;
};

export function CommandAskHandoff({ query, onAsk, compact = false }: CommandAskHandoffProps) {
  const trimmed = query.trim();
  const label = trimmed ? `Ask AI about “${trimmed}”` : 'Open AI assistant for a conversational answer';

  return (
    <button
      type="button"
      className={`command-ask-handoff focus-ring-interactive flex w-full items-start gap-3 rounded-2xl border border-accent/30 bg-accent/5 text-left transition hover:border-accent/50 hover:bg-accent/10 ${
        compact ? 'px-3 py-3' : 'px-4 py-4'
      }`}
      onClick={onAsk}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent" aria-hidden="true">
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 3h5.5M21 11.5c0 4.418-4.03 8-9 8-1.15 0-2.26-.19-3.29-.54L3 21l1.1-3.3A8.35 8.35 0 0 1 3 11.5c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          Conversational answers with citations — opens the assistant in the bottom-right corner.
        </span>
      </span>
    </button>
  );
}

export function CommandAskPanel({ query, onAsk }: { query: string; onAsk: (prompt: string) => void }) {
  return (
    <div
      id="command-mode-panel-ask"
      role="tabpanel"
      aria-labelledby="command-mode-ask"
      className="flex flex-col gap-4"
    >
      <div className="rounded-2xl border border-border/60 bg-surface/80 px-4 py-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Ask the AI assistant</p>
        <p className="mt-1">
          Use this for conversational questions, summaries, and follow-ups. Site search (Find mode) is better for
          jumping directly to a page or project.
        </p>
      </div>
      <CommandAskHandoff query={query} onAsk={() => onAsk(query)} />
      <p className="text-xs text-subtle-foreground">
        Tip: type <kbd className="rounded border border-border px-1.5 py-0.5 font-sans">?</kbd> before your question
        in Find mode to switch here quickly.
      </p>
    </div>
  );
}
