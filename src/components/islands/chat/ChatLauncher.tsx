/**
 * ChatLauncher component
 * The floating button that opens/closes the chat panel
 */
import type { ChatLauncherProps } from './types';

export function ChatLauncher({ isOpen, launcherRef, openChat, closeChat }: ChatLauncherProps) {
	return (
		<button
			ref={launcherRef}
			type="button"
			className="ai-chat-launcher pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border border-[color:var(--border)]/60 bg-[color:var(--glass-surface-bg)]/95 text-[color:var(--fg)] shadow-lg backdrop-blur supports-[backdrop-filter]:bg-[color:var(--glass-surface-bg)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
			aria-label={isOpen ? 'Close AI search assistant' : 'Open AI search assistant'}
			onClick={() => {
				if (isOpen) {
					closeChat();
				} else {
					openChat();
				}
			}}
		>
			<svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
				{isOpen ? (
					<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
				) : (
					<path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 3h5.5M21 11.5c0 4.418-4.03 8-9 8-1.15 0-2.26-.19-3.29-.54L3 21l1.1-3.3A8.35 8.35 0 0 1 3 11.5c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
				)}
			</svg>
		</button>
	);
}
