/**
 * Chat Storage Hook
 * 
 * Custom React hook for managing conversation and preferences persistence.
 * Handles automatic saving/loading of messages and user preferences.
 * 
 * @module hooks/useChatStorage
 */

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../chat-types';
import {
	getStorageItem,
	setStorageItem,
} from '../storage-utils';
import { restoreMessages } from '../message-validation';
import {
	CONVERSATION_STORAGE_KEY,
	PREFERENCES_STORAGE_KEY,
} from '../chat-constants';

export interface UseChatStorageOptions {
	/** Current conversation messages */
	messages: ChatMessage[];
	/** Whether to use conversation memory */
	useMemory: boolean;
	/** Callback to set restored messages */
	onMessagesRestored?: (messages: ChatMessage[]) => void;
	/** Maximum number of messages to restore */
	maxRestoreMessages?: number;
}

export interface UseChatStorageReturn {
	/** Whether messages have been hydrated from storage */
	isHydrated: boolean;
}

/**
 * Custom hook for managing chat storage and persistence
 * 
 * Automatically handles:
 * - Loading saved conversations on mount
 * - Persisting messages to localStorage on change
 * - Saving user preferences (memory setting)
 * - Hydration tracking to prevent double-saves
 * 
 * Features:
 * - Automatic conversation restore on mount
 * - Message validation and sanitization
 * - Preference persistence
 * - Hydration flag to prevent initial save
 * - Configurable message restoration limit
 * - Server-side rendering safe
 * 
 * @param options - Configuration for chat storage
 * @returns Storage state and utilities
 * 
 * @example
 * ```tsx
 * const { isHydrated } = useChatStorage({
 *   messages,
 *   useMemory,
 *   onMessagesRestored: setMessages,
 *   maxRestoreMessages: 30
 * });
 * ```
 */
export function useChatStorage(
	options: UseChatStorageOptions
): UseChatStorageReturn {
	const {
		messages,
		useMemory,
		onMessagesRestored,
		maxRestoreMessages = 30,
	} = options;

	const conversationHydratedRef = useRef(false);

	// Restore conversation from storage on mount
	useEffect(() => {
		const stored = getStorageItem(CONVERSATION_STORAGE_KEY, null);
		if (!stored) {
			conversationHydratedRef.current = true;
			return;
		}

		const restored = restoreMessages(stored, maxRestoreMessages);
		if (restored.length > 0 && onMessagesRestored) {
			onMessagesRestored(restored);
		}
		conversationHydratedRef.current = true;
	}, [maxRestoreMessages, onMessagesRestored]); // Only run on mount

	// Persist messages to storage when they change (after hydration)
	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (!conversationHydratedRef.current) {
			return;
		}
		setStorageItem(CONVERSATION_STORAGE_KEY, messages);
	}, [messages]);

	// Persist preferences when memory setting changes
	useEffect(() => {
		if (typeof window === 'undefined') return;
		setStorageItem(PREFERENCES_STORAGE_KEY, { useMemory });
	}, [useMemory]);

	return {
		isHydrated: conversationHydratedRef.current,
	};
}
