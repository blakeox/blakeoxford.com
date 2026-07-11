import { useCallback } from 'react';
import type { ChatMessage, ChatState, LoadingPhase, MutableRef } from '../chat';
import { enhanceQuery, getPageContext } from '../chat';
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
	/** Setter to reveal the "Jump to latest" button when user scrolls away */
	setShowScrollToLatest?: (show: boolean) => void;
	/** Function to append assistant message chunk */
	appendAssistantChunk: (assistantId: string, token: string) => void;
	/** Function to assign sources to assistant message */
	assignAssistantSources: (assistantId: string, sources: any[]) => void;
	/** Function to assign Cloudflare provenance metadata */
	assignAssistantProvenance: (assistantId: string, provenance: NonNullable<ChatMessage['provenance']>) => void;
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
	handleSubmit: (event: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
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
		setShowScrollToLatest,
		assignAssistantSources,
		assignAssistantProvenance,
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
			const pageContext = getPageContext();

			// Progressive loading phases — advance on real Cloudflare pipeline signals
			const searchingTimer = setTimeout(() => setLoadingPhase('analyzing'), 1500);
			const analyzingTimer = setTimeout(() => setLoadingPhase('crafting'), 4000);
			let sawMeta = false;
			let sawSources = false;

			try {
				const result = await searchWithAI(enhancedQuery, {
					history: historyPayload,
					pageContext,
					signal: controller.signal,
						onToken: (() => {
							let lastScrollAt = 0;
							const THROTTLE_MS = 120;
							const BOTTOM_THRESHOLD = 120; // px
							let firstToken = true;

							return (token: string) => {
								if (firstToken) {
									firstToken = false;
									clearTimeout(searchingTimer);
									setLoadingPhase(sawSources ? 'crafting' : 'analyzing');
								}
								appendAssistantChunk(assistantId, token);
								const el = scrollContainerRef.current;
								if (!el) return;

								const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
								const now = Date.now();
								if (atBottom) {
									if (now - lastScrollAt > THROTTLE_MS) {
										lastScrollAt = now;
										try {
											el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
										} catch {
											el.scrollTop = el.scrollHeight;
										}
									}
								} else {
									try {
										setShowScrollToLatest?.(true);
									} catch {
										// ignore if setter not provided
									}
								}
							};
						})(),
					onSources: (sources) => {
						sawSources = true;
						assignAssistantSources(assistantId, sources);
						clearTimeout(analyzingTimer);
						setLoadingPhase('crafting');
					},
					onMeta: (meta) => {
						sawMeta = true;
						assignAssistantProvenance(assistantId, meta);
						clearTimeout(searchingTimer);
						setLoadingPhase(meta.provider === 'workers-ai' ? 'crafting' : 'analyzing');
						if (meta.provider) {
							autoragEvents.responseMeta({
								provider: meta.provider,
								cache_status: meta.cacheStatus ?? 'unknown',
								complexity: meta.complexity ?? 'unknown',
							});
						}
					},
					onCompletion: async (message) => {
						await finalizeAssistantMessage(assistantId, message.trim());
					},
				});
				if (result.meta) {
					assignAssistantProvenance(assistantId, result.meta);
				}
				clearTimeout(searchingTimer);
				clearTimeout(analyzingTimer);
				setStreamingMessageId(null);
				setLoadingPhase(null);
				setChatState('ready');
				// Only surface Vectorize fallback when the answer has no citations.
				if ((result.sources?.length ?? 0) === 0) {
					await updateFallbackSuggestions(query);
				} else {
					setFallbackResults([]);
				}
				void sawMeta;
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

				const errorInfo = categorizeError(err);
				const shouldRetry =
					errorInfo.category !== 'rate-limit' && errorInfo.retryable && retryCount < 2;

				if (shouldRetry) {
					const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
					setError(
						`${errorInfo.userMessage} Retrying in ${Math.ceil(delay / 1000)}s... (${retryCount + 1}/2)`,
					);
					setRetryCount((prev) => prev + 1);
					setLastFailedQuery(query);

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

				setError(errorInfo.userMessage);
				setRetryCount(0);
				setLastFailedQuery(errorInfo.category === 'rate-limit' ? '' : query);

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
			assignAssistantProvenance,
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
			setShowScrollToLatest,
		],
	);

	/**
	 * Handle form submission
	 * Prevents default, validates input, clears field, and sends query
	 */
	const handleSubmit = useCallback(
		async (event: React.SubmitEvent<HTMLFormElement>) => {
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
