/**
 * ChatInput component
 * Handles the chat input textarea and send button
 */
import { memo } from 'react';
import type { ChatInputProps } from './types';

export const ChatInput = memo(function ChatInput({
	inputValue,
	chatState,
	floatingLabelActive,
	inputRef,
	wsRef,
	typingTimeoutRef,
	setInputValue,
	setComposerFocused,
	handleTextareaKeyDown,
	handleSubmit,
}: ChatInputProps) {
	return (
		<form className="border-t border-[color:var(--border)]/40 bg-[color:var(--surface)]/50 px-4 py-3" onSubmit={handleSubmit}>
			<div className="relative">
				<textarea
					id="ai-chat-input"
					ref={inputRef}
					className="h-24 w-full resize-none rounded-2xl border border-[color:var(--border)]/40 bg-[color:var(--surface)]/70 px-4 pb-3 pr-12 pt-6 text-sm text-[color:var(--fg)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/40"
					placeholder=""
					value={inputValue}
					onChange={(event) => {
						setInputValue(event.target.value);

						// Send typing indicator via WebSocket
						if (wsRef.current?.isConnected()) {
							wsRef.current.sendTyping(true);

							// Clear previous timeout
							if (typingTimeoutRef.current !== null) {
								window.clearTimeout(typingTimeoutRef.current);
							}

							// Stop typing indicator after 2 seconds of inactivity
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
					disabled={chatState === 'loading'}
					required
					rows={3}
				/>
				<label
					htmlFor="ai-chat-input"
					className={`pointer-events-none absolute left-4 font-medium text-[color:var(--fg)]/60 transition-all duration-150 ease-out ${
						floatingLabelActive ? 'top-2 text-[0.7rem] opacity-85' : 'top-4 text-sm opacity-70'
					}`}
				>
					Ask about projects, case studies, or posts…
				</label>
				<button
					type="button"
					className="absolute bottom-3 right-3 inline-flex size-9 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--on-accent)] shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60 active:scale-95 disabled:opacity-50"
					aria-label={chatState === 'loading' ? 'Sending message' : 'Send message'}
					disabled={chatState === 'loading'}
					onClick={(e) => {
						// Dispatch a submit event on the containing form so form-level handlers run
						const el = (e.currentTarget as HTMLElement);
						const form = el.closest('form') as HTMLFormElement | null;
						if (form) {
							const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
							form.dispatchEvent(submitEvent);
						}
					}}
				>
					{chatState === 'loading' ? (
						<svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true" focusable="false">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M8.757 8.757 6.636 6.636m12.728 0-2.121 2.121M8.757 15.243l-2.121 2.121" />
						</svg>
					) : (
						<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true" focusable="false">
							<path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4.5 3m0-6L5 12m13.5-7.5-13 7a1 1 0 0 0 0 1.8l13 7A1 1 0 0 0 20 20.5v-17a1 1 0 0 0-1.5-.9Z" />
						</svg>
					)}
				</button>
			</div>
			<div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[0.65rem] text-[color:var(--fg)]/60">
				<span>Shift+Enter for a new line</span>
				<span className="flex gap-2">
					<span className="whitespace-nowrap">⌘K / Ctrl+K reopens</span>
					<span className="whitespace-nowrap">/ focuses input</span>
				</span>
			</div>
		</form>
	);
});

ChatInput.displayName = 'ChatInput';
