/**
 * ChatStatusIndicators — quiet loading / error chrome for Ask.
 * On failure, hand off to Find (⌘K) instead of stacking search results in the dock.
 */
import { autoragEvents } from '@/lib/analytics';
import { openCommandCenter } from '@/features/command-center/lib/commandEvents';
import type { ChatStatusIndicatorsProps } from '@/features/chat/types';

function loadingCopy(phase: ChatStatusIndicatorsProps['loadingPhase']): string {
  switch (phase) {
    case 'searching':
      return 'Looking that up…';
    case 'analyzing':
      return 'Reading relevant pages…';
    case 'crafting':
      return 'Writing answer…';
    case null:
      return 'Thinking…';
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

export function ChatStatusIndicators({
  chatState,
  loadingPhase,
  isListening,
  interimTranscript,
  error,
  lastQueryValue,
  lastFailedQuery,
  canRetry,
  setError,
  setRetryCount,
  sendQuery,
}: ChatStatusIndicatorsProps) {
  if (chatState !== 'loading' && !isListening && !error) return null;

  const searchQuery = (lastFailedQuery || lastQueryValue || '').trim();

  return (
    <div className="shrink-0 border-t border-border/40 px-3 py-2 sm:px-4">
      {chatState === 'loading' ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="size-3.5 animate-spin rounded-full border-2 border-accent/30 border-t-accent"
            aria-hidden="true"
          />
          <span>{loadingCopy(loadingPhase)}</span>
        </div>
      ) : null}

      {isListening ? (
        <div className="flex items-center gap-2 text-xs text-accent">
          <span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
          Listening{interimTranscript ? `: ${interimTranscript}` : ''}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-border/60 bg-surface-subtle/60 px-3 py-2 text-xs text-muted-foreground">
          <p className="text-foreground">{error}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="focus-ring-interactive rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent disabled:opacity-50"
              onClick={() => {
                const queryToRetry = lastFailedQuery || lastQueryValue;
                if (queryToRetry) {
                  setError(null);
                  setRetryCount(0);
                  sendQuery(queryToRetry);
                  autoragEvents.manualRetry();
                }
              }}
              disabled={!canRetry && !lastFailedQuery}
            >
              Try again
            </button>
            {searchQuery ? (
              <button
                type="button"
                className="focus-ring-interactive rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-accent hover:text-accent"
                onClick={() => openCommandCenter(searchQuery)}
              >
                Search the site
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
