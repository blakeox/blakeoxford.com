/**
 * ChatFallbackResults — Vectorize-backed related links when Ask fails or needs backup.
 */
import type { ChatFallbackResultsProps } from './types';
import { SECTION_LABEL } from '../../../features/overlay/overlayStyles';

export function ChatFallbackResults({
	fallbackResults,
	visibleFallbackResults,
	hasMoreFallbackResults,
	showFallbackSuggestions,
	setShowFallbackSuggestions,
}: ChatFallbackResultsProps) {
	if (fallbackResults.length === 0) return null;

	return (
		<div className="border-t border-border/40 px-3 py-2 sm:px-4">
			<div className="mb-1.5 flex items-center justify-between gap-2">
				<span className={SECTION_LABEL}>From site search</span>
				<button
					type="button"
					className="focus-ring-interactive rounded text-xxs text-subtle-foreground transition hover:text-foreground"
					onClick={() => setShowFallbackSuggestions(!showFallbackSuggestions)}
				>
					{showFallbackSuggestions ? 'Hide' : `Show all (${fallbackResults.length})`}
				</button>
			</div>
			<p className="mb-1.5 px-1 text-xxs text-subtle-foreground">
				Cloudflare Vectorize matches
			</p>
			<ul className="flex flex-col">
				{visibleFallbackResults.map((result, index) => (
					<li key={`fallback-${index}`}>
						<a
							href={result.url}
							className="focus-ring-interactive flex items-start justify-between gap-2 rounded-lg px-3 py-2 transition hover:bg-surface-subtle"
							target={result.url.startsWith('http') ? '_blank' : undefined}
							rel={result.url.startsWith('http') ? 'noreferrer' : undefined}
						>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-sm font-medium text-foreground">{result.title}</span>
								{showFallbackSuggestions && result.excerpt ? (
									<span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{result.excerpt}</span>
								) : null}
							</span>
							{typeof result.score === 'number' && result.score > 0 ? (
								<span className="shrink-0 text-xxs tabular-nums text-subtle-foreground">
									{Math.round(result.score * 100)}%
								</span>
							) : null}
						</a>
					</li>
				))}
			</ul>
			{hasMoreFallbackResults && !showFallbackSuggestions ? (
				<p className="mt-1 px-1 text-xxs text-subtle-foreground">
					Showing {visibleFallbackResults.length} of {fallbackResults.length}
				</p>
			) : null}
		</div>
	);
}
