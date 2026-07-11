/**
 * ChatInput — shared field language with Find overlay.
 */
import { memo, useCallback } from 'react';
import type { ChatInputProps } from './types';
import { OVERLAY_FOOTER } from '../../../features/overlay/overlayStyles';

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
		<form className="border-t border-border/40 bg-surface/80 px-3 py-3 sm:px-4" onSubmit={handleSubmit}>
			<div className="relative flex items-end gap-2 rounded-lg border border-border/60 bg-field-bg px-3 py-2 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/30">
				<textarea
					id="ai-chat-input"
					ref={inputRef}
					className="max-h-[7.5rem] min-h-[2.5rem] w-full resize-none bg-transparent py-1 pr-10 text-sm text-foreground outline-none placeholder:text-subtle-foreground/70 disabled:opacity-60"
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
					className="focus-ring-interactive absolute bottom-1.5 right-1.5 inline-flex size-8 items-center justify-center rounded-lg bg-accent text-on-accent transition hover:bg-accent-dark disabled:opacity-50"
					aria-label={isLoading ? 'Sending message' : 'Send message'}
					disabled={isLoading || !inputValue.trim()}
				>
					{isLoading ? (
						<svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M8.757 8.757 6.636 6.636m12.728 0-2.121 2.121M8.757 15.243l-2.121 2.121" />
						</svg>
					) : (
						<svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
						</svg>
					)}
				</button>
			</div>
			<div className={`${OVERLAY_FOOTER} border-0 px-0 pb-0 pt-2`}>
				<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
					<span className="hidden sm:inline">
						<kbd className="rounded border border-border px-1 py-0.5 font-sans">↵</kbd> send ·{' '}
						<span className="text-subtle-foreground/70">Shift+Enter new line</span>
					</span>
					<span className="sm:hidden">Send · Close</span>
					<span className="text-subtle-foreground/80">
						<span className="hidden sm:inline">Stays open while you browse · </span>
						<kbd className="rounded border border-border px-1 py-0.5 font-sans">⌘K</kbd> search
					</span>
				</div>
			</div>
		</form>
	);
});

ChatInput.displayName = 'ChatInput';
