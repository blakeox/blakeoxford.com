/**
 * Keyboard Shortcuts Hook
 * 
 * Custom React hook for managing keyboard shortcuts and event handling.
 * Provides centralized keyboard interaction management for complex components.
 * 
 * @module hooks/useKeyboardShortcuts
 */

import { useEffect, type RefObject } from 'react';

export interface UseKeyboardShortcutsOptions {
	/** Whether keyboard shortcuts are enabled */
	enabled: boolean;
	/** Callback to open the interface */
	onOpen?: () => void;
	/** Callback to close the interface */
	onClose?: () => void;
	/** Callback to toggle open/close state */
	onToggle?: () => void;
	/** Reference to the panel element for scoped event handling */
	panelRef?: RefObject<HTMLElement | null>;
	/** Array of focusable source elements for arrow key navigation */
	sourceRefs?: RefObject<(HTMLElement | null)[]>;
}

/**
 * Custom hook for managing keyboard shortcuts and interactions
 * 
 * Handles various keyboard events including:
 * - Global shortcuts (Cmd/Ctrl+K, / to open)
 * - Escape key to close
 * - Arrow key navigation through focusable elements
 * - Outside click detection
 * 
 * Features:
 * - Platform-aware shortcuts (Cmd on Mac, Ctrl on Windows/Linux)
 * - Scoped event handling (panel-level and document-level)
 * - Automatic cleanup of event listeners
 * - Keyboard navigation support
 * - Enable/disable control
 * 
 * Common use cases:
 * - Modal dialogs with Escape to close
 * - Command palette interfaces (Cmd/Ctrl+K)
 * - Search overlays with keyboard shortcuts
 * - Panels with arrow key navigation
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   enabled: isOpen,
 *   onOpen: openChat,
 *   onClose: closeChat,
 *   onToggle: toggleChat,
 *   panelRef,
 *   sourceRefs,
 * });
 * ```
 * 
 * @param options - Configuration options
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
	const {
		enabled,
		onOpen,
		onClose,
		onToggle,
		panelRef,
		sourceRefs,
	} = options;

	// Global shortcuts: Cmd/Ctrl+K and / to open
	useEffect(() => {
		if (!onOpen) return;

		const handleShortcut = (event: KeyboardEvent) => {
			const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
			const platformSource = uaData?.platform ?? navigator.userAgent;
			const isMac = /mac/i.test(platformSource);
			const metaPressed = isMac ? event.metaKey : event.ctrlKey;
			const isSlash = event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey;

			if ((metaPressed && event.key.toLowerCase() === 'k') || isSlash) {
				event.preventDefault();
				onOpen();
			}
		};

		window.addEventListener('keydown', handleShortcut);
		return () => window.removeEventListener('keydown', handleShortcut);
	}, [onOpen]);

	// Open/toggle custom events
	useEffect(() => {
		if (!onOpen && !onToggle) return;

		const handleOpen = onOpen ? () => onOpen() : undefined;
		const handleToggle = onToggle ? () => onToggle() : undefined;

		if (handleOpen) {
			window.addEventListener('ai-chat:open', handleOpen as EventListener);
		}
		if (handleToggle) {
			window.addEventListener('ai-chat:toggle', handleToggle as EventListener);
		}

		return () => {
			if (handleOpen) {
				window.removeEventListener('ai-chat:open', handleOpen as EventListener);
			}
			if (handleToggle) {
				window.removeEventListener('ai-chat:toggle', handleToggle as EventListener);
			}
		};
	}, [onOpen, onToggle]);

	// Escape key to close
	useEffect(() => {
		if (!enabled || !onClose) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				onClose();
			}
		};

		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [enabled, onClose]);

	// Outside click to close
	useEffect(() => {
		if (!enabled || !onClose || !panelRef?.current) return;

		const handleClick = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (!panelRef.current || !target) return;
			if (!panelRef.current.contains(target)) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [enabled, onClose, panelRef]);

	// Arrow key navigation through focusable elements
	useEffect(() => {
		if (!enabled || !panelRef?.current || !sourceRefs?.current) return;

		const panel = panelRef.current;
		const handleKey = (event: KeyboardEvent) => {
			if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
				return;
			}

			const focusable = sourceRefs.current?.filter(
				(element) => element && element.isConnected
			) ?? [];

			if (focusable.length === 0) return;

			const active = document.activeElement;
			const currentIndex = focusable.findIndex((element) => element === active);
			let nextIndex: number;

			if (event.key === 'ArrowDown') {
				nextIndex = currentIndex >= 0 ? (currentIndex + 1) % focusable.length : 0;
			} else if (currentIndex <= 0) {
				nextIndex = focusable.length - 1;
			} else {
				nextIndex = (currentIndex - 1 + focusable.length) % focusable.length;
			}

			focusable[nextIndex]?.focus();
			event.preventDefault();
		};

		panel.addEventListener('keydown', handleKey);
		return () => panel.removeEventListener('keydown', handleKey);
	}, [enabled, panelRef, sourceRefs]);
}
