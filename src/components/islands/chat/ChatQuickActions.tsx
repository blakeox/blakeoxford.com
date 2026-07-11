/**
 * ChatQuickActions — empty Ask state with page-aware prompts.
 */
import { memo } from 'react';
import { QUICK_ACTIONS } from '../../../lib/chat';
import { autoragEvents } from '../../../lib/analytics';
import { openCommandCenter } from '../../../features/command-center/lib/commandEvents';
import { SuggestionChip } from '../../../features/overlay/SuggestionChip';
import type { ChatQuickActionsProps } from './types';

export const ChatQuickActions = memo(function ChatQuickActions({
	pageLabel,
	onAction,
	setInputValue,
}: ChatQuickActionsProps) {
	return (
		<div className="flex h-full flex-col justify-center gap-5 px-1 py-4">
			<div className="space-y-1.5">
				<p className="text-[0.9375rem] font-semibold tracking-tight text-foreground">
					Ask while you browse
				</p>
				<p className="max-w-[22rem] text-sm leading-relaxed text-muted-foreground">
					{pageLabel
						? `Questions about ${pageLabel}, or anything across the site.`
						: 'Questions about this page, or anything across the site.'}
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				{QUICK_ACTIONS.slice(0, 4).map((action) => (
					<SuggestionChip
						key={action.label}
						label={action.label}
						accent={action.category === 'page'}
						onClick={() => {
							setInputValue(action.query);
							onAction(action.query, action.label, action.category);
							autoragEvents.quickAction({
								action: action.label,
								category: action.category,
							});
						}}
					/>
				))}
			</div>

			<button
				type="button"
				className="focus-ring-interactive self-start text-xs text-muted-foreground underline-offset-2 transition hover:text-accent hover:underline"
				onClick={() => openCommandCenter()}
			>
				Search pages instead
			</button>
		</div>
	);
});

ChatQuickActions.displayName = 'ChatQuickActions';
