/**
 * ChatQuickActions component
 * Displays quick action buttons for common queries
 */
import { memo } from 'react';
import { QUICK_ACTIONS } from '../../../lib/chat';
import { autoragEvents } from '../../../lib/analytics';
import type { ChatQuickActionsProps } from './types';

export const ChatQuickActions = memo(function ChatQuickActions({ onAction, setInputValue }: ChatQuickActionsProps) {
	return (
		<div className="space-y-4 py-2">
			<div className="space-y-1 text-center">
				<h3 className="text-base font-semibold text-foreground">What would you like to know?</h3>
				<p className="text-sm text-muted-foreground">Pick a topic or type your own question below.</p>
			</div>

			<div className="grid grid-cols-1 gap-2">
				{QUICK_ACTIONS.map((action, index) => (
					<button
						key={index}
						type="button"
						onClick={() => {
							setInputValue(action.query);
							setTimeout(() => onAction(action.query, action.label, action.category), 100);
							autoragEvents.quickAction({
								action: action.label,
								category: action.category,
							});
						}}
						className="group focus-ring-interactive flex items-center gap-3 rounded-xl border border-border/50 bg-surface/70 px-3 py-3 text-left transition hover:border-accent/40 hover:bg-surface hover:shadow-sm"
					>
						<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold uppercase text-accent">
							{action.label.slice(0, 1)}
						</span>
						<div className="min-w-0 flex-1">
							<div className="text-sm font-medium text-foreground group-hover:text-accent">{action.label}</div>
							<div className="line-clamp-1 text-xs text-muted-foreground">{action.query}</div>
						</div>
						<svg
							className="size-4 shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-accent"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</button>
				))}
			</div>
		</div>
	);
});

ChatQuickActions.displayName = 'ChatQuickActions';
