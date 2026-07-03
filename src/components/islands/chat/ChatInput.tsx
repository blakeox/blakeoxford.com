/**
 * ChatInput component
 * Handles the chat input textarea and send button
 */
import { memo } from 'react';
import type { ChatInputProps } from './types';

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

	return (
		<form className="border-t border-border/40 bg-surface/80 px-4 py-3" onSubmit={handleSubmit}>
			<div className="relative">
				<textarea
					id="ai-chat-input"
					ref={inputRef}
					className="focus-ring-interactive h-20 w-full resize-none rounded-2xl border border-border/50 bg-field-bg px-4 py-3 pr-12 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
					placeholder="Ask about projects, case studies, or posts…"
					value={inputValue}
					onChange={(event) => {
						setInputValue(event.target.value);

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
					rows={3}
					aria-label="Message the AI assistant"
				/>
				<button
					type="submit"
					className="focus-ring-interactive absolute bottom-2.5 right-2.5 inline-flex size-9 items-center justify-center rounded-full bg-accent text-on-accent shadow-sm transition hover:bg-accent-dark disabled:opacity-50"
					aria-label={isLoading ? 'Sending message' : 'Send message'}
					disabled={isLoading || !inputValue.trim()}
				>
					{isLoading ? (
						<svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M8.757 8.757 6.636 6.636m12.728 0-2.121 2.121M8.757 15.243l-2.121 2.121" />
						</svg>
					) : (
						<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4.5 3m0-6L5 12m13.5-7.5-13 7a1 1 0 0 0 0 1.8l13 7A1 1 0 0 0 20 20.5v-17a1 1 0 0 0-1.5-.9Z" />
						</svg>
					)}
				</button>
			</div>
			<div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xxs text-muted-foreground sm:text-xs">
				<span>Shift+Enter for a new line</span>
				<span>
					<kbd className="rounded border border-border px-1 py-0.5 font-sans">⌘K</kbd> site search
				</span>
			</div>
		</form>
	);
});

ChatInput.displayName = 'ChatInput';
