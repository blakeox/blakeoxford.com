import { useEffect, useState } from 'react';

import { cn } from '../../utils/cn';
import {
	CHAT_LAUNCHER_BASE,
	CHAT_LAUNCHER_CLOSED,
	CHAT_LAUNCHER_OPEN,
} from '../../features/chat/chatStyles';

/**
 * ChatLauncherIsland — accent FAB that opens the corner Ask companion.
 */
export default function ChatLauncherIsland() {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		try {
			(window as Window & { __ai_chat_hydrated?: boolean }).__ai_chat_hydrated = true;
		} catch {
			/* noop */
		}

		const onStateEvent = (e: Event) => {
			const detail = (e as CustomEvent)?.detail;
			if (detail && typeof detail.open === 'boolean') {
				setIsOpen(detail.open);
			}
		};

		window.addEventListener('ai-chat:state', onStateEvent);
		return () => window.removeEventListener('ai-chat:state', onStateEvent);
	}, []);

	const toggle = () => {
		const next = !isOpen;
		setIsOpen(next);
		window.dispatchEvent(new CustomEvent('ai-chat:state', { detail: { open: next } }));
	};

	return (
		<div className="pointer-events-none fixed bottom-4 right-4 z-chat-launcher sm:bottom-6 sm:right-6">
			<button
				className={cn(CHAT_LAUNCHER_BASE, isOpen ? CHAT_LAUNCHER_OPEN : CHAT_LAUNCHER_CLOSED)}
				aria-label={isOpen ? 'Close Ask' : 'Open Ask — AI assistant'}
				aria-expanded={isOpen}
				type="button"
				onClick={toggle}
			>
				{isOpen ? (
					<svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
					</svg>
				) : (
					<svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 3h5.5M21 11.5c0 4.418-4.03 8-9 8-1.15 0-2.26-.19-3.29-.54L3 21l1.1-3.3A8.35 8.35 0 0 1 3 11.5c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
					</svg>
				)}
			</button>
		</div>
	);
}
