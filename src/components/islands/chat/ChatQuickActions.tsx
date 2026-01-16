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
		<div className="space-y-4">
			<div className="text-center space-y-2">
				<h3 className="text-lg font-semibold text-[color:var(--fg)]">
					👋 How can I help you today?
				</h3>
				<p className="text-sm text-[color:var(--fg)]/60">
					Try one of these popular questions:
				</p>
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{QUICK_ACTIONS.map((action, index) => (
					<button
						key={index}
						type="button"
						onClick={() => {
							setInputValue(action.query);
							// Auto-submit after a brief delay for UX smoothness
							setTimeout(() => onAction(action.query, action.label, action.category), 100);

							// Track quick action usage
							autoragEvents.quickAction({
								action: action.label,
								category: action.category,
							});
						}}
						className="group flex items-start gap-3 rounded-xl border border-[color:var(--border)]/40 bg-[color:var(--surface)]/50 p-4 text-left transition-all duration-200 hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--surface)]/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
					>
						<span className="flex-shrink-0 text-2xl transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
							{action.icon}
						</span>
						<div className="min-w-0 flex-1">
							<div className="mb-1 text-sm font-medium text-[color:var(--fg)]">
								{action.label}
							</div>
							<div className="line-clamp-2 text-xs text-[color:var(--fg)]/60">
								{action.query}
							</div>
						</div>
						<svg
							className="size-5 flex-shrink-0 text-[color:var(--fg)]/40 transition-colors group-hover:text-[color:var(--accent)]"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
							focusable="false"
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
