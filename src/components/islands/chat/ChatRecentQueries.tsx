/**
 * ChatRecentQueries component
 * Displays recent query history for quick replay
 */
import type { ChatRecentQueriesProps } from './types';

export function ChatRecentQueries({ queries, onReplayQuery }: ChatRecentQueriesProps) {
	if (queries.length === 0) return null;

	return (
		<div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--border)]/20 bg-[color:var(--surface-subtle)]/20 px-4 py-2 text-[0.65rem] text-[color:var(--fg)]/60">
			<span className="uppercase tracking-wide text-[color:var(--fg)]/45">Recent</span>
			{queries.map((query, index) => (
				<button
					key={`recent-query-${index}`}
					type="button"
					className="max-w-[14rem] truncate rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
					onClick={() => onReplayQuery(query)}
					title={query}
				>
					{query}
				</button>
			))}
		</div>
	);
}
