/**
 * ChatHeader component
 * Displays the header with title, connection status, and control buttons
 */
import { memo } from 'react';
import { openCommandCenter } from '../../../features/command-center/lib/commandEvents';
import type { ChatHeaderProps } from './types';

export const ChatHeader = memo(function ChatHeader({
	wsConnected,
	activeUsers,
	voiceSupported,
	isListening,
	showAdvancedControls,
	toggleVoiceInput,
	toggleAdvancedControls,
	closeChat,
}: ChatHeaderProps) {
	return (
		<div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border/40 bg-surface-subtle/60 px-4 py-3 backdrop-blur-sm">
			<div className="min-w-0 flex-1">
				<span id="ai-chat-heading" className="block truncate text-sm font-semibold text-foreground">
					AI Assistant
				</span>
				<span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
					<span>Answers with cited sources</span>
					{wsConnected ? (
						<>
							<span aria-hidden="true">·</span>
							<span className="inline-flex items-center gap-1">
								<span className="inline-block size-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
								<span>Live</span>
							</span>
							{activeUsers > 1 ? (
								<>
									<span aria-hidden="true">·</span>
									<span>{activeUsers} online</span>
								</>
							) : null}
						</>
					) : null}
				</span>
			</div>
			<div className="flex shrink-0 items-center gap-1.5">
				<button
					type="button"
					className="focus-ring-interactive inline-flex size-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition hover:border-accent/60 hover:text-accent"
					aria-label="Open site search"
					title="Open site search (⌘K)"
					onClick={() => openCommandCenter()}
				>
					<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.8-4.8M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
					</svg>
				</button>
				{voiceSupported ? (
					<button
						type="button"
						className={`focus-ring-interactive inline-flex size-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition hover:border-accent/60 hover:text-accent ${
							isListening ? 'border-accent/50 bg-accent/15 text-accent' : ''
						}`}
						aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
						onClick={toggleVoiceInput}
					>
						<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0M12 18v3m-4 0h8" />
						</svg>
					</button>
				) : null}
				<button
					type="button"
					className={`focus-ring-interactive inline-flex size-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition hover:border-accent/60 hover:text-accent ${
						showAdvancedControls ? 'border-accent/50 bg-accent/15 text-accent' : ''
					}`}
					aria-label={showAdvancedControls ? 'Hide advanced controls' : 'Show advanced controls'}
					onClick={toggleAdvancedControls}
				>
					<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v1.5m0 9V18m6-6h-1.5m-9 0H6m8.485-4.485-1.06 1.06m-6.85 6.85-1.06 1.06m0-8.97 1.06 1.06m6.85 6.85 1.06 1.06M12 9.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
					</svg>
				</button>
				<button
					type="button"
					className="focus-ring-interactive inline-flex size-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition hover:border-accent/50 hover:text-accent"
					aria-label="Close assistant"
					onClick={closeChat}
				>
					<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
					</svg>
				</button>
			</div>
		</div>
	);
});

ChatHeader.displayName = 'ChatHeader';
