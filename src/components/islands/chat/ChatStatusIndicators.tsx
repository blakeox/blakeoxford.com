/**
 * ChatStatusIndicators — quiet loading / error chrome for Ask overlay.
 * Loading copy mirrors the Cloudflare pipeline: Vectorize/AutoRAG retrieve → answer.
 */
import { autoragEvents } from '../../../lib/analytics';
import type { ChatStatusIndicatorsProps } from './types';

function loadingCopy(phase: ChatStatusIndicatorsProps['loadingPhase']): string {
	switch (phase) {
		case 'searching':
			return 'Searching site index…';
		case 'analyzing':
			return 'Retrieving sources…';
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
	retryCount,
	canRetry,
	setError,
	setRetryCount,
	sendQuery,
}: ChatStatusIndicatorsProps) {
	if (chatState !== 'loading' && !isListening && !error) return null;

	return (
		<div className="border-t border-border/40 px-3 py-2 sm:px-4">
			{chatState === 'loading' ? (
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<span className="size-3.5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" aria-hidden="true" />
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
					{lastQueryValue ? (
						<p className="mt-1 text-subtle-foreground">
							Last question: <span className="text-foreground">{lastQueryValue}</span>
						</p>
					) : null}
					{retryCount > 0 ? (
						<p className="mt-1 text-subtle-foreground">Retry {retryCount}/2</p>
					) : null}
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
									autoragEvents.manualRetry({
										message_id: lastFailedQuery ?? undefined,
									});
								}
							}}
							disabled={!canRetry && !lastFailedQuery}
						>
							Try again
						</button>
						<a
							href="/projects/"
							className="focus-ring-interactive rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-accent hover:text-accent"
						>
							Browse projects
						</a>
					</div>
				</div>
			) : null}
		</div>
	);
}
