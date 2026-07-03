/**
 * ChatRecentQueries component
 * Displays recent query history for quick replay
 */
import type { ChatRecentQueriesProps } from './types';

export function ChatRecentQueries({ queries, onReplayQuery }: ChatRecentQueriesProps) {
	if (queries.length === 0) return null;

	return (
		<div className="flex flex-wrap items-center gap-2 border-b border-border/30 bg-surface-subtle/40 px-4 py-2">
			<span className="text-xxs font-semibold uppercase tracking-label text-subtle-foreground">Recent</span>
			{queries.map((query, index) => (
				<button
					key={`recent-query-${index}`}
					type="button"
					className="focus-ring-interactive max-w-[14rem] truncate rounded-full border border-border/50 bg-surface/80 px-3 py-1 text-xs text-muted-foreground transition hover:border-accent/50 hover:text-accent"
					onClick={() => onReplayQuery(query)}
					title={query}
				>
					{query}
				</button>
			))}
		</div>
	);
}
