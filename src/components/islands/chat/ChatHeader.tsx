/**
 * ChatHeader — Ask companion chrome with page-context pill.
 */
import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { OVERLAY_ICON_BUTTON } from '../../../features/overlay/overlayStyles';
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
	pageLabel = 'Site assistant',
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
						<MenuButton onClick={() => toggleMemory()}>
							{useMemory ? 'Memory on' : 'Memory off'}
						</MenuButton>
						<MenuButton onClick={() => toggleAdvancedControls()}>
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
		<div className="flex items-start gap-2 border-b border-border/40 px-3.5 pb-3 pt-2 sm:px-4 sm:pt-3.5">
			<div className="min-w-0 flex-1 space-y-1.5">
				<div className="flex items-center gap-2">
					<p id="ai-chat-heading" className="text-sm font-semibold tracking-tight text-foreground">
						Ask
					</p>
					{isListening ? (
						<span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xxs font-medium text-accent">
							<span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
							Listening
						</span>
					) : null}
				</div>
				<span
					className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/50 bg-surface-subtle/70 px-2.5 py-0.5 text-xxs text-muted-foreground"
					title={pageLabel}
				>
					<span className="size-1.5 shrink-0 rounded-full bg-accent/80" aria-hidden="true" />
					<span className="truncate">
						<span className="text-subtle-foreground">Viewing</span>{' '}
						<span className="font-medium text-foreground/85">{pageLabel}</span>
					</span>
				</span>
				<span className="sr-only">{wsConnected ? 'Live connection' : 'Offline'}</span>
				{activeUsers > 1 ? <span className="sr-only">{activeUsers} online</span> : null}
			</div>

			<div className="flex shrink-0 items-center gap-1 pt-0.5">
				<button
					ref={toggleRef}
					type="button"
					className={`${OVERLAY_ICON_BUTTON} ${
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

				{menuPanel}

				<button
					type="button"
					className="focus-ring-interactive inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-surface-subtle hover:text-foreground"
					aria-label="Close assistant"
					onClick={closeChat}
				>
					<svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M6 18L18 6" />
					</svg>
				</button>
			</div>
		</div>
	);
});

ChatHeader.displayName = 'ChatHeader';
