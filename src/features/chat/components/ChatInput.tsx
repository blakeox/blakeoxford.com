/**
 * ChatInput — calm composer for the Ask dock.
 */
import { memo, useCallback } from 'react';
import type { ChatInputProps } from '@/features/chat/types';
import {
  getButtonClasses,
  getFieldShellClasses,
  getKbdClasses,
  getSpinnerClasses,
} from '@/lib/design-system/recipes';
import { cn } from '@/utils/cn';

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
      <label className="sr-only" htmlFor="ai-chat-input">
        Ask about this page or the site
      </label>
      <div className={getFieldShellClasses('items-end gap-2 px-3 py-2')}>
        <textarea
          id="ai-chat-input"
          ref={inputRef}
          className="max-h-[7.5rem] min-h-[2.5rem] w-full resize-none bg-transparent py-1 pr-11 text-sm leading-relaxed text-foreground outline-none placeholder:text-subtle-foreground disabled:cursor-not-allowed disabled:text-button-disabled-fg"
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
          className={cn(
            getButtonClasses({
              variant: 'primary',
              size: 'icon',
              disabled: isLoading || !inputValue.trim(),
              loading: isLoading,
            }),
            'absolute right-1.5 bottom-1.5'
          )}
          aria-label={isLoading ? 'Sending message' : 'Send message'}
          aria-busy={isLoading}
          disabled={isLoading || !inputValue.trim()}
        >
          {isLoading ? (
            <span className={getSpinnerClasses('sm')} aria-hidden="true" />
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
      <p className="mt-2 hidden text-xxs text-subtle-foreground sm:block">
        <kbd className={getKbdClasses()}>↵</kbd> send · <kbd className={getKbdClasses()}>⌘K</kbd>{' '}
        search
      </p>
    </form>
  );
});

ChatInput.displayName = 'ChatInput';
