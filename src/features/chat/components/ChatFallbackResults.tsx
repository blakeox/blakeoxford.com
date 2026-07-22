/**
 * ChatFallbackResults — compact related links after an Ask failure.
 * Collapsed by default so the transcript stays readable.
 */
import type { ChatFallbackResultsProps } from '../types';

export function ChatFallbackResults({
  fallbackResults,
  visibleFallbackResults,
  hasMoreFallbackResults,
  showFallbackSuggestions,
  setShowFallbackSuggestions,
  onDismiss,
}: ChatFallbackResultsProps) {
  if (fallbackResults.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-border/40 px-3 py-2 sm:px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="focus-ring-interactive flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-surface-subtle"
          aria-expanded={showFallbackSuggestions}
          onClick={() => setShowFallbackSuggestions(!showFallbackSuggestions)}
        >
          <span className="truncate text-xs text-muted-foreground">
            Related pages
            <span className="text-subtle-foreground"> · {fallbackResults.length}</span>
          </span>
          <svg
            className={`size-3.5 shrink-0 text-subtle-foreground transition ${showFallbackSuggestions ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 7.5 10 12.5 15 7.5" />
          </svg>
        </button>
        {onDismiss ? (
          <button
            type="button"
            className="focus-ring-interactive inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-subtle-foreground transition hover:bg-surface-subtle hover:text-foreground"
            aria-label="Dismiss related pages"
            onClick={onDismiss}
          >
            <svg
              className="size-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        ) : null}
      </div>

      {showFallbackSuggestions ? (
        <ul className="mt-1 flex flex-col">
          {visibleFallbackResults.map((result, index) => (
            <li key={`fallback-${index}`}>
              <a
                href={result.url}
                className="focus-ring-interactive block truncate rounded-lg px-2 py-1.5 text-sm text-foreground transition hover:bg-surface-subtle"
                target={result.url.startsWith('http') ? '_blank' : undefined}
                rel={result.url.startsWith('http') ? 'noreferrer' : undefined}
              >
                {result.title}
              </a>
            </li>
          ))}
          {hasMoreFallbackResults ? (
            <li className="px-2 py-1 text-xxs text-subtle-foreground">
              +{fallbackResults.length - visibleFallbackResults.length} more in search
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
