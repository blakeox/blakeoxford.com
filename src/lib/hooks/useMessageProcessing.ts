import { useCallback } from 'react';
import type { ChatMessage, MutableRef, SearchFallback } from '../chat';
import type { AIChatSource } from '../ai-search';
import {
	finalizeMessageQuality,
	removeStorageItem,
	CONVERSATION_STORAGE_KEY,
	SEMANTIC_SEARCH_URL,
	INITIAL_ASSISTANT_MESSAGE,
} from '../chat';
import { autoragEvents, conversionEvents } from '../analytics';

/**
 * Options for the message processing hook
 */
interface UseMessageProcessingOptions {
	/** Function to update messages state */
	setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
	/** Function to update error state */
	setError: React.Dispatch<React.SetStateAction<string | null>>;
	/** Function to update streaming message ID */
	setStreamingMessageId: React.Dispatch<React.SetStateAction<string | null>>;
	/** Function to update fallback results */
	setFallbackResults: React.Dispatch<React.SetStateAction<SearchFallback[]>>;
	/** Function to update input value */
	setInputValue: React.Dispatch<React.SetStateAction<string>>;
	/** Reference to messages for quality calculation */
	messagesRef: MutableRef<ChatMessage[]>;
	/** Reference to last query */
	lastQueryRef: MutableRef<string | null>;
	/** Whether digest is shown */
	showDigest: boolean;
	/** Whether analytics is shown */
	showAnalytics: boolean;
	/** Function to toggle digest */
	toggleDigest: () => void;
	/** Function to toggle analytics */
	toggleAnalytics: () => void;
	/** Function to set fallback suggestions visibility */
	setShowFallbackSuggestions: (show: boolean) => void;
	/** Function to set expanded sources */
	setExpandedSources: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
	/** Function to set composer focused state */
	setComposerFocused: (focused: boolean) => void;
	/** Function to set show scroll to latest */
	setShowScrollToLatest: (show: boolean) => void;
	/** Function to focus input */
	focusInput: () => void;
}

/**
 * Return type for the message processing hook
 */
interface UseMessageProcessingReturn {
	/** Update fallback suggestions using semantic search */
	updateFallbackSuggestions: (query: string) => Promise<void>;
	/** Append a chunk to streaming assistant message */
	appendAssistantChunk: (messageId: string, chunk: string) => void;
	/** Finalize assistant message with quality scores */
	finalizeAssistantMessage: (messageId: string, content: string) => Promise<void>;
	/** Assign sources to assistant message */
	assignAssistantSources: (messageId: string, sources: AIChatSource[]) => void;
	/** Assign Cloudflare provenance metadata to assistant message */
	assignAssistantProvenance: (messageId: string, provenance: NonNullable<ChatMessage['provenance']>) => void;
	/** Clear entire conversation */
	clearConversation: () => void;
	/** Start a new chat (alias for clearConversation) */
	startNewChat: () => void;
}

/**
 * Custom hook for message processing operations
 * 
 * Manages all message state mutations including:
 * - Streaming message updates with chunk appending
 * - Message quality finalization with scoring
 * - Source assignment to assistant messages
 * - Fallback suggestions via semantic search
 * - Conversation clearing and reset
 * 
 * This hook consolidates message processing logic that was previously
 * scattered throughout the component, providing a clean interface for
 * message state management.
 * 
 * @param options - Configuration including state setters and refs
 * @returns Message processing functions
 * 
 * @example
 * ```tsx
 * const {
 *   updateFallbackSuggestions,
 *   appendAssistantChunk,
 *   finalizeAssistantMessage,
 *   assignAssistantSources,
 *   clearConversation,
 *   startNewChat
 * } = useMessageProcessing({
 *   setMessages,
 *   setError,
 *   messagesRef,
 *   // ... other options
 * });
 * 
 * // Use in streaming
 * onToken: (token) => appendAssistantChunk(assistantId, token)
 * 
 * // Use in error handling
 * await updateFallbackSuggestions(query)
 * ```
 */
