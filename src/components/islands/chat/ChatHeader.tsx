/**
 * ChatHeader component
 * Displays the header with title, connection status, and control buttons
 */
import { memo } from 'react';
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
		<div className="flex items-center justify-between gap-2 border-b border-[color:var(--border)]/40 bg-[color:var(--surface-subtle)]/40 px-4 py-3">
			<div className="flex flex-col">
				<span id="ai-chat-heading" className="text-sm font-semibold text-[color:var(--fg)]">
					AI Portfolio Assistant
				</span>
				<span className="flex items-center gap-2 text-xs text-[color:var(--fg)]/60">
					<span>Powered by AutoRAG search</span>
					{wsConnected && (
						<>
							<span className="text-[color:var(--fg)]/30">•</span>
							<span className="flex items-center gap-1">
								<span className="inline-block size-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
								<span>Real-time connected</span>
							</span>
							{activeUsers > 1 && (
								<>
									<span className="text-[color:var(--fg)]/30">•</span>
									<span className="flex items-center gap-1">
										<svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
											<path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
										</svg>
										<span>{activeUsers} active</span>
									</span>
								</>
							)}
						</>
					)}
				</span>
			</div>
			<div className="flex items-center gap-2">
				{voiceSupported && (
					<button
						type="button"
						className={`inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)]/50 text-[color:var(--fg)]/70 transition-transform duration-150 hover:scale-105 hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] active:scale-95 ${
							isListening ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
						}`}
						aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
						onClick={toggleVoiceInput}
					>
						<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0M12 18v3m-4 0h8" />
						</svg>
					</button>
				)}
				<button
					type="button"
					className={`inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)]/50 text-[color:var(--fg)]/70 transition-transform duration-150 hover:scale-105 hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] active:scale-95 ${
						showAdvancedControls ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
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
					className="inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)]/50 text-[color:var(--fg)]/70 transition-transform duration-150 hover:scale-105 hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] active:scale-95"
					aria-label="Close assistant"
					onClick={closeChat}
					onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeChat(); } }}
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
