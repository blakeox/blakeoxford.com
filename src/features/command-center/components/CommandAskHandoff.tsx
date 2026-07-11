import { SUGGESTION_CHIP_ACCENT } from '../../overlay/overlayStyles';

type CommandAskHandoffProps = {
  query: string;
  onAsk: () => void;
};

export function CommandAskHandoff({ query, onAsk }: CommandAskHandoffProps) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  return (
    <div className="mb-2 flex items-center gap-2 px-1">
      <button
        type="button"
        data-command-ask-handoff
        className={`${SUGGESTION_CHIP_ACCENT} max-w-full`}
        onClick={onAsk}
      >
        <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 3h5.5M21 11.5c0 4.418-4.03 8-9 8-1.15 0-2.26-.19-3.29-.54L3 21l1.1-3.3A8.35 8.35 0 0 1 3 11.5c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
        </svg>
        <span className="truncate">Ask about &ldquo;{trimmed}&rdquo;</span>
      </button>
    </div>
  );
}

export function CommandAskState({ query, onAsk }: { query: string; onAsk: () => void }) {
  const trimmed = query.trim();

  return (
    <div data-command-ask-state className="flex flex-col gap-3 px-1 py-2">
      <p className="text-sm text-muted-foreground">
        {trimmed
          ? 'Press Enter to open Ask with your question.'
          : 'Type a question after ?, then press Enter.'}
      </p>
      {trimmed ? <CommandAskHandoff query={query} onAsk={onAsk} /> : null}
    </div>
  );
}
