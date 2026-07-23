/**
 * ChatQuickActions — calm empty Ask state: two starters + Find handoff.
 */
import { memo } from 'react';
import { QUICK_ACTIONS } from '@/lib/chat';
import { autoragEvents } from '@/lib/analytics';
import { openCommandCenter } from '@/features/command-center/lib/commandEvents';
import { SuggestionChip } from '@/features/overlay/SuggestionChip';
import type { ChatQuickActionsProps } from '@/features/chat/types';

export const ChatQuickActions = memo(function ChatQuickActions({
  pageLabel,
  onAction,
  setInputValue,
}: ChatQuickActionsProps) {
  return (
    <div className="flex flex-col gap-4 px-1 py-1">
      <div className="space-y-1">
        <p className="text-[0.9375rem] font-semibold tracking-tight text-foreground">
          Ask while you browse
        </p>
        <p className="max-w-[22rem] text-sm leading-relaxed text-muted-foreground">
          {pageLabel
            ? `Questions about ${pageLabel}, or Blake’s work across the site.`
            : 'Questions about this page, or Blake’s work across the site.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
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
