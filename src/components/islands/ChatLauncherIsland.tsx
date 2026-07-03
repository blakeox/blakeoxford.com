import { useEffect, useState } from 'react';

/**
 * ChatLauncherIsland
 * A tiny interactive island that hydrates on load and toggles the
 * shared chat wrapper/panel visibility. This replaces the previous
 * inline fallback script and follows best-practice hydration.
 */
export default function ChatLauncherIsland() {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		try {
			try {
				(window as Window & { __ai_chat_hydrated?: boolean }).__ai_chat_hydrated = true;
			} catch {
				/* noop */
			}
		} catch {
			/* noop */
		}

		try {
			const launcher = document.querySelector('.ai-chat-launcher');
			const wrapper = launcher?.closest('[data-ai-chat-open]') as HTMLElement | null;
			const panel = document.querySelector('[data-ai-chat-panel]') as HTMLElement | null;
			if (!launcher || !panel || !wrapper) return;

			function setOpen(open: boolean) {
				setIsOpen(open);
				wrapper!.setAttribute('data-ai-chat-open', open ? 'true' : 'false');
				launcher!.setAttribute('aria-expanded', open ? 'true' : 'false');
				if (open) wrapper!.classList.remove('pointer-events-none');
				else wrapper!.classList.add('pointer-events-none');
				panel!.setAttribute('data-ai-visible', open ? 'true' : 'false');
				if (open) {
					panel!.classList.remove('pointer-events-none', 'translate-y-4', 'opacity-0');
					panel!.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
					const composer = panel!.querySelector('textarea, input') as HTMLElement | null;
					if (composer && typeof composer.focus === 'function') {
						try {
							(launcher as HTMLElement).blur();
						} catch {
							/* noop */
						}

						const attempts = [0, 10, 50, 150];
						attempts.forEach((delay) => {
							setTimeout(() => {
								try {
									composer.focus();
								} catch {
									/* noop */
								}
							}, delay);
						});
						try {
							requestAnimationFrame(() => {
								try {
									composer.focus();
								} catch {
									/* noop */
								}
							});
						} catch {
							/* noop */
						}
					}
				} else {
					panel!.classList.add('pointer-events-none', 'translate-y-4', 'opacity-0');
					panel!.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
				}
				try {
					window.dispatchEvent(new CustomEvent('ai-chat:state', { detail: { open } }));
				} catch {
					/* noop */
				}
			}

			const onStateEvent = (e: Event) => {
				const detail = (e as CustomEvent)?.detail;
				if (detail && typeof detail.open === 'boolean') {
					setIsOpen(detail.open);
					launcher!.setAttribute('aria-expanded', detail.open ? 'true' : 'false');
				}
			};

			const clickHandler = (e: Event) => {
				e.preventDefault();
				const open = wrapper!.getAttribute('data-ai-chat-open') !== 'true';
				setOpen(open);
			};

			window.addEventListener('ai-chat:state', onStateEvent);
			launcher.addEventListener('click', clickHandler, { passive: false });
			return () => {
				window.removeEventListener('ai-chat:state', onStateEvent);
				launcher.removeEventListener('click', clickHandler);
			};
		} catch (err) {
			console.warn('ChatLauncherIsland init failed', err);
		}
	}, []);

	return (
		<button
			className={`ai-chat-launcher touch-target focus-ring-interactive pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border bg-[color:var(--glass-surface-bg)]/95 text-foreground shadow-lg backdrop-blur transition hover:shadow-xl supports-[backdrop-filter]:bg-[color:var(--glass-surface-bg)]/90 ${
				isOpen ? 'border-accent/50 ring-2 ring-accent/25' : 'border-border/60'
			}`}
			aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant — conversational chat'}
			aria-expanded={isOpen}
			type="button"
		>
			{isOpen ? (
				<svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
					<path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
				</svg>
			) : (
				<svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
					<path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 3h5.5M21 11.5c0 4.418-4.03 8-9 8-1.15 0-2.26-.19-3.29-.54L3 21l1.1-3.3A8.35 8.35 0 0 1 3 11.5c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
				</svg>
			)}
		</button>
	);
}
