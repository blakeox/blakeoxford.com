/**
 * ChatInput — calm composer for the Ask dock.
 */
import { memo, useCallback } from 'react';
import type { ChatInputProps } from '@/features/chat/types';

export const ChatInput = memo(function ChatInput({
  inputValue,
  chatState,
  inputRef,
  wsRef,
  typingTimeoutRef,
  setInputValue,
  setComposerFocused,
  handleTextareaKeyDown,
  handleSubmit,
}: ChatInputProps) {
  const isLoading = chatState === 'loading';

  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputRef]);

  return (
    <form
      className="border-t border-border/40 bg-surface/70 px-3 pt-2.5 pb-3 sm:px-4 sm:pb-3.5"
      onSubmit={handleSubmit}
    >
      <div className="relative flex items-end gap-2 rounded-xl border border-border/55 bg-field-bg px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition focus-within:border-accent/55 focus-within:ring-2 focus-within:ring-accent/25">
        <textarea
          id="ai-chat-input"
          ref={inputRef}
          className="max-h-[7.5rem] min-h-[2.5rem] w-full resize-none bg-transparent py-1 pr-11 text-sm leading-relaxed text-foreground outline-none placeholder:text-subtle-foreground/65 disabled:opacity-60"
          placeholder="Ask about this page or the site…"
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
            autoResize();

            if (wsRef.current?.isConnected()) {
              wsRef.current.sendTyping(true);

              if (typingTimeoutRef.current !== null) {
                window.clearTimeout(typingTimeoutRef.current);
              }

              typingTimeoutRef.current = window.setTimeout(() => {
                if (wsRef.current?.isConnected()) {
                  wsRef.current.sendTyping(false);
                }
              }, 2000);
            }
          }}
          onKeyDown={handleTextareaKeyDown}
          onFocus={() => setComposerFocused(true)}
          onBlur={() => setComposerFocused(false)}
          disabled={isLoading}
          required
          rows={1}
          aria-label="Ask about this page or the site"
        />
        <button
          type="submit"
          className="focus-ring-interactive absolute right-1.5 bottom-1.5 inline-flex size-8 items-center justify-center rounded-lg bg-accent text-on-accent transition hover:bg-accent-dark disabled:opacity-40"
          aria-label={isLoading ? 'Sending message' : 'Send message'}
          disabled={isLoading || !inputValue.trim()}
        >
          {isLoading ? (
            <svg
              className="size-3.5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M8.757 8.757 6.636 6.636m12.728 0-2.121 2.121M8.757 15.243l-2.121 2.121"
              />
            </svg>
          ) : (
            <svg
              className="size-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </button>
      </div>
      <p className="mt-2 hidden text-xxs text-subtle-foreground/80 sm:block">
        <kbd className="rounded border border-border/70 px-1 py-0.5 font-sans">↵</kbd> send ·{' '}
        <kbd className="rounded border border-border/70 px-1 py-0.5 font-sans">⌘K</kbd> search
      </p>
    </form>
  );
});

ChatInput.displayName = 'ChatInput';
