import { useCallback } from 'react';
import type { ChatMessage, ChatState, LoadingPhase, MutableRef } from '../chat';
import { enhanceQuery } from '../chat';
import { searchWithAI } from '../ai-search';
import { autoragEvents } from '../analytics';
import { createId } from '../string-utils';
import { categorizeError } from '../error-utils';

/**
 * Options for the query management hook
 */
interface UseQueryManagementOptions {
	/** Current chat state */
	chatState: ChatState;
	/** Function to update chat state */
	setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
	/** Function to update loading phase */
	setLoadingPhase: React.Dispatch<React.SetStateAction<LoadingPhase>>;
	/** Function to update error message */
	setError: React.Dispatch<React.SetStateAction<string | null>>;
	/** Function to update messages */
	setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
	/** Function to update streaming message ID */
	setStreamingMessageId: React.Dispatch<React.SetStateAction<string | null>>;
	/** Function to update fallback results */
	setFallbackResults: React.Dispatch<React.SetStateAction<any[]>>;
	/** Function to update retry count */
	setRetryCount: React.Dispatch<React.SetStateAction<number>>;
	/** Function to update last failed query */
	setLastFailedQuery: React.Dispatch<React.SetStateAction<string>>;
	/** Current retry count */
	retryCount: number;
	/** Whether to use memory/history */
	useMemory: boolean;
	/** Reference to last query */
	lastQueryRef: MutableRef<string | null>;
	/** Reference to messages for history building */
	messagesRef: MutableRef<ChatMessage[]>;
	/** Reference to active request controller */
	activeRequestRef: MutableRef<AbortController | null>;
	/** Reference to scroll container */
	scrollContainerRef: MutableRef<HTMLDivElement | null>;
	/** Function to append assistant message chunk */
	appendAssistantChunk: (assistantId: string, token: string) => void;
	/** Function to assign sources to assistant message */
	assignAssistantSources: (assistantId: string, sources: any[]) => void;
	/** Function to finalize assistant message */
	finalizeAssistantMessage: (assistantId: string, message: string) => Promise<void>;
	/** Function to build history for request */
	buildHistoryForRequest: (messages: ChatMessage[], useMemory: boolean) => any[];
	/** Function to update fallback suggestions */
	updateFallbackSuggestions: (query: string) => Promise<void>;
}

/**
 * Return type for the query management hook
 */
interface UseQueryManagementReturn {
	/** Send a query to the AI */
	sendQuery: (query: string) => Promise<void>;
	/** Handle form submission */
	handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
	/** Handle replaying a query */
	handleReplayQuery: (query: string) => Promise<void>;
	/** Handle guided prompt selection */
	handleGuidedPrompt: (prompt: string) => void;
}

/**
 * Custom hook for query management and AI interaction
 * 
 * Manages the complete query lifecycle including:
 * - Query submission and message creation
 * - AI API communication with streaming responses
 * - Progressive loading phases for UX feedback
 * - Error handling with automatic retry logic
 * - Fallback suggestions generation
 * - Request cancellation and cleanup
 * 
 * This hook consolidates all query-related logic that was previously
 * in the main component, providing a clean interface for AI interactions.
 * 
 * @param options - Configuration including state setters and refs
 * @returns Query management functions
 * 
 * @example
 * ```tsx
 * const { sendQuery, handleSubmit, handleReplayQuery, handleGuidedPrompt } = useQueryManagement({
 *   chatState,
 *   setChatState,
 *   setLoadingPhase,
 *   // ... other options
 * });
 * 
 * // Use in UI
 * <form onSubmit={handleSubmit}>
 *   <input value={inputValue} onChange={e => setInputValue(e.target.value)} />
 * </form>
 * <button onClick={() => handleGuidedPrompt("Tell me about...")}>Guided Prompt</button>
 * ```
 */
