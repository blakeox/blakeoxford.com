/**
 * ChatStatusIndicators component
 * Displays loading, listening, and error states
 */
import { autoragEvents } from '../../../lib/analytics';
import type { ChatStatusIndicatorsProps } from './types';

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
	return (
		<>
			{chatState === 'loading' && (
				<div className="flex items-center gap-2 text-sm text-[color:var(--fg)]/70">
					<svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M8.757 8.757 6.636 6.636m12.728 0-2.121 2.121M8.757 15.243l-2.121 2.121" />
					</svg>
					{loadingPhase === 'searching' && 'Searching knowledge base...'}
					{loadingPhase === 'analyzing' && 'Analyzing sources...'}
					{loadingPhase === 'crafting' && 'Crafting response...'}
					{!loadingPhase && 'Thinking through the best answer...'}
				</div>
			)}

			{isListening && (
				<div className="flex items-center gap-2 text-xs text-[color:var(--accent-strong)]">
					<span className="inline-flex size-2 rounded-full bg-[color:var(--accent-strong)]" aria-hidden="true" />
					Listening{interimTranscript ? `: ${interimTranscript}` : ''}
				</div>
			)}

			{error && (
				<div className="rounded-xl border border-[color:var(--color-error)]/50 bg-[color:var(--color-error-subtle)] px-3 py-2 text-xs text-error-emphasis">
					<p>{error}</p>
					{lastQueryValue && (
						<p className="mt-1 text-[color:var(--fg)]/60">
							Last question: <span className="font-medium text-[color:var(--fg)]">{lastQueryValue}</span>
						</p>
					)}
					{retryCount > 0 && (
						<p className="mt-1 text-[color:var(--fg)]/60">
							Retry attempts: {retryCount}/2
						</p>
					)}
					<div className="mt-2 flex flex-wrap gap-2">
						<button
							type="button"
							className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-error)]/55 px-3 py-1 font-medium transition hover:border-[color:var(--color-error)] hover:text-error-emphasis focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-error)]/50 disabled:opacity-60"
							onClick={() => {
								// Manual retry - clear error and use lastFailedQuery if available
								const queryToRetry = lastFailedQuery || lastQueryValue;
								if (queryToRetry) {
									setError(null);
									setRetryCount(0);
									sendQuery(queryToRetry);

									// Track manual retry
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
							href="/projects"
							className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
						>
							Browse projects
						</a>
						<a
							href="/contact"
							className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
						>
							Contact Blake
						</a>
					</div>
				</div>
			)}
		</>
	);
}
