/**
 * ChatNewChatPrompt component
 * Displays prompt to start a new chat conversation
 */
import type { ChatNewChatPromptProps } from '@/features/chat/types';
import { OVERLAY_PROMPT_BAR } from '@/features/overlay/overlayStyles';
import { getButtonClasses } from '@/lib/design-system/recipes';
import { cn } from '@/utils/cn';

export function ChatNewChatPrompt({ canStartNewChat, startNewChat }: ChatNewChatPromptProps) {
  if (!canStartNewChat) return null;

  return (
    <div className={OVERLAY_PROMPT_BAR}>
      <span className="truncate pr-2">Want to start fresh?</span>
      <button
        type="button"
        className={cn(getButtonClasses({ variant: 'outline', size: 'sm' }), 'text-xxs')}
        onClick={startNewChat}
      >
        <span>Start new chat</span>
        <svg
          className="size-3.5"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12m-6-6 6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}