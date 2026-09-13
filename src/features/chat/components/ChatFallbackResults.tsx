/**
 * ChatFallbackResults — compact related links after an Ask failure.
 * Collapsed by default so the transcript stays readable.
 */
import type { ChatFallbackResultsProps } from '@/features/chat/types';
import { OVERLAY_DISMISS_BUTTON, getOverlaySoftRowClasses } from '@/features/overlay/overlayStyles';
import { cn } from '@/utils/cn';

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
          className={cn(getOverlaySoftRowClasses(true), 'min-w-0 flex-1')}
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
            className={OVERLAY_DISMISS_BUTTON}
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
                className={getOverlaySoftRowClasses(true)}
                target={result.url.startsWith('http') ? '_blank' : undefined}
                rel={result.url.startsWith('http') ? 'noreferrer' : undefined}
              >
                <span className="truncate">{result.title}</span>
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
