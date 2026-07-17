/**
 * ChatRecentQueries — compact recent chips for Ask empty state.
 */
import type { ChatRecentQueriesProps } from './types';
import { SECTION_LABEL } from '../../../features/overlay/overlayStyles';

export function ChatRecentQueries({ queries, onReplayQuery }: ChatRecentQueriesProps) {
	if (queries.length === 0) return null;

	return (
		<div className="border-b border-border/40 px-3 py-2 sm:px-4">
			<div className="mb-1.5 flex items-center gap-2">
				<span className={SECTION_LABEL}>Recent</span>
			</div>
			<div className="flex flex-wrap gap-2">
				{queries.slice(0, 4).map((query, index) => (
					<button
						key={`recent-query-${index}`}
						type="button"
						className="focus-ring-interactive max-w-[14rem] truncate rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-accent hover:text-accent"
						onClick={() => onReplayQuery(query)}
						title={query}
					>
						{query}
					</button>
				))}
			</div>
		</div>
	);
}