export function useQueryManagement(
	options: UseQueryManagementOptions & {
		inputValue: string;
		setInputValue: React.Dispatch<React.SetStateAction<string>>;
		openChat: () => void;
		focusInput: () => void;
	}
): UseQueryManagementReturn {
	const {
		chatState,
		setChatState,
		setLoadingPhase,
		setError,
		setMessages,
		setStreamingMessageId,
		setFallbackResults,
		setRetryCount,
		setLastFailedQuery,
		retryCount,
		useMemory,
		lastQueryRef,
		messagesRef,
		activeRequestRef,
		scrollContainerRef,
		appendAssistantChunk,
		assignAssistantSources,
		finalizeAssistantMessage,
		buildHistoryForRequest,
		updateFallbackSuggestions,
		inputValue,
		setInputValue,
		openChat,
		focusInput,
	} = options;

	/**
	 * Send a query to the AI
	 * Handles the complete request lifecycle from message creation to response streaming
	 */
	const sendQuery = useCallback(
		async (query: string) => {
			setChatState('loading');
			setLoadingPhase('searching');
			setError(null);
			setFallbackResults([]);
			lastQueryRef.current = query;

			// Create user message
			const userMessage: ChatMessage = {
				id: createId(),
				role: 'user',
				content: query,
				timestamp: Date.now(),
			};
			const assistantId = createId();

			// Add messages to state
			setMessages((prev) => [
				...prev,
				userMessage,
				{
					id: assistantId,
					role: 'assistant',
					content: '',
					sources: [],
					timestamp: Date.now(),
				},
			]);
			setStreamingMessageId(assistantId);

			// Setup request cancellation
			const controller = new AbortController();
			if (activeRequestRef.current) {
				activeRequestRef.current.abort();
			}
			activeRequestRef.current = controller;

			const historyPayload = buildHistoryForRequest(messagesRef.current, useMemory);

			// Enhance the query with analytical context to guide better responses
			const enhancedQuery = useMemory ? enhanceQuery(query, historyPayload.length > 0) : query;

			// Progressive loading phases for user feedback
			const searchingTimer = setTimeout(() => setLoadingPhase('analyzing'), 1500);
			const analyzingTimer = setTimeout(() => setLoadingPhase('crafting'), 4000);

			try {
				await searchWithAI(enhancedQuery, {
					history: historyPayload,
					signal: controller.signal,
					onToken: (token) => {
						appendAssistantChunk(assistantId, token);
						if (scrollContainerRef.current) {
							scrollContainerRef.current.scrollTo({
								top: scrollContainerRef.current.scrollHeight,
							});
						}
					},
					onSources: (sources) => {
						assignAssistantSources(assistantId, sources);
						setLoadingPhase('crafting');
					},
					onCompletion: async (message) => {
						await finalizeAssistantMessage(assistantId, message.trim());
					},
				});
				clearTimeout(searchingTimer);
				clearTimeout(analyzingTimer);
				setStreamingMessageId(null);
				setLoadingPhase(null);
				setChatState('ready');
				await updateFallbackSuggestions(query);
			} catch (err) {
				clearTimeout(searchingTimer);
				clearTimeout(analyzingTimer);
				if (controller.signal.aborted) {
					setLoadingPhase(null);
					return;
				}
				setStreamingMessageId(null);
				setLoadingPhase(null);
				setChatState('ready');
				setMessages((prev) => prev.filter((message) => message.id !== assistantId));

				// Enhanced error categorization and recovery
				const errorInfo = categorizeError(err);
				const shouldRetry = errorInfo.retryable && retryCount < 2;

				if (shouldRetry) {
					// Auto-retry with exponential backoff
					const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
					setError(
						`${errorInfo.message} Retrying in ${Math.ceil(delay / 1000)}s... (${retryCount + 1}/2)`,
					);
					setRetryCount((prev) => prev + 1);
					setLastFailedQuery(query);

					// Track retry attempt
					autoragEvents.errorRetry({
						category: errorInfo.category,
						attempt: retryCount + 1,
					});
					setTimeout(() => {
						if (lastQueryRef.current === query) {
							sendQuery(query);
						}
					}, delay);
					return;
				}

				// Max retries reached or non-retryable error
				setError(errorInfo.message);
				setRetryCount(0);
				setLastFailedQuery('');

				// Track error
				autoragEvents.error({
					category: errorInfo.category,
					severity: 'error',
					retry_available: errorInfo.retryable,
				});

				await updateFallbackSuggestions(query);
			} finally {
				activeRequestRef.current = null;
			}
		},
		[
			appendAssistantChunk,
			assignAssistantSources,
			buildHistoryForRequest,
			finalizeAssistantMessage,
			updateFallbackSuggestions,
			useMemory,
			retryCount,
			setChatState,
			setLoadingPhase,
			setError,
			setFallbackResults,
			lastQueryRef,
			setMessages,
			setStreamingMessageId,
			activeRequestRef,
			messagesRef,
			scrollContainerRef,
			setRetryCount,
			setLastFailedQuery,
		],
	);

	/**
	 * Handle form submission
	 * Prevents default, validates input, clears field, and sends query
	 */
	const handleSubmit = useCallback(
		async (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const query = inputValue.trim();
			if (!query || chatState === 'loading') return;
			setInputValue('');
			await sendQuery(query);
		},
		[chatState, inputValue, sendQuery, setInputValue],
	);

	/**
	 * Handle replaying a previous query
	 * Used for retry and fallback suggestions
	 */
	const handleReplayQuery = useCallback(
		async (query: string) => {
			if (!query || chatState === 'loading') return;
			setInputValue('');
			await sendQuery(query);
		},
		[chatState, sendQuery, setInputValue],
	);

	/**
	 * Handle guided prompt selection
	 * Sets input value, opens chat, and focuses input
	 */
	const handleGuidedPrompt = useCallback(
		(prompt: string) => {
			setInputValue(prompt);
			openChat();
			focusInput();
		},
		[focusInput, openChat, setInputValue],
	);

	return {
		sendQuery,
		handleSubmit,
		handleReplayQuery,
		handleGuidedPrompt,
	};
}
