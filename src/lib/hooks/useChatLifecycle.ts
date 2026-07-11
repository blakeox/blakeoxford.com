/**
 * Chat Lifecycle Hook
 * 
 * Custom React hook for managing chat panel lifecycle operations.
 * Provides functions to open, close, and manage focus for chat interfaces.
 * 
 * @module hooks/useChatLifecycle
 */

import { useCallback, type RefObject } from 'react';
import type { ChatState } from '../chat/chat-types';

export interface UseChatLifecycleOptions {
	/** Whether chat is currently open */
	isOpen: boolean;
	/** Callback to set open state */
	setIsOpen: (open: boolean) => void;
	/** Callback to set error state */
	setError: (error: string | null) => void;
	/** Callback to set chat state */
	setChatState: (state: ChatState | ((prev: ChatState) => ChatState)) => void;
	/** Whether voice recognition is active */
	isListening: boolean;
	/** Function to toggle voice recognition */
	toggleListening: () => void;
	/** Reference to input element */
	inputRef: RefObject<HTMLTextAreaElement | null>;
	/** Reference to last focused element before opening */
	lastFocusedElementRef: RefObject<HTMLElement | null>;
}

export interface UseChatLifecycleReturn {
	/** Opens the chat panel */
	openChat: () => void;
	/** Closes the chat panel */
	closeChat: () => void;
	/** Focuses the input field */
	focusInput: () => void;
	/** Dispatches chat state event */
	dispatchState: (open: boolean) => void;
}

/**
 * Custom hook for managing chat panel lifecycle
 * 
 * Provides comprehensive lifecycle management for chat interfaces including:
 * - Opening and closing the panel
 * - Focus management
 * - State synchronization
 * - Event dispatching
 * 
 * Features:
 * - Automatic focus restoration on close
 * - Voice recognition cleanup
 * - Custom event dispatching
 * - Input focus with cursor positioning
 * - State management integration
 * 
 * Common use cases:
 * - Chat panels and overlays
 * - Modal dialogs with chat
 * - Command palette interfaces
 * - Search overlays
 * 
 * @example
 * ```tsx
 * const { openChat, closeChat, focusInput } = useChatLifecycle({
 *   isOpen,
 *   setIsOpen,
 *   setError,
 *   setChatState,
 *   isListening,
 *   toggleListening,
 *   inputRef,
 *   lastFocusedElementRef,
 * });
 * ```
 * 
 * @param options - Configuration options
 * @returns Chat lifecycle functions
 */
export function useChatLifecycle(
	options: UseChatLifecycleOptions
): UseChatLifecycleReturn {
	const {
		isOpen,
		setIsOpen,
		setError,
		setChatState,
		isListening,
		toggleListening,
		inputRef,
		lastFocusedElementRef,
	} = options;

	/**
	 * Dispatches custom event for chat state changes
	 * Allows external components to listen for chat open/close
	 */
	const dispatchState = useCallback((open: boolean) => {
		if (typeof window === 'undefined') return;
		window.dispatchEvent(new CustomEvent('ai-chat:state', { detail: { open } }));
	}, []);

	/**
	 * Focuses the input field with cursor at end
	 * Uses requestAnimationFrame for reliable focus
	 * Sets data-ai-chat-focused attribute for deterministic testing
	 */
	const focusInput = useCallback(() => {
		if (!inputRef.current) return;
		requestAnimationFrame(() => {
			const inputEl = inputRef.current!;
			inputEl.focus();
			inputEl.setSelectionRange(
				inputEl.value.length,
				inputEl.value.length
			);
			
			// Set deterministic focus signal for accessibility testing
			if (document.activeElement === inputEl) {
				const panel = inputEl.closest('[data-ai-chat-panel]') as HTMLElement | null;
				if (panel) {
					panel.setAttribute('data-ai-chat-focused', 'true');
					window.dispatchEvent(new CustomEvent('ai-chat:focused', { detail: { focused: true } }));
				}
			}
		});
	}, [inputRef]);

	/**
	 * Opens the chat panel
	 * - Stores current focused element for restoration
	 * - Sets open state
	 * - Clears errors
	 * - Updates chat state from idle to ready
	 * - Focuses input if already open
	 */
	const openChat = useCallback(() => {
		if (isOpen) {
			focusInput();
			return;
		}
		lastFocusedElementRef.current = (document.activeElement as HTMLElement | null) ?? null;
		setIsOpen(true);
		setError(null);
		setChatState((state) => (state === 'idle' ? 'ready' : state));
		dispatchState(true);

		// Ensure the input is focused shortly after opening.
		// Use a small timeout to allow downstream refs to be assigned
		// during React hydration/mount.
		try {
			setTimeout(() => {
				focusInput();
			}, 50);
		} catch (e) {
			// non-fatal
		}
	}, [dispatchState, focusInput, isOpen, setIsOpen, setError, setChatState, lastFocusedElementRef]);

	/**
	 * Closes the chat panel
	 * - Stops voice recognition if active
	 * - Sets closed state
	 * - Clears errors
	 * - Restores focus to previous element
	 */
	const closeChat = useCallback(() => {
		if (!isOpen) return;
		if (isListening) {
			toggleListening(); // Stop voice recognition when closing
		}
		setIsOpen(false);
		setError(null);
		dispatchState(false);
		if (lastFocusedElementRef.current && typeof lastFocusedElementRef.current.focus === 'function') {
			requestAnimationFrame(() => {
				lastFocusedElementRef.current?.focus();
			});
		}
	}, [dispatchState, isListening, isOpen, toggleListening, setIsOpen, setError, lastFocusedElementRef]);

	return {
		openChat,
		closeChat,
		focusInput,
		dispatchState,
	};
}
