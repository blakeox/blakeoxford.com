/**
 * ChatFallbackResults component
 * Displays fallback/related search results
 */
import type { ChatFallbackResultsProps } from './types';

export function ChatFallbackResults({
	fallbackResults,
	visibleFallbackResults,
	hasMoreFallbackResults,
	showFallbackSuggestions,
	setShowFallbackSuggestions,
}: ChatFallbackResultsProps) {
	if (fallbackResults.length === 0) return null;

	return (
		<div className="min-w-0 rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--surface-subtle)]/30 p-3 text-xs text-[color:var(--fg)]/70">
			<div className="flex items-center justify-between gap-2">
				<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Related suggestions</span>
				<button
					type="button"
					className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.625rem] font-medium text-[color:var(--fg)]/65 transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
					onClick={() => setShowFallbackSuggestions(!showFallbackSuggestions)}
				>
					{showFallbackSuggestions ? 'Hide' : `Show all (${fallbackResults.length})`}
				</button>
			</div>
			<ul className="mt-2 flex flex-wrap gap-2">
				{visibleFallbackResults.map((result, index) => (
					<li
						key={`fallback-${index}`}
						className="group flex min-w-0 max-w-full flex-1 flex-col gap-1 rounded-2xl border border-[color:var(--border)]/35 bg-[color:var(--surface)]/70 px-3 py-2 transition hover:border-[color:var(--accent)]/40"
					>
						<a
							href={result.url}
							className="truncate text-[color:var(--accent)] underline decoration-dotted underline-offset-2 group-hover:text-[color:var(--accent-strong)]"
							target="_blank"
							rel="noreferrer"
						>
							{result.title}
						</a>
						{showFallbackSuggestions && result.excerpt && (
							<p className="line-clamp-2 break-words text-[color:var(--fg)]/60">{result.excerpt}</p>
						)}
					</li>
				))}
			</ul>
			{hasMoreFallbackResults && !showFallbackSuggestions && (
				<p className="mt-1 text-[0.6rem] text-[color:var(--fg)]/50">Showing top {visibleFallbackResults.length} of {fallbackResults.length} matches.</p>
			)}
		</div>
	);
}
