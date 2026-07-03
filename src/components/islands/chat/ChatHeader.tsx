/**
 * ChatHeader component
 * Slim header with search, overflow menu, and close
 */
import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { openCommandCenter } from '../../../features/command-center/lib/commandEvents';
import type { ChatHeaderProps } from './types';

function MenuButton({
	children,
	onClick,
	disabled,
}: {
	children: ReactNode;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			role="menuitem"
			disabled={disabled}
			className="focus-ring-interactive flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
			onClick={onClick}
		>
			{children}
		</button>
	);
}

type MenuPosition = {
	top: number;
	right: number;
};

export const ChatHeader = memo(function ChatHeader({
	wsConnected,
	activeUsers,
	voiceSupported,
	isListening,
	showAdvancedControls,
	useMemory,
	canStartNewChat,
	hasMessages,
	toggleVoiceInput,
	toggleAdvancedControls,
	toggleMemory,
	clearConversation,
	handleExportConversation,
	startNewChat,
	closeChat,
}: ChatHeaderProps) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const toggleRef = useRef<HTMLButtonElement>(null);
	const ignoreNextOutsideClickRef = useRef(false);

	const syncMenuPosition = () => {
		const toggle = toggleRef.current;
		if (!toggle) return;
		const rect = toggle.getBoundingClientRect();
		setMenuPosition({
			top: rect.bottom + 6,
			right: Math.max(8, window.innerWidth - rect.right),
		});
	};

	useEffect(() => {
		if (!menuOpen) {
			setMenuPosition(null);
			return;
		}

		syncMenuPosition();
		const onResize = () => syncMenuPosition();
		window.addEventListener('resize', onResize);
		window.addEventListener('scroll', onResize, true);

		const onEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setMenuOpen(false);
		};
		const onDocClick = (event: MouseEvent) => {
			if (ignoreNextOutsideClickRef.current) {
				ignoreNextOutsideClickRef.current = false;
				return;
			}
			const target = event.target as Node;
			if (!menuRef.current?.contains(target) && !toggleRef.current?.contains(target)) {
				setMenuOpen(false);
			}
		};

		document.addEventListener('keydown', onEscape);
		document.addEventListener('click', onDocClick, true);

		return () => {
			window.removeEventListener('resize', onResize);
			window.removeEventListener('scroll', onResize, true);
			document.removeEventListener('keydown', onEscape);
			document.removeEventListener('click', onDocClick, true);
		};
	}, [menuOpen]);

	const closeMenu = () => setMenuOpen(false);

	const menuPanel =
		menuOpen && menuPosition && typeof document !== 'undefined'
			? createPortal(
					<div
						ref={menuRef}
						role="menu"
						className="fixed z-[1300] min-w-[11rem] overflow-hidden rounded-xl border border-border/60 bg-surface py-1 shadow-lg"
						style={{ top: menuPosition.top, right: menuPosition.right }}
					>
						{voiceSupported ? (
							<MenuButton
								onClick={() => {
									toggleVoiceInput();
									closeMenu();
								}}
							>
								{isListening ? 'Stop voice input' : 'Voice input'}
							</MenuButton>
						) : null}
						<MenuButton
							onClick={() => {
								toggleMemory();
							}}
						>
							{useMemory ? 'Memory on' : 'Memory off'}
						</MenuButton>
						<MenuButton
							onClick={() => {
								toggleAdvancedControls();
							}}
						>
							{showAdvancedControls ? 'Hide session settings' : 'Session settings'}
						</MenuButton>
						{canStartNewChat ? (
							<MenuButton
								onClick={() => {
									startNewChat();
									closeMenu();
								}}
							>
								Start new chat
							</MenuButton>
						) : null}
						<MenuButton
							disabled={!hasMessages}
							onClick={() => {
								handleExportConversation();
								closeMenu();
							}}
						>
							Export chat
						</MenuButton>
						<MenuButton
							disabled={!hasMessages}
							onClick={() => {
								clearConversation();
								closeMenu();
							}}
						>
							Clear chat
						</MenuButton>
					</div>,
					document.body,
				)
			: null;

	return (
		<div className="sticky top-0 z-20 flex items-center gap-2 overflow-visible border-b border-border/40 bg-surface-subtle/60 px-3 py-2.5 backdrop-blur-sm sm:px-4">
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span id="ai-chat-heading" className="truncate text-sm font-semibold text-foreground">
						AI Assistant
					</span>
					{isListening ? (
						<span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xxs font-medium text-accent">
							<span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
							Listening
						</span>
					) : wsConnected ? (
						<span className="inline-flex items-center gap-1 text-xxs text-muted-foreground" title="Real-time connected">
							<span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
							<span className="sr-only sm:not-sr-only">Live</span>
						</span>
					) : null}
				</div>
				{activeUsers > 1 ? (
					<p className="mt-0.5 truncate text-xxs text-muted-foreground">{activeUsers} online</p>
				) : null}
			</div>

			<div className="flex shrink-0 items-center gap-1">
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

				<div className="relative">
					<button
						ref={toggleRef}
						type="button"
						className={`focus-ring-interactive inline-flex size-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition hover:border-accent/60 hover:text-accent ${
							menuOpen || showAdvancedControls ? 'border-accent/50 bg-accent/10 text-accent' : ''
						}`}
						aria-label="Assistant options"
						aria-expanded={menuOpen}
						aria-haspopup="menu"
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							ignoreNextOutsideClickRef.current = true;
							setMenuOpen((open) => !open);
						}}
					>
						<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 12h.01M12 12h.01M18 12h.01" />
						</svg>
					</button>
				</div>

				{menuPanel}

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
