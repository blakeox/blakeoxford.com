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
      className={`command-ask-handoff focus-ring-interactive group/handoff flex w-full items-center gap-3 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/5 to-transparent text-left transition hover:border-accent/50 hover:from-accent/10 ${
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
          Opens the assistant in the bottom-right with cited answers.
        </span>
      </span>
      <svg
        className="size-4 shrink-0 text-accent/60 transition group-hover/handoff:translate-x-0.5 group-hover/handoff:text-accent"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
      </svg>
    </button>
  );
}

export function CommandAskPanel({ query, onAsk }: { query: string; onAsk: (prompt: string) => void }) {
  const trimmed = query.trim();

  return (
    <div
      id="command-mode-panel-ask"
      role="tabpanel"
      aria-labelledby="command-mode-ask"
      className="flex flex-col gap-4"
    >
      <div className="rounded-2xl border border-border/60 bg-surface/80 px-4 py-4 text-sm">
        <p className="font-medium text-foreground">Conversational answers</p>
        <p className="mt-1 text-muted-foreground">
          Ask follow-up questions, get summaries, and explore topics with cited sources from this site.
        </p>
      </div>

      {trimmed ? (
        <CommandAskHandoff query={query} onAsk={() => onAsk(query)} />
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 bg-surface/60 px-4 py-4 text-sm text-muted-foreground">
          Type your question above, then press <kbd className="rounded border border-border px-1.5 py-0.5 font-sans">↵</kbd> to
          open the assistant with your prompt.
        </div>
      )}

      <p className="text-xs text-subtle-foreground">
        Tip: in Find mode, prefix a question with <kbd className="rounded border border-border px-1.5 py-0.5 font-sans">?</kbd> to
        switch here instantly.
      </p>
    </div>
  );
}
