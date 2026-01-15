import { useCallback } from 'react';
import type { ChatState } from '../chat';

/**
 * Options for the input handlers hook
 */
interface UseInputHandlersOptions {
	/** Current chat state */
	chatState: ChatState;
	/** Whether voice is supported */
	voiceSupported: boolean;
	/** Function to update memory preference */
	setUseMemory: React.Dispatch<React.SetStateAction<boolean>>;
	/** Function to open chat panel */
	openChat: () => void;
	/** Function to toggle voice listening */
	toggleListening: () => void;
}

/**
 * Return type for the input handlers hook
 */
interface UseInputHandlersReturn {
	/** Toggle memory/history preference */
	toggleMemory: () => void;
	/** Toggle voice input and open chat */
	toggleVoiceInput: () => void;
	/** Handle textarea keydown for Enter key submission */
	handleTextareaKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

/**
 * Custom hook for input-related handlers and utilities
 * 
 * Manages input interaction handlers including:
 * - Memory preference toggling
 * - Voice input activation with chat opening
 * - Textarea keyboard event handling (Enter to submit)
 * 
 * This hook consolidates input-related utility functions that were
 * previously scattered in the component, providing a clean interface
 * for input interactions.
 * 
 * @param options - Configuration including chat state and functions
 * @returns Input handler functions
 * 
 * @example
 * ```tsx
 * const { toggleMemory, toggleVoiceInput, handleTextareaKeyDown } = useInputHandlers({
 *   chatState,
 *   voiceSupported,
 *   setUseMemory,
 *   openChat,
 *   toggleListening,
 * });
 * 
 * // Use in UI
 * <button onClick={toggleMemory}>Memory: {useMemory ? 'On' : 'Off'}</button>
 * <button onClick={toggleVoiceInput}>Voice Input</button>
 * <textarea onKeyDown={handleTextareaKeyDown} />
 * ```
 */
export function useInputHandlers(options: UseInputHandlersOptions): UseInputHandlersReturn {
	const { chatState, voiceSupported, setUseMemory, openChat, toggleListening } = options;

	/**
	 * Toggle memory/history preference
	 * Controls whether conversation history is included in AI queries
	 */
	const toggleMemory = useCallback(() => {
		setUseMemory((prev) => !prev);
	}, [setUseMemory]);

	/**
	 * Toggle voice input and open chat
	 * Opens chat panel and activates voice recognition if supported
	 */
	const toggleVoiceInput = useCallback(() => {
		if (!voiceSupported) return;
		openChat();
		toggleListening();
	}, [openChat, voiceSupported, toggleListening]);

	/**
	 * Handle textarea keydown events
	 * Submits form on Enter key (without modifiers)
	 * Allows Shift+Enter, Cmd+Enter, Ctrl+Enter, Alt+Enter for newlines
	 */
	const handleTextareaKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
			// Allow newlines with modifiers
			if (
				event.key !== 'Enter' ||
				event.shiftKey ||
				event.metaKey ||
				event.ctrlKey ||
				event.altKey
			) {
				return;
			}

			// Validate input
			const trimmed = event.currentTarget.value.trim();
			if (!trimmed || chatState === 'loading') {
				event.preventDefault();
				return;
			}

			// Submit form
			event.preventDefault();
			event.currentTarget.form?.requestSubmit();
		},
		[chatState],
	);

	return {
		toggleMemory,
		toggleVoiceInput,
		handleTextareaKeyDown,
	};
}