export function useMessageProcessing(
	options: UseMessageProcessingOptions,
): UseMessageProcessingReturn {
	const {
		setMessages,
		setError,
		setStreamingMessageId,
		setFallbackResults,
		setInputValue,
		messagesRef,
		lastQueryRef,
		showDigest,
		showAnalytics,
		toggleDigest,
		toggleAnalytics,
		setShowFallbackSuggestions,
		setExpandedSources,
		setComposerFocused,
		setShowScrollToLatest,
		focusInput,
	} = options;

	/**
	 * Update fallback suggestions using Vectorize semantic search
	 * Provides alternative content when AI queries fail
	 */
	const updateFallbackSuggestions = useCallback(
		async (query: string) => {
			const normalized = query.toLowerCase().trim();
			if (!normalized) {
				setFallbackResults([]);
				return;
			}

			// Use Vectorize semantic search instead of keyword matching
			try {
				const response = await fetch(SEMANTIC_SEARCH_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
					body: JSON.stringify({ query: normalized }),
				});

				if (!response.ok) {
					setFallbackResults([]);
					return;
				}

				const data = await response.json();

				// Transform Vectorize results to SearchFallback format
				if (data.results && Array.isArray(data.results)) {
					const ranked = data.results
						.slice(0, 6)
						.map(
							(result: {
								title?: string;
								id: string;
								url?: string;
								description?: string;
								score?: number;
							}) => ({
								title: result.title || result.id,
								url: result.url || `/${result.id}`,
								excerpt: result.description || '',
								score: result.score || 0,
							}),
						)
						.filter((result: { title: string; url: string; excerpt: string; score: number }) => result.score >= 0.62)
						.slice(0, 3);
					setFallbackResults(ranked);
				} else {
					setFallbackResults([]);
				}
			} catch (err) {
				console.error('Semantic search failed:', err);
				setFallbackResults([]);
			}
		},
		[setFallbackResults],
	);

	/**
	 * Append a chunk to streaming assistant message
	 * Used during real-time response streaming
	 */
	const appendAssistantChunk = useCallback(
		(messageId: string, chunk: string) => {
			if (!chunk) return;
			setMessages((prev) =>
				prev.map((message) =>
					message.id === messageId
						? {
								...message,
								content: `${message.content}${chunk}`,
							}
						: message,
				),
			);
		},
		[setMessages],
	);

	/**
	 * Finalize assistant message with content, quality score, and citation health
	 * Calculates quality metrics after streaming completes
	 */
	const finalizeAssistantMessage = useCallback(
		async (messageId: string, content: string) => {
			const message = messagesRef.current.find((m) => m.id === messageId);
			if (!message) return;

			// Get the user query that prompted this response
			const messageIndex = messagesRef.current.findIndex((m) => m.id === messageId);
			const userQuery =
				messageIndex > 0 ? messagesRef.current[messageIndex - 1]?.content || '' : '';

			// Calculate quality scores and update message
			const qualityUpdate = await finalizeMessageQuality(
				messageId,
				content,
				messagesRef.current,
				userQuery,
			);

			if (qualityUpdate) {
				setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...qualityUpdate } : m)));
			}
		},
		[messagesRef, setMessages],
	);

	/**
	 * Assign sources to assistant message
	 * Called when sources are received from AI API
	 */
	const assignAssistantSources = useCallback(
		(messageId: string, sources: AIChatSource[]) => {
			setMessages((prev) =>
				prev.map((message) =>
					message.id === messageId
						? {
								...message,
								sources,
							}
						: message,
				),
			);
		},
		[setMessages],
	);

	const assignAssistantProvenance = useCallback(
		(messageId: string, provenance: NonNullable<ChatMessage['provenance']>) => {
			setMessages((prev) =>
				prev.map((message) =>
					message.id === messageId
						? {
								...message,
								provenance,
							}
						: message,
				),
			);
		},
		[setMessages],
	);

	/**
	 * Clear entire conversation and reset all state
	 * Removes all messages, errors, and UI state
	 */
	const clearConversation = useCallback(() => {
		const prior = messagesRef.current ?? [];
		const userMessages = prior.filter((m) => m.role === 'user');
		const assistantMessages = prior.filter(
			(m) => m.role === 'assistant' && m.id !== INITIAL_ASSISTANT_MESSAGE.id,
		);
		if (userMessages.length > 0) {
			const scored = assistantMessages.filter((m) => typeof m.qualityScore === 'number');
			const avgQuality =
				scored.length > 0
					? scored.reduce((sum, m) => sum + (m.qualityScore ?? 0), 0) / scored.length
					: undefined;
			const totalSources = assistantMessages.reduce(
				(sum, m) => sum + (m.sources?.length ?? 0),
				0,
			);
			autoragEvents.chatInsights({
				total_messages: prior.length,
				user_messages: userMessages.length,
				assistant_messages: assistantMessages.length,
				total_sources: totalSources,
				avg_quality_score: avgQuality,
			});
			if (userMessages.length >= 2) {
				conversionEvents.chatEngagement({
					user_messages: userMessages.length,
					total_messages: prior.length,
				});
			}
		}

		setMessages([INITIAL_ASSISTANT_MESSAGE]);
		setError(null);
		setStreamingMessageId(null);
		setFallbackResults([]);
		if (showDigest) toggleDigest();
		if (showAnalytics) toggleAnalytics();
		setShowFallbackSuggestions(false);
		setExpandedSources({});
		setComposerFocused(false);
		setInputValue('');
		setShowScrollToLatest(false);
		lastQueryRef.current = null;
		removeStorageItem(CONVERSATION_STORAGE_KEY);
		requestAnimationFrame(() => {
			focusInput();
		});
	}, [
		focusInput,
		showDigest,
		showAnalytics,
		toggleDigest,
		toggleAnalytics,
		setShowFallbackSuggestions,
		setExpandedSources,
		setComposerFocused,
		setShowScrollToLatest,
		setMessages,
		setError,
		setStreamingMessageId,
		setFallbackResults,
		setInputValue,
		lastQueryRef,
		messagesRef,
	]);

	/**
	 * Start a new chat
	 * Alias for clearConversation for semantic clarity
	 */
	const startNewChat = useCallback(() => {
		clearConversation();
	}, [clearConversation]);

	return {
		updateFallbackSuggestions,
		appendAssistantChunk,
		finalizeAssistantMessage,
		assignAssistantSources,
		assignAssistantProvenance,
		clearConversation,
		startNewChat,
	};
}
