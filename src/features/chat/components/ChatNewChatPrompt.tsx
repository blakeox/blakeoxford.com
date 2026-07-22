/**
 * ChatNewChatPrompt component
 * Displays prompt to start a new chat conversation
 */
import type { ChatNewChatPromptProps } from '../types';

export function ChatNewChatPrompt({ canStartNewChat, startNewChat }: ChatNewChatPromptProps) {
  if (!canStartNewChat) return null;

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border/40 bg-surface-subtle/40 px-4 py-2 text-[0.7rem] text-foreground/65">
      <span className="truncate pr-2">Want to start fresh?</span>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full border border-border/40 px-3 py-1 text-[0.65rem] font-medium text-foreground/70 transition hover:border-accent/40 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
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
