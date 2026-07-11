/**
 * ChatQuickActions — empty Ask state aligned with Find suggestion language.
 */
import { memo } from 'react';
import { QUICK_ACTIONS } from '../../../lib/chat';
import { autoragEvents } from '../../../lib/analytics';
import { openCommandCenter } from '../../../features/command-center/lib/commandEvents';
import { SuggestionChip } from '../../../features/overlay/SuggestionChip';
import { SECTION_LABEL } from '../../../features/overlay/overlayStyles';
import type { ChatQuickActionsProps } from './types';

export const ChatQuickActions = memo(function ChatQuickActions({ onAction, setInputValue }: ChatQuickActionsProps) {
	return (
		<div className="space-y-3 py-1">
			<div className="space-y-1">
				<p className={SECTION_LABEL}>Ask</p>
				<p className="text-sm text-muted-foreground">
					Ask about projects, case studies, or posts.
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				{QUICK_ACTIONS.slice(0, 4).map((action) => (
					<SuggestionChip
						key={action.label}
						label={action.label}
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
				className="focus-ring-interactive text-xs text-muted-foreground underline-offset-2 transition hover:text-accent hover:underline"
				onClick={() => openCommandCenter()}
			>
				Search the site instead
			</button>
		</div>
	);
});

ChatQuickActions.displayName = 'ChatQuickActions';
