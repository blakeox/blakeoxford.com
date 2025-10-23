import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AIChatSource } from '../../lib/ai-search';
import type {
	ChatMessage,
	ChatState,
	LoadingPhase,
	SearchFallback,
} from '../../lib/chat-types';
import { useVoiceRecognition } from '../../lib/hooks/useVoiceRecognition';
import { useConversationWebSocket } from '../../lib/hooks/useConversationWebSocket';
import { useUIState } from '../../lib/hooks/useUIState';
import { useChatStorage } from '../../lib/hooks/useChatStorage';
import { useTouchGestures } from '../../lib/hooks/useTouchGestures';
import { useKeyboardShortcuts } from '../../lib/hooks/useKeyboardShortcuts';
import { useScrollManagement } from '../../lib/hooks/useScrollManagement';
import { useConversationAnalytics } from '../../lib/hooks/useConversationAnalytics';
import { useCopyFeedback } from '../../lib/hooks/useCopyFeedback';
import { useChatLifecycle } from '../../lib/hooks/useChatLifecycle';
import { INITIAL_ASSISTANT_MESSAGE } from '../../lib/chat-types';
import { cleanSnippet, enhanceQuery } from '../../lib/chat-helpers';
import {
	buildHistoryForRequest,
	generateContextualCTAs,
} from '../../lib/message-processing';
import {
	finalizeMessageQuality,
	getRelevanceExplanation,
} from '../../lib/response-handlers';
import { searchWithAI } from '../../lib/ai-search';
import { autoragEvents } from '../../lib/analytics';
import {
	CONVERSATION_STORAGE_KEY,
	CONTEXTUAL_CTAS,
	GUIDED_PROMPTS,
	PREFERENCES_STORAGE_KEY,
	QUICK_ACTIONS,
	SEMANTIC_SEARCH_URL,
} from '../../lib/chat-constants';
import {
	getBooleanPreference,
	removeStorageItem,
} from '../../lib/storage-utils';
import {
	calculateConversationAnalytics as calculateAnalytics,
} from '../../lib/conversation-utils';
import { categorizeError } from '../../lib/error-utils';
import {
	getCitationHealthIndicator,
	getConfidenceIndicator,
} from '../../lib/quality-utils';
import {
	cleanAssistantResponse,
	createId,
	decodeHtmlEntities,
	decodeMimeEncodedWords,
	formatPublishedDate,
} from '../../lib/string-utils';


















// checkCitationHealth - local implementation for citation validation



export default function AIChatIsland() {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
	const [inputValue, setInputValue] = useState('');
	const [chatState, setChatState] = useState<ChatState>('idle');
	const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
	const [error, setError] = useState<string | null>(null);
	const [useMemory, setUseMemory] = useState<boolean>(() => 
		getBooleanPreference(PREFERENCES_STORAGE_KEY, 'useMemory', true)
	);
	const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
	const [sessionStartTime] = useState<number>(Date.now()); // Track session start
	const [fallbackResults, setFallbackResults] = useState<SearchFallback[]>([]);
	const [retryCount, setRetryCount] = useState(0);
	const [lastFailedQuery, setLastFailedQuery] = useState<string>('');
	const siteHostname = useMemo(() => {
		if (typeof window !== 'undefined') {
			return window.location.hostname;
		}
		return 'blakeoxford.com';
	}, []);

	const panelRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLTextAreaElement | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const launcherRef = useRef<HTMLButtonElement | null>(null);
	const lastFocusedElement = useRef<HTMLElement | null>(null);
	const lastQueryRef = useRef<string | null>(null);
	const messagesRef = useRef(messages);
	const activeRequestRef = useRef<AbortController | null>(null);
	const sourceRefs = useRef<HTMLAnchorElement[]>([]);
	const typingTimeoutRef = useRef<number | null>(null);

	// Voice recognition hook with real-time transcription
	const { voiceSupported, isListening, interimTranscript, toggleListening } = useVoiceRecognition({
		onTranscript: (transcript) => {
			setInputValue((prev) => {
				const existing = prev.trim();
				const combined = existing ? `${existing} ${transcript}` : transcript;
				return combined.trim();
			});
		},
		language: 'en-US',
		continuous: false,
		interimResults: true,
		maxAlternatives: 1,
	});

	// WebSocket hook for real-time conversation features
	const { wsConnected, activeUsers, isOtherUserTyping, wsRef } = useConversationWebSocket({
		conversationId: 'default',
		userId: 'anonymous',
		isOpen,
		connectDelay: 1000,
	});

	// UI state management hook
	const {
		showDigest,
		showAnalytics,
		showAdvancedControls,
		showFallbackSuggestions,
		composerFocused,
		showScrollToLatest,
		expandedSources,
		expandedIndividualSources,
		toggleDigest,
		toggleAnalytics,
		toggleAdvancedControls,
		setShowFallbackSuggestions,
		setComposerFocused,
		setShowScrollToLatest,
		toggleExpandedSource,
		toggleIndividualSource,
		setExpandedSources,
		setExpandedIndividualSources,
	} = useUIState();

	// Chat storage hook for conversation persistence
	useChatStorage({
		messages,
		useMemory,
		onMessagesRestored: setMessages,
		maxRestoreMessages: 30,
	});

	useEffect(() => {
		messagesRef.current = messages;
	}, [messages]);

	useEffect(() => {
		setShowFallbackSuggestions(false);
	}, [fallbackResults]);

	useEffect(() => {
		return () => {
			if (activeRequestRef.current) {
				activeRequestRef.current.abort();
				activeRequestRef.current = null;
			}
		};
	}, []);

	// Chat lifecycle hook for open/close/focus management
	const { openChat, closeChat, focusInput, dispatchState } = useChatLifecycle({
		isOpen,
		setIsOpen,
		setError,
		setChatState,
		isListening,
		toggleListening,
		inputRef,
		lastFocusedElementRef: lastFocusedElement,
	});

	// Touch gestures hook for swipe-to-close
	const { touchStartY, touchCurrentY, handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures({
		onSwipeDown: closeChat,
		swipeThreshold: 100,
		enabled: isOpen,
	});

	// Keyboard shortcuts hook for all keyboard interactions
	useKeyboardShortcuts({
		enabled: isOpen,
		onOpen: openChat,
		onClose: closeChat,
		onToggle: () => (isOpen ? closeChat() : openChat()),
		panelRef,
		sourceRefs,
	});

	// Scroll management hook for auto-scroll and scroll-to-latest
	const { scrollToLatest } = useScrollManagement({
		containerRef: scrollContainerRef,
		enabled: isOpen,
		scrollTrigger: messages,
		showScrollButton: showScrollToLatest,
		onScrollButtonChange: setShowScrollToLatest,
		scrollThreshold: 48,
	});

	// Conversation analytics hook for derived state and metrics
	const {
		recentQueries,
		conversationDigest,
		feedbackAnalytics,
		guidedPromptVisible,
		composerHasValue,
		floatingLabelActive,
		canStartNewChat,
	} = useConversationAnalytics({
		messages,
		interimTranscript,
		inputValue,
		composerFocused,
	});

	// Copy feedback hook for clipboard operations with visual feedback
	const { copiedMessageId, copiedShareUrl, copyWithFeedback } = useCopyFeedback({
		resetDelay: 2000,
	});

	/**
	 * Compresses conversation history with smart context management:
	 * - Recent messages (last 4): Kept in full for immediate context
	 * - Older messages: Summarized to preserve context while reducing tokens
	 * - Maintains conversation flow and important details
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
						'Accept': 'application/json'
					},
					body: JSON.stringify({ query: normalized })
				});
				
				if (!response.ok) {
					setFallbackResults([]);
					return;
				}
				
				const data = await response.json();
				
				// Transform Vectorize results to SearchFallback format
				if (data.results && Array.isArray(data.results)) {
					const ranked = data.results
						.slice(0, 3)
						.map((result: { title?: string; id: string; url?: string; description?: string; score?: number }) => ({
							title: result.title || result.id,
							url: result.url || `/${result.id}`,
							excerpt: result.description || '',
							score: result.score || 0
						}));
					setFallbackResults(ranked);
				} else {
					setFallbackResults([]);
				}
			} catch (err) {
				console.error('Semantic search failed:', err);
				setFallbackResults([]);
			}
		},
		[],
	);

	const appendAssistantChunk = useCallback((messageId: string, chunk: string) => {
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
	}, []);

	/**
	 * Finalizes assistant message with content, quality score, and citation health
	 */
	const finalizeAssistantMessage = useCallback(async (messageId: string, content: string) => {
		const message = messagesRef.current.find((m) => m.id === messageId);
		if (!message) return;
		
		// Get the user query that prompted this response
		const messageIndex = messagesRef.current.findIndex((m) => m.id === messageId);
		const userQuery = messageIndex > 0 ? messagesRef.current[messageIndex - 1]?.content || '' : '';
		
		// Calculate quality scores and update message
		const qualityUpdate = await finalizeMessageQuality(messageId, content, messagesRef.current, userQuery);
		
		if (qualityUpdate) {
			setMessages((prev) =>
				prev.map((m) => (m.id === messageId ? { ...m, ...qualityUpdate } : m)),
			);
		}
	}, []);

	const assignAssistantSources = useCallback((messageId: string, sources: AIChatSource[]) => {
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
	}, []);

	const clearConversation = useCallback(() => {
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
	}, [focusInput, showDigest, showAnalytics, toggleDigest, toggleAnalytics, setShowFallbackSuggestions, setExpandedSources, setComposerFocused, setShowScrollToLatest]);

	const startNewChat = useCallback(() => {
		clearConversation();
	}, [clearConversation]);

	const toggleMemory = useCallback(() => {
		setUseMemory((prev) => !prev);
	}, []);

	const handleToggleAnalytics = useCallback(() => {
		toggleAnalytics();
		// Track analytics panel usage
		if (typeof window !== 'undefined') {
			autoragEvents.chatInsights({
				total_messages: 0,
				user_messages: 0,
				assistant_messages: 0,
				total_sources: 0,
			});
		}
	}, [toggleAnalytics]);


	const handleCopyMessage = useCallback(async (message: ChatMessage) => {
		if (!message.content) return;
		await copyWithFeedback(message.content, message.id, 'message');
	}, [copyWithFeedback]);

	const handleOpenPrimarySource = useCallback((url: string) => {
		if (!url) return;
		if (typeof window !== 'undefined') {
			window.location.assign(url);
		}
	}, []);

	const handleFeedback = useCallback(
		async (messageId: string, sentiment: 'positive' | 'negative') => {
			let resolvedSentiment: 'positive' | 'negative' | undefined;
			setMessages((prev) =>
				prev.map((message) => {
					if (message.id !== messageId) return message;
					const nextSentiment = message.feedback === sentiment ? undefined : sentiment;
					resolvedSentiment = nextSentiment;
					return { ...message, feedback: nextSentiment };
				}),
			);
			if (!resolvedSentiment) return;
			try {
				await fetch('/api/ai-feedback', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						messageId,
						sentiment: resolvedSentiment,
						query: lastQueryRef.current,
						metadata: {
							conversationLength: messagesRef.current.length,
						},
					}),
					keepalive: true,
				});
			} catch {
				/* ignore feedback errors */
			}
		},
		[],
	);

	const handleExportConversation = useCallback(() => {
		if (messages.length === 0) return;
		
		// Generate Markdown content
		const timestamp = new Date().toLocaleString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
		
		let markdown = '# AI Conversation with Blake Oxford\n\n';
		markdown += `**Exported**: ${timestamp}  \n`;
		markdown += `**Messages**: ${messages.length}  \n`;
		markdown += `**URL**: ${window.location.href}\n\n`;
		markdown += '---\n\n';
		
		messages.forEach((message, index) => {
			const role = message.role === 'user' ? '👤 You' : '🤖 AI Assistant';
			markdown += `## ${role}\n\n`;
			markdown += `${message.content}\n\n`;
			
			// Add sources for assistant messages
			if (message.role === 'assistant' && message.sources && message.sources.length > 0) {
				markdown += '### 📚 Sources\n\n';
				message.sources.forEach((source, sourceIndex) => {
					const title = decodeMimeEncodedWords(decodeHtmlEntities(source.title || source.url));
					const score = source.score ? ` (${Math.round(source.score * 100)}% relevant)` : '';
					const collection = source.collection ? ` [${source.collection}]` : '';
					markdown += `${sourceIndex + 1}. [${title}](${source.url})${score}${collection}\n`;
					if (source.snippet) {
						markdown += `   > ${source.snippet}\n\n`;
					}
				});
				markdown += '\n';
			}
			
			if (index < messages.length - 1) {
				markdown += '---\n\n';
			}
		});
		
		markdown += '\n---\n\n';
		markdown += `*Conversation exported from [blakeoxford.com](${window.location.origin})*\n`;
		
		// Create and download file
		const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		const filename = `ai-conversation-${Date.now()}.md`;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		
		// Track export
		autoragEvents.export('markdown');
	}, [messages]);

	const toggleVoiceInput = useCallback(() => {
		if (!voiceSupported) return;
		openChat();
		toggleListening();
	}, [openChat, voiceSupported, toggleListening]);

	const handleTextareaKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (event.key !== 'Enter' || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
				return;
			}
			const trimmed = event.currentTarget.value.trim();
			if (!trimmed || chatState === 'loading') {
				event.preventDefault();
				return;
			}
			event.preventDefault();
			event.currentTarget.form?.requestSubmit();
		},
		[chatState],
	);

	const sendQuery = useCallback(
		async (query: string) => {
			setChatState('loading');
			setLoadingPhase('searching');
			setError(null);
			setFallbackResults([]);
			lastQueryRef.current = query;

			const userMessage: ChatMessage = { 
				id: createId(), 
				role: 'user', 
				content: query,
				timestamp: Date.now(),
			};
			const assistantId = createId();

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

			const controller = new AbortController();
			if (activeRequestRef.current) {
				activeRequestRef.current.abort();
			}
			activeRequestRef.current = controller;

			const historyPayload = buildHistoryForRequest(messagesRef.current, useMemory);
			
			// Enhance the query with analytical context to guide better responses
			const enhancedQuery = useMemory 
				? enhanceQuery(query, historyPayload.length > 0)
				: query;

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
							scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight });
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
					setError(`${errorInfo.message} Retrying in ${Math.ceil(delay / 1000)}s... (${retryCount + 1}/2)`);
					setRetryCount(prev => prev + 1);
				setLastFailedQuery(query);
				
				// Track retry attempt
				autoragEvents.errorRetry({
					category: errorInfo.category,
					attempt: retryCount + 1,
				});					setTimeout(() => {
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
		[appendAssistantChunk, assignAssistantSources, buildHistoryForRequest, finalizeAssistantMessage, updateFallbackSuggestions, useMemory],
	);

	const handleSubmit = useCallback(
		async (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const query = inputValue.trim();
			if (!query || chatState === 'loading') return;
			setInputValue('');
			await sendQuery(query);
		},
		[chatState, inputValue, sendQuery],
	);

	const handleReplayQuery = useCallback(
		async (query: string) => {
			if (!query || chatState === 'loading') return;
			setInputValue('');
			await sendQuery(query);
		},
		[chatState, sendQuery],
	);

	const handleGuidedPrompt = useCallback(
		(prompt: string) => {
			setInputValue(prompt);
			openChat();
			focusInput();
		},
		[focusInput, openChat],
	);

	useEffect(() => {
		if (!isOpen) return;
		focusInput();
	}, [focusInput, isOpen]);

	useEffect(() => {
		if (!launcherRef.current) return;
		launcherRef.current.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
	}, [isOpen]);

	useEffect(() => {
		dispatchState(isOpen);
	}, [dispatchState, isOpen]);

	sourceRefs.current = [];
	const lastQueryValue = lastQueryRef.current;
	const canRetry = Boolean(lastQueryValue) && chatState !== 'loading';
	const fallbackPreviewLimit = 2;
	const visibleFallbackResults = showFallbackSuggestions ? fallbackResults : fallbackResults.slice(0, fallbackPreviewLimit);
	const hasMoreFallbackResults = fallbackResults.length > visibleFallbackResults.length;

	return (
		<div
			className="ai-chat-wrapper pointer-events-none fixed bottom-4 right-4 z-[1050] flex flex-col-reverse items-end gap-3 sm:bottom-6 sm:right-6"
			data-ai-chat-open={isOpen ? 'true' : 'false'}
		>
			<button
				ref={launcherRef}
				type="button"
				className="ai-chat-launcher pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border border-[color:var(--border)]/60 bg-[color:var(--glass-surface-bg)]/95 text-[color:var(--fg)] shadow-lg backdrop-blur supports-[backdrop-filter]:bg-[color:var(--glass-surface-bg)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
				aria-label={isOpen ? 'Close AI search assistant' : 'Open AI search assistant'}
				onClick={() => {
					if (isOpen) {
						closeChat();
					} else {
						openChat();
					}
				}}
			>
				<svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
					{isOpen ? (
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					) : (
						<path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 3h5.5M21 11.5c0 4.418-4.03 8-9 8-1.15 0-2.26-.19-3.29-.54L3 21l1.1-3.3A8.35 8.35 0 0 1 3 11.5c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
					)}
				</svg>
			</button>

			<div
				ref={panelRef}
				className={`ai-chat-panel pointer-events-auto w-[min(95vw,24rem)] overflow-hidden rounded-3xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/80 shadow-[0_18px_45px_-18px_rgba(15,23,42,0.65)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[color:var(--glass-surface-bg)]/80 transition-transform duration-200 ease-out sm:w-[min(85vw,28rem)] ${
					isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
				}`}
				style={{
					transform: touchStartY !== null && touchCurrentY !== null && touchCurrentY > touchStartY
						? `translateY(${Math.min(touchCurrentY - touchStartY, 200)}px)`
						: isOpen ? 'translateY(0)' : 'translateY(1rem)',
					opacity: touchStartY !== null && touchCurrentY !== null && touchCurrentY > touchStartY
						? Math.max(0.5, 1 - (touchCurrentY - touchStartY) / 400)
						: isOpen ? 1 : 0
				}}
				data-ai-chat-panel
				data-ai-visible={isOpen ? 'true' : 'false'}
				role="dialog"
				aria-modal="true"
				aria-labelledby="ai-chat-heading"
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				<div className="flex items-center justify-between gap-2 border-b border-[color:var(--border)]/40 bg-[color:var(--surface-subtle)]/40 px-4 py-3">
					<div className="flex flex-col">
						<span id="ai-chat-heading" className="text-sm font-semibold text-[color:var(--fg)]">
							AI Portfolio Assistant
						</span>
						<span className="flex items-center gap-2 text-xs text-[color:var(--fg)]/60">
							<span>Powered by AutoRAG search</span>
							{wsConnected && (
								<>
									<span className="text-[color:var(--fg)]/30">•</span>
									<span className="flex items-center gap-1">
										<span className="inline-block size-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
										<span>Real-time connected</span>
									</span>
									{activeUsers > 1 && (
										<>
											<span className="text-[color:var(--fg)]/30">•</span>
											<span className="flex items-center gap-1">
												<svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
													<path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
												</svg>
												<span>{activeUsers} active</span>
											</span>
										</>
									)}
								</>
							)}
						</span>
					</div>
					<div className="flex items-center gap-2">
						{voiceSupported && (
							<button
								type="button"
								className={`inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)]/50 text-[color:var(--fg)]/70 transition-transform duration-150 hover:scale-105 hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] active:scale-95 ${
									isListening ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
								}`}
								aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
								onClick={toggleVoiceInput}
							>
								<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0M12 18v3m-4 0h8" />
								</svg>
							</button>
						)}
						<button
							type="button"
							className={`inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)]/50 text-[color:var(--fg)]/70 transition-transform duration-150 hover:scale-105 hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] active:scale-95 ${
							showAdvancedControls ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
						}`}
							aria-label={showAdvancedControls ? 'Hide advanced controls' : 'Show advanced controls'}
							onClick={toggleAdvancedControls}
						>
							<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v1.5m0 9V18m6-6h-1.5m-9 0H6m8.485-4.485-1.06 1.06m-6.85 6.85-1.06 1.06m0-8.97 1.06 1.06m6.85 6.85 1.06 1.06M12 9.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
							</svg>
						</button>
						<button
							type="button"
							className="inline-flex size-8 items-center justify-center rounded-full border border-[color:var(--border)]/50 text-[color:var(--fg)]/70 transition-transform duration-150 hover:scale-105 hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] active:scale-95"
							aria-label="Close assistant"
							onClick={closeChat}
						>
							<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<div
					className={`border-b border-[color:var(--border)]/30 bg-[color:var(--surface-subtle)]/35 px-4 py-0 text-xs text-[color:var(--fg)]/70 transition-[max-height,opacity,padding] duration-300 ease-out ${
						showAdvancedControls ? 'max-h-[24rem] py-3 opacity-100' : 'max-h-0 opacity-0'
					}`}
				>
					<div
						className={`${showAdvancedControls ? 'pointer-events-auto' : 'pointer-events-none'} grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`}
					>
						<div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/70 px-3 py-2">
							<button
								type="button"
								className={`inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/45 ${
									useMemory ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)]' : 'text-[color:var(--fg)]/70'
								}`}
								aria-label={useMemory ? 'Disable conversation memory' : 'Enable conversation memory'}
								onClick={toggleMemory}
							>
								{useMemory ? 'Memory on' : 'Memory off'}
							</button>
							<button
								type="button"
								className={`inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/45 ${
									showDigest ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)]' : 'text-[color:var(--fg)]/70'
								}`}
								aria-label={showDigest ? 'Hide conversation digest' : 'Show conversation digest'}
								onClick={toggleDigest}
							>
								Digest
							</button>
							<button
								type="button"
								className={`inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/45 ${
									showAnalytics ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)]' : 'text-[color:var(--fg)]/70'
								}`}
								aria-label={showAnalytics ? 'Hide insights' : 'Show insights'}
								onClick={toggleAnalytics}
							>
								Insights
							</button>
							<button
								type="button"
								className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium text-[color:var(--fg)]/70 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/45"
								onClick={clearConversation}
							>
								Clear
							</button>
							<button
								type="button"
								className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.65rem] font-medium text-[color:var(--fg)]/70 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/45 disabled:opacity-50 disabled:cursor-not-allowed"
								onClick={handleExportConversation}
								disabled={messages.length === 0}
								title="Download conversation as Markdown"
							>
								<svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
								</svg>
								Export
							</button>
						</div>
						{feedbackAnalytics.totalAssistant > 0 && (
							<div className="flex flex-col gap-2 rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/60 px-3 py-2">
								<span className="text-[0.65rem] uppercase tracking-wide text-[color:var(--fg)]/45">Session insights</span>
								<div className="grid grid-cols-2 gap-2">
									<div className="rounded-xl border border-[color:var(--border)]/30 px-2.5 py-2">
										<span className="block text-[0.6rem] text-[color:var(--fg)]/50">Replies</span>
										<span className="text-sm font-semibold text-[color:var(--fg)]">{feedbackAnalytics.totalAssistant}</span>
									</div>
									<div className="rounded-xl border border-[color:var(--border)]/30 px-2.5 py-2">
										<span className="block text-[0.6rem] text-[color:var(--fg)]/50">Helpful</span>
										<span className="text-sm font-semibold text-[color:var(--accent-strong)]">{feedbackAnalytics.positive}</span>
									</div>
									<div className="rounded-xl border border-[color:var(--border)]/30 px-2.5 py-2">
										<span className="block text-[0.6rem] text-[color:var(--fg)]/50">Needs work</span>
										<span className="text-sm font-semibold text-red-500 dark:text-red-300">{feedbackAnalytics.negative}</span>
									</div>
									{feedbackAnalytics.positiveRate !== null && (
										<div className="rounded-xl border border-[color:var(--border)]/30 px-2.5 py-2">
											<span className="block text-[0.6rem] text-[color:var(--fg)]/50">Positive rate</span>
											<span className="text-sm font-semibold text-[color:var(--fg)]">{feedbackAnalytics.positiveRate}%</span>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>

				{guidedPromptVisible && (
					<div className="border-b border-[color:var(--border)]/20 bg-[color:var(--surface-subtle)]/20 px-4 py-3 text-[0.75rem] text-[color:var(--fg)]/70">
						<div className="flex flex-col gap-0.5">
							<span className="uppercase tracking-wide text-[0.7rem] text-[color:var(--fg)]/45">Jump in</span>
							<span className="text-[color:var(--fg)]/60">Choose a suggested prompt to get a rich, sourced answer.</span>
						</div>
						<div className="mt-3 grid gap-2 sm:grid-cols-2">
							{GUIDED_PROMPTS.map((prompt) => (
								<button
									key={prompt.id}
									type="button"
									className="group flex h-full flex-col items-start gap-2 rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/70 px-3 py-3 text-left transition hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--surface)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
									onClick={() => handleGuidedPrompt(prompt.prompt)}
									title={prompt.prompt}
								>
									<span className="inline-flex size-8 items-center justify-center rounded-full bg-[color:var(--accent)]/10 text-base">
										{prompt.icon}
									</span>
									<span className="text-sm font-semibold text-[color:var(--fg)] group-hover:text-[color:var(--accent-strong)]">{prompt.label}</span>
									<span className="text-[0.7rem] text-[color:var(--fg)]/65">{prompt.description}</span>
								</button>
							))}
						</div>
					</div>
				)}

				{recentQueries.length > 0 && (
					<div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--border)]/20 bg-[color:var(--surface-subtle)]/20 px-4 py-2 text-[0.65rem] text-[color:var(--fg)]/60">
						<span className="uppercase tracking-wide text-[color:var(--fg)]/45">Recent</span>
						{recentQueries.map((query, index) => (
							<button
								key={`recent-query-${index}`}
								type="button"
								className="max-w-[14rem] truncate rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
								onClick={() => handleReplayQuery(query)}
								title={query}
							>
								{query}
							</button>
						))}
					</div>
				)}

				{showDigest && conversationDigest.length > 0 && (
					<div className="border-b border-[color:var(--border)]/20 bg-[color:var(--surface-subtle)]/20 px-4 py-3 text-xs text-[color:var(--fg)]/70">
						<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Conversation digest</span>
						<ul className="mt-2 list-disc space-y-1 pl-4">
							{conversationDigest.map((item, index) => (
								<li key={`digest-${index}`}>{item}</li>
							))}
						</ul>
					</div>
				)}

				{showAnalytics && (
					<div className="border-b border-[color:var(--border)]/20 bg-[color:var(--surface-subtle)]/20 px-4 py-3 text-xs text-[color:var(--fg)]/70">
						<span className="mb-2 block uppercase tracking-wide text-[color:var(--fg)]/50">Conversation Insights</span>
						
						{(() => {
							const analytics = calculateAnalytics(messages);
							const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 60000);
							const healthyResponses = messages.filter(m => m.citationHealth === 'healthy').length;
							const warningResponses = messages.filter(m => m.citationHealth === 'warning').length;
							const errorResponses = messages.filter(m => m.citationHealth === 'error').length;
							const uniqueCollections = new Set<string>();
							messages.forEach(m => {
								m.sources?.forEach(s => {
									if (s.collection) uniqueCollections.add(s.collection);
								});
							});
							return (
								<>
									{/* Core Metrics */}
									<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
										<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
											<span className="block text-[color:var(--fg)]/45">Messages</span>
											<span className="text-sm font-semibold text-[color:var(--fg)]">{analytics.totalMessages}</span>
										</div>
										<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
											<span className="block text-[color:var(--fg)]/45">Avg Quality</span>
											<span className={`text-sm font-semibold ${
												analytics.avgQualityScore >= 80 
													? 'text-green-600 dark:text-green-400' 
													: analytics.avgQualityScore >= 60
													? 'text-yellow-600 dark:text-yellow-400'
													: 'text-red-600 dark:text-red-400'
											}`}>
												{analytics.avgQualityScore > 0 ? `${Math.round(analytics.avgQualityScore)}/100` : 'N/A'}
											</span>
										</div>
										<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
											<span className="block text-[color:var(--fg)]/45">Session Time</span>
											<span className="text-sm font-semibold text-[color:var(--fg)]">
												{sessionDuration < 1 ? '<1m' : `${sessionDuration}m`}
											</span>
										</div>
										<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
											<span className="block text-[color:var(--fg)]/45">Topics</span>
											<span className="text-sm font-semibold text-[color:var(--fg)]">{uniqueCollections.size}</span>
										</div>
									</div>

									{/* Citation Health */}
									{(healthyResponses + warningResponses + errorResponses) > 0 && (
										<div className="mt-3 rounded-xl border border-[color:var(--border)]/30 p-3">
											<span className="block text-[color:var(--fg)]/45 mb-2">Citation Health</span>
											<div className="flex flex-wrap gap-2">
												{healthyResponses > 0 && (
													<span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-[0.65rem] font-medium text-green-700 dark:text-green-300">
														<span>✓</span>
														{healthyResponses} Verified
													</span>
												)}
												{warningResponses > 0 && (
													<span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-1 text-[0.65rem] font-medium text-yellow-700 dark:text-yellow-300">
														<span>⚠</span>
														{warningResponses} Warnings
													</span>
												)}
												{errorResponses > 0 && (
													<span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-[0.65rem] font-medium text-red-700 dark:text-red-300">
														<span>✗</span>
														{errorResponses} Issues
													</span>
												)}
											</div>
										</div>
									)}

									{/* Topics Explored */}
									{uniqueCollections.size > 0 && (
										<div className="mt-3">
											<span className="block uppercase tracking-wide text-[color:var(--fg)]/50 mb-2">Topics Explored</span>
											<div className="flex flex-wrap gap-1.5">
												{Array.from(uniqueCollections).map((collection) => (
													<span 
														key={String(collection)}
														className="inline-flex items-center rounded-full bg-[color:var(--accent)]/10 px-2.5 py-1 text-[0.65rem] font-medium text-[color:var(--accent-strong)]"
													>
														{collection}
													</span>
												))}
											</div>
										</div>
									)}

									{/* Feedback Analytics */}
									{feedbackAnalytics.totalAssistant > 0 && (
										<div className="mt-3 border-t border-[color:var(--border)]/30 pt-3">
											<span className="block uppercase tracking-wide text-[color:var(--fg)]/50 mb-2">User Feedback</span>
											<div className="flex flex-wrap gap-2">
												<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
													<span className="block text-[color:var(--fg)]/45">Helpful</span>
													<span className="text-sm font-semibold text-[color:var(--accent-strong)]">{feedbackAnalytics.positive}</span>
												</div>
												<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
													<span className="block text-[color:var(--fg)]/45">Needs work</span>
													<span className="text-sm font-semibold text-red-500 dark:text-red-300">{feedbackAnalytics.negative}</span>
												</div>
												{feedbackAnalytics.positiveRate !== null && (
													<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
														<span className="block text-[color:var(--fg)]/45">Satisfaction</span>
														<span className="text-sm font-semibold text-[color:var(--fg)]">{feedbackAnalytics.positiveRate}%</span>
													</div>
												)}
											</div>
										</div>
									)}

									{/* Performance Metrics */}
									{analytics.avgResponseTimeMs > 0 && (
										<div className="mt-3 border-t border-[color:var(--border)]/30 pt-3">
											<span className="block uppercase tracking-wide text-[color:var(--fg)]/50 mb-2">Performance</span>
											<div className="flex flex-wrap gap-2">
												<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
													<span className="block text-[color:var(--fg)]/45">Avg Response</span>
													<span className="text-sm font-semibold text-[color:var(--fg)]">
														{(analytics.avgResponseTimeMs / 1000).toFixed(1)}s
													</span>
												</div>
												<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
													<span className="block text-[color:var(--fg)]/45">Fastest</span>
													<span className="text-sm font-semibold text-green-600 dark:text-green-400">
														{(analytics.avgResponseTimeMs / 1000).toFixed(1)}s
													</span>
												</div>
												<div className="rounded-xl border border-[color:var(--border)]/30 px-3 py-2">
													<span className="block text-[color:var(--fg)]/45">Slowest</span>
													<span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
														{(analytics.avgResponseTimeMs / 1000).toFixed(1)}s
													</span>
												</div>
											</div>
										</div>
									)}
								</>
							);
						})()}
					</div>
				)}

				<div className="relative">
					<div
						ref={scrollContainerRef}
						className="flex max-h-80 flex-col gap-4 overflow-y-auto px-4 py-4"
						aria-live="polite"
						data-ai-chat-transcript
					>
						{messages.length === 0 && chatState === 'ready' && (
							<div className="space-y-4">
								<div className="text-center space-y-2">
									<h3 className="text-lg font-semibold text-[color:var(--fg)]">
										👋 How can I help you today?
									</h3>
									<p className="text-sm text-[color:var(--fg)]/60">
										Try one of these popular questions:
									</p>
								</div>
								
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
									{QUICK_ACTIONS.map((action, index) => (
										<button
											key={index}
											type="button"
											onClick={() => {
												setInputValue(action.query);
												// Auto-submit after a brief delay for UX smoothness
												setTimeout(() => sendQuery(action.query), 100);
												
												// Track quick action usage
												autoragEvents.quickAction({
												action: action.label,
												category: action.category,
											});
											}}
											className="group flex items-start gap-3 rounded-xl border border-[color:var(--border)]/40 bg-[color:var(--surface)]/50 p-4 text-left transition-all duration-200 hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--surface)]/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
										>
											<span className="flex-shrink-0 text-2xl transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
												{action.icon}
											</span>
											<div className="min-w-0 flex-1">
												<div className="mb-1 text-sm font-medium text-[color:var(--fg)]">
													{action.label}
												</div>
												<div className="line-clamp-2 text-xs text-[color:var(--fg)]/60">
													{action.query}
												</div>
											</div>
											<svg 
												className="size-5 flex-shrink-0 text-[color:var(--fg)]/40 transition-colors group-hover:text-[color:var(--accent)]" 
												fill="none" 
												stroke="currentColor" 
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</button>
									))}
								</div>
							</div>
						)}
						{messages.map((message) => {
						const alignment = message.role === 'user' ? 'items-end text-right' : 'items-start text-left';
						const bubbleClasses = message.role === 'user'
							? 'bg-[color:var(--accent)] text-[color:var(--on-accent)]'
							: 'bg-[color:var(--surface)]/95 text-[color:var(--fg)] dark:bg-[color:var(--surface)]/90';
						const isAssistant = message.role === 'assistant';
						const isStreaming = streamingMessageId === message.id;
						const bubbleContent = isAssistant ? cleanAssistantResponse(message.content) : message.content;
						const sources = isAssistant && message.sources ? message.sources : [];
						const totalSources = sources.length;
						const showAllSources = isAssistant ? Boolean(expandedSources[message.id]) : false;
						const primarySource = sources[0] ?? null;
						const primarySourceTitle = primarySource ? decodeMimeEncodedWords(decodeHtmlEntities(primarySource.title || primarySource.url)) : null;
						let primarySourceIsExternal = false;
						if (primarySource) {
							try {
								const parsed = primarySource.url.startsWith('http')
									? new URL(primarySource.url)
									: new URL(primarySource.url, `https://${siteHostname}`);
								primarySourceIsExternal = parsed.hostname !== siteHostname;
							} catch {
								primarySourceIsExternal = !primarySource.url.startsWith('/');
							}
						}
						const primaryLinkTarget = primarySourceIsExternal ? '_blank' : undefined;
						const primaryLinkRel = primarySourceIsExternal ? 'noreferrer' : undefined;
						const isHelpful = message.feedback === 'positive';
						const isNotHelpful = message.feedback === 'negative';
						const messageTextClasses = isAssistant ? 'text-[0.95rem] leading-relaxed' : 'text-[0.9rem] leading-snug';

						return (
							<div key={message.id} className={`flex flex-col gap-2 ${alignment}`} data-ai-message-role={message.role}>
								<div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ring-1 ring-[color:var(--border)]/20 dark:ring-[color:var(--border)]/30 ${bubbleClasses}`}>
									<div className="flex flex-col gap-2">
										{bubbleContent ? (
											<span className={`whitespace-pre-wrap break-words ${messageTextClasses}`}>{bubbleContent}</span>
										) : (
											isAssistant && !isStreaming ? (
												<span className={`whitespace-pre-wrap break-words ${messageTextClasses}`}>Thinking…</span>
											) : null
										)}
										{isAssistant && isStreaming && (
											<span className="flex items-center gap-1 text-[0.75rem] text-[color:var(--fg)]/60" aria-live="assertive">
												<span className="sr-only">Assistant is responding</span>
												<span aria-hidden="true" className="size-1.5 rounded-full bg-[color:var(--accent)]/60 animate-pulse" />
												<span aria-hidden="true" className="size-1.5 rounded-full bg-[color:var(--accent)]/60 animate-pulse [animation-delay:150ms]" />
												<span aria-hidden="true" className="size-1.5 rounded-full bg-[color:var(--accent)]/60 animate-pulse [animation-delay:300ms]" />
											</span>
										)}
										{isAssistant && !isStreaming && message.qualityScore !== undefined && (
											<div className="flex flex-wrap items-center gap-1.5 text-[0.65rem]">
												{(() => {
													const indicator = getConfidenceIndicator(message.qualityScore);
													return (
														<>
															<span className={`font-medium ${indicator.color}`} aria-label={`Quality: ${indicator.label}`}>
																<span aria-hidden="true">{indicator.emoji}</span> {indicator.label}
															</span>
															<span className="text-[color:var(--fg)]/40">·</span>
															<span className="text-[color:var(--fg)]/50" title={`Response quality score: ${message.qualityScore}/100`}>
																{message.qualityScore}/100
															</span>
														</>
													);
												})()}
												{message.citationHealth && totalSources > 0 && (
													<>
														<span className="text-[color:var(--fg)]/40">·</span>
														{(() => {
															const healthIndicator = getCitationHealthIndicator(message.citationHealth);
															return (
																<span 
																	className={`font-medium ${healthIndicator.color}`} 
																	title={healthIndicator.description}
																	aria-label={`Citation health: ${healthIndicator.label}`}
																>
																	<span aria-hidden="true">{healthIndicator.icon}</span> {healthIndicator.label}
																</span>
															);
														})()}
													</>
												)}
											</div>
										)}
										{isAssistant && totalSources > 0 && (
											<div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-[color:var(--fg)]/60">
												<span className="uppercase tracking-wide text-[color:var(--fg)]/45">Cited</span>
												{sources.map((source, index) => (
													<button
														key={`${message.id}-citation-${index}`}
														type="button"
														className="rounded-full border border-[color:var(--accent)]/30 px-2 py-0.5 text-[color:var(--accent)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]"
														onClick={() => handleOpenPrimarySource(source.url)}
													>
														[{index + 1}]
													</button>
												))}
											</div>
										)}
									</div>
								</div>
								{isAssistant && totalSources > 0 && (
									<div className="mt-1 flex flex-col gap-2 text-xs" aria-label="Referenced sources">
										<div className="flex flex-wrap items-center gap-2">
											<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Sources</span>
											{primarySource && primarySourceTitle && (
												<a
													href={primarySource.url}
													target={primaryLinkTarget}
													rel={primaryLinkRel}
													className="max-w-full min-w-0 break-words whitespace-normal rounded-full border border-[color:var(--border)]/40 px-2.5 py-0.5 text-left text-[0.65rem] leading-tight text-[color:var(--accent)] transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]"
												>
													{primarySourceTitle}
												</a>
											)}
											{totalSources > 1 && !showAllSources && (
												<span className="text-[color:var(--fg)]/50">+{totalSources - 1} more</span>
											)}
											<button
												type="button"
												className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-2.5 py-0.5 text-[0.65rem] text-[color:var(--fg)]/65 transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]/40"
												onClick={() => toggleExpandedSource(message.id)}
											>
												{showAllSources ? 'Hide details' : totalSources > 1 ? `Show all (${totalSources})` : 'Show details'}
											</button>
										</div>
										{showAllSources && (
											<ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
												{sources.map((source, index) => {
												const relevance = typeof source.score === 'number' ? Math.round(Math.min(Math.max(source.score, 0), 1) * 100) : null;
												const title = decodeMimeEncodedWords(decodeHtmlEntities(source.title || ''));
												const displayTitle = title || decodeMimeEncodedWords(decodeHtmlEntities(source.url));
												const snippetSource = source.summary || source.snippet || '';
												const snippet = snippetSource ? cleanSnippet(snippetSource) : '';
												const publishedLabel = formatPublishedDate(source.publishedAt ?? undefined);
												const sourceKey = `${message.id}-source-${index}`;
												const isExpanded = expandedIndividualSources[sourceKey];
												const relevanceInfo = relevance !== null ? getRelevanceExplanation(relevance) : null;
												
												let isExternalLink = false;
												try {
													const parsed = source.url.startsWith('http')
														? new URL(source.url)
														: new URL(source.url, `https://${siteHostname}`);
													isExternalLink = parsed.hostname !== siteHostname;
												} catch {
													isExternalLink = !source.url.startsWith('/');
												}
												const linkTarget = isExternalLink ? '_blank' : undefined;
												const linkRel = isExternalLink ? 'noreferrer' : undefined;
												return (
													<li
														key={sourceKey}
														className="group w-full rounded-2xl border border-[color:var(--border)]/40 bg-gradient-to-br from-[color:var(--surface-subtle)]/40 to-[color:var(--surface)]/20 px-4 py-3 text-left text-[color:var(--fg)]/80 shadow-sm transition hover:border-[color:var(--accent)]/60 hover:bg-[color:var(--surface)]/60 hover:shadow-md"
													>
														<div className="flex items-start gap-3">
															<div className="flex shrink-0 items-center gap-2">
																<span className="inline-flex size-6 items-center justify-center rounded-full bg-[color:var(--accent)]/15 text-xs font-bold text-[color:var(--accent)]">{index + 1}</span>
																{source.icon && <span className="shrink-0 text-xl" aria-hidden="true">{source.icon}</span>}
															</div>
															<div className="min-w-0 flex-1">
																<a
																	ref={(element) => {
																	if (element) sourceRefs.current.push(element);
																	}}
																	href={source.url}
																	tabIndex={0}
																	target={linkTarget}
																	rel={linkRel}
																	className="block font-medium text-[color:var(--accent)] underline decoration-dotted underline-offset-2 transition group-hover:text-[color:var(--accent-strong)]"
																>
																	{displayTitle}
																</a>
																<div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.65rem] text-[color:var(--fg)]/60">
																	{source.collection && (
																		<span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--accent)]/15 px-2.5 py-0.5 font-semibold text-[color:var(--accent-strong)]">
																			{source.collection === 'blog' && '📝'}
																			{source.collection === 'projects' && '🚀'}
																			{source.collection !== 'blog' && source.collection !== 'projects' && '📄'}
																			{source.collection}
																		</span>
																	)}
																	{relevance !== null && (
																		<span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold ${
																			relevance >= 90 
																				? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-700 dark:text-green-400'
																				: relevance >= 75
																				? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/10 text-blue-700 dark:text-blue-400'
																				: relevance >= 60
																				? 'bg-gradient-to-r from-purple-500/20 to-pink-500/10 text-purple-700 dark:text-purple-400'
																				: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/10 text-yellow-700 dark:text-yellow-400'
																		}`}>
																			<svg className="size-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
																				<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
																			</svg>
																			{relevance}% match
																		</span>
																	)}
																	{publishedLabel && (
																		<time className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/60 px-2.5 py-0.5" dateTime={source.publishedAt ?? undefined}>
																			<svg className="size-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
																				<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
																			</svg>
																			{publishedLabel}
																		</time>
																	)}
																	{isExternalLink && (
																		<span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/40 px-2.5 py-0.5 text-[color:var(--fg)]/50">
																			External
																			<svg className="size-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
																				<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 5h7.06m0 0v7.06m0-7.06-8.12 8.12" />
																			</svg>
																		</span>
																	)}
																</div>
																
																{/* Relevance Explanation & Expand Toggle */}
																{(relevanceInfo || snippet) && (
																	<div className="mt-2">
																		{relevanceInfo && !isExpanded && (
																			<div className={`flex items-start gap-2 rounded-lg border border-[color:var(--border)]/20 bg-[color:var(--surface)]/20 px-3 py-2 text-[0.65rem] ${relevanceInfo.color}`}>
																				<span className="text-sm" aria-hidden="true">{relevanceInfo.icon}</span>
																				<span className="flex-1 leading-relaxed">{relevanceInfo.text}</span>
																			</div>
																		)}
																		
																		{(snippet || relevanceInfo) && (
																			<button
																				type="button"
																				onClick={() => toggleIndividualSource(sourceKey)}
																				className="mt-1.5 inline-flex items-center gap-1 text-[0.65rem] text-[color:var(--accent)] transition hover:text-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]/40"
																			>
																				<svg 
																					className={`size-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
																					viewBox="0 0 20 20" 
																					fill="currentColor"
																					aria-hidden="true"
																				>
																					<path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
																				</svg>
																				{isExpanded ? 'Hide details' : 'Show details'}
																			</button>
																		)}
																		
																		{/* Expanded Details */}
																		{isExpanded && (
																			<div className="mt-2 space-y-2">
																				{relevanceInfo && (
																					<div className={`flex items-start gap-2 rounded-lg border border-[color:var(--border)]/20 bg-[color:var(--surface)]/20 px-3 py-2 text-[0.65rem] ${relevanceInfo.color}`}>
																						<span className="text-sm" aria-hidden="true">{relevanceInfo.icon}</span>
																						<div className="flex-1">
																							<div className="font-medium">Why this source?</div>
																							<div className="mt-0.5 leading-relaxed">{relevanceInfo.text}</div>
																						</div>
																					</div>
																				)}
																				{snippet && (
																					<p className="rounded-lg border border-[color:var(--border)]/20 bg-[color:var(--surface)]/30 px-3 py-2 text-xs leading-relaxed text-[color:var(--fg)]/70">
																						<span className="font-medium text-[color:var(--fg)]/50">Preview: </span>
																						{snippet}
																					</p>
																				)}
																			</div>
																		)}
																	</div>
																)}
															</div>
														</div>
													</li>
												);
											})}
										</ul>
									)}
								</div>
								)}
								{isAssistant && sources.length > 0 && (() => {
									const messageIndex = messages.findIndex((m) => m.id === message.id);
									const userQuery = messageIndex > 0 ? messages[messageIndex - 1]?.content || '' : '';
									const matchedCTA = CONTEXTUAL_CTAS.find((cta) => cta.condition(userQuery, sources));
									
									if (matchedCTA) {
										return (
											<div className="mt-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:border-blue-800 dark:from-blue-950/30 dark:to-purple-950/30">
												<div className="flex items-start gap-3">
													<span className="shrink-0 text-2xl" aria-hidden="true">
														{matchedCTA.icon}
													</span>
													<div className="flex-1">
														<p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{matchedCTA.message}</p>
														<a
															href={matchedCTA.ctaLink}
															className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-900"
															onClick={() => {
																if (typeof window !== 'undefined') {
											autoragEvents.ctaClick({
												type: 'quality-suggestion',
												label: matchedCTA.ctaText,
												source: userQuery,
											});
										}
															}}
														>
															{matchedCTA.ctaText}
															<svg
																className="size-4"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
															</svg>
														</a>
													</div>
												</div>
											</div>
										);
									}
									return null;
								})()}
								{isAssistant && sources.length > 0 && (() => {
									// Generate dynamic follow-up suggestions based on sources
									const suggestions: Array<{ label: string; query: string; icon: string }> = [];
									
									// Extract unique collections
									const collections = [...new Set(sources.map((s) => s.collection).filter(Boolean))] as string[];
									
									// Suggest exploring specific collections
									if (collections.includes('projects')) {
										const projectSources = sources.filter((s) => s.collection === 'projects');
										if (projectSources.length > 0) {
											const projectTitle = projectSources[0].title;
											suggestions.push({
												label: 'Project details',
												query: `Tell me more about the ${projectTitle} project`,
												icon: '🔍',
											});
										}
									}
									
									if (collections.includes('blog')) {
										const blogSources = sources.filter((s) => s.collection === 'blog');
										if (blogSources.length > 0) {
											const blogTitle = blogSources[0].title;
											suggestions.push({
												label: 'Related article',
												query: `What else has Blake written about topics in "${blogTitle}"?`,
												icon: '📚',
											});
										}
									}
									
									// Suggest digging deeper into top source
									if (sources[0] && sources[0].title) {
										const topSourceTitle = sources[0].title;
										if (!suggestions.some((s) => s.query.includes(topSourceTitle))) {
											suggestions.push({
												label: 'Deep dive',
												query: `Can you explain "${topSourceTitle}" in more detail?`,
												icon: '💡',
											});
										}
									}
									
									// Suggest comparing if multiple sources
									if (sources.length >= 2 && sources[0].title && sources[1].title) {
										suggestions.push({
											label: 'Compare',
											query: `How does "${sources[0].title}" compare to "${sources[1].title}"?`,
											icon: '⚖️',
										});
									}
									
									// Limit to 3 suggestions
									const limitedSuggestions = suggestions.slice(0, 3);
									
									if (limitedSuggestions.length === 0) return null;
									
									return (
										<div className="mt-3 space-y-2">
											<p className="text-xs font-medium uppercase tracking-wide text-[color:var(--fg)]/50">
												Keep exploring
											</p>
											<div className="flex flex-wrap gap-2">
												{limitedSuggestions.map((suggestion, index) => (
													<button
														key={index}
														type="button"
														onClick={() => {
															setInputValue(suggestion.query);
															setTimeout(() => sendQuery(suggestion.query), 100);
															
															autoragEvents.suggestedQuery({
												query: suggestion.query,
											});
														}}
														className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)]/40 bg-[color:var(--surface)]/50 px-3 py-1.5 text-xs text-[color:var(--fg)]/80 transition-all duration-200 hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--accent)]/10 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
													>
														<span className="text-sm" aria-hidden="true">{suggestion.icon}</span>
														{suggestion.label}
													</button>
												))}
											</div>
										</div>
									);
								})()}
								
								{/* Contextual CTAs */}
								{isAssistant && sources.length > 0 && (() => {
									const ctas = generateContextualCTAs(sources, siteHostname, messagesRef.current.length);
									if (ctas.length === 0) return null;
									
									return (
										<div className="mt-3 space-y-2">
											<p className="text-xs font-medium uppercase tracking-wide text-[color:var(--fg)]/50">
												Take action
											</p>
											<div className="flex flex-col gap-2">
												{ctas.map((cta, index) => (
													<a
														key={index}
														href={cta.url}
														target={cta.url.startsWith('http') ? '_blank' : undefined}
														rel={cta.url.startsWith('http') ? 'noreferrer' : undefined}
														onClick={() => {
															autoragEvents.ctaClick({
												type: cta.type,
												label: cta.label,
											});
														}}
														className="group inline-flex items-center gap-2.5 rounded-xl border border-[color:var(--accent)]/30 bg-gradient-to-br from-[color:var(--accent)]/10 to-[color:var(--accent)]/5 px-4 py-3 text-sm font-medium text-[color:var(--accent-strong)] shadow-sm transition-all duration-200 hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--accent)]/15 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
													>
														<span className="text-lg" aria-hidden="true">{cta.icon}</span>
														<span className="flex-1">{cta.label}</span>
														<svg className="size-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
															<path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
														</svg>
													</a>
												))}
											</div>
										</div>
									);
								})()}
								
								{isAssistant && (
									<div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-[color:var(--fg)]/60">
										<button
											type="button"
											className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
											onClick={() => handleCopyMessage(message)}
										>
											{copiedMessageId === message.id ? 'Copied' : 'Copy answer'}
										</button>
										<button
											type="button"
											className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
											title="Share this query"
											onClick={() => {
												const messageIndex = messages.findIndex((m) => m.id === message.id);
												const userQuery = messageIndex > 0 ? messages[messageIndex - 1]?.content || '' : '';
												const shareUrl = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(userQuery)}&autosubmit=true`;
												
												if (navigator.share) {
													navigator.share({
														title: 'AutoRAG Query Result',
														text: `Check out this answer from Blake's AI assistant: "${userQuery}"`,
														url: shareUrl,
													}).then(() => {
														autoragEvents.share('native');
													}).catch(() => {/* User cancelled */});
												} else {
													copyWithFeedback(shareUrl, message.id, 'share').then((success) => {
														if (success) {
															autoragEvents.share('clipboard');
														}
													});
												}
											}}
										>
											{copiedShareUrl === message.id ? (
												<>
													<svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
														<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
													</svg>
													Copied!
												</>
											) : (
												<>
													<svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
													</svg>
													Share
												</>
											)}
										</button>
										{primarySource?.url && (
											<button
												type="button"
												className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
												onClick={() => handleOpenPrimarySource(primarySource.url)}
											>
												View top source
											</button>
										)}
										
										{/* Quality Score Indicator */}
										{message.qualityScore !== undefined && message.qualityScore > 0 && (() => {
											const confidence = getConfidenceIndicator(message.qualityScore);
											const hasDetails = message.qualityDetails !== undefined;
											
											return (
												<div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/50 px-3 py-1 text-[0.65rem]" title={hasDetails ? `Completeness: ${message.qualityDetails?.completeness}% | Citations: ${message.qualityDetails?.citationAccuracy}% | Conciseness: ${message.qualityDetails?.conciseness}% | Relevance: ${message.qualityDetails?.relevance}%` : `Overall quality score: ${message.qualityScore}%`}>
													<span className={confidence.color} aria-hidden="true">{confidence.emoji}</span>
													<span className="text-[color:var(--fg)]/60">{message.qualityScore}%</span>
													{hasDetails && (
														<span className={`font-medium ${confidence.color}`}>{confidence.label}</span>
													)}
												</div>
											);
										})()}
										
										<div className="ml-auto inline-flex items-center gap-1">
											<button
												type="button"
												className={`inline-flex size-7 items-center justify-center rounded-full border border-[color:var(--border)]/40 transition hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
													isHelpful ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
												}`}
												aria-label={isHelpful ? 'Marked helpful' : 'Mark answer helpful'}
												onClick={() => handleFeedback(message.id, 'positive')}
											>
												👍
											</button>
											<button
												type="button"
												className={`inline-flex size-7 items-center justify-center rounded-full border border-[color:var(--border)]/40 transition hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
													isNotHelpful ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
												}`}
												aria-label={isNotHelpful ? 'Marked not helpful' : 'Mark answer not helpful'}
												onClick={() => handleFeedback(message.id, 'negative')}
											>
												👎
											</button>
										</div>
									</div>
								)}
							</div>
						);
						})}
						
						{/* Typing indicator */}
						{isOtherUserTyping && wsConnected && (
							<div className="flex flex-col gap-2 items-start text-left" aria-live="polite" aria-label="AI is typing">
								<div className="rounded-2xl bg-[color:var(--surface)]/95 text-[color:var(--fg)] dark:bg-[color:var(--surface)]/90 px-4 py-3 shadow-sm border border-[color:var(--border)]/20">
									<div className="flex items-center gap-2">
										<div className="flex gap-1">
											<span className="inline-block size-2 rounded-full bg-[color:var(--fg)]/40 animate-bounce [animation-delay:0ms]" aria-hidden="true" />
											<span className="inline-block size-2 rounded-full bg-[color:var(--fg)]/40 animate-bounce [animation-delay:150ms]" aria-hidden="true" />
											<span className="inline-block size-2 rounded-full bg-[color:var(--fg)]/40 animate-bounce [animation-delay:300ms]" aria-hidden="true" />
										</div>
										<span className="text-xs text-[color:var(--fg)]/60">AI is thinking...</span>
									</div>
								</div>
							</div>
						)}
					</div>
					{showScrollToLatest && (
						<button
							type="button"
							onClick={scrollToLatest}
							className="pointer-events-auto absolute bottom-5 right-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/80 px-3 py-1.5 text-xs font-medium text-[color:var(--fg)]/70 shadow-sm backdrop-blur transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
							aria-label="Jump to latest message"
						>
							<svg className="size-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
								<path strokeLinecap="round" strokeLinejoin="round" d="m5 8 5 5 5-5" />
							</svg>
							<span>Jump to latest</span>
						</button>
					)}
				</div>

				{chatState === 'loading' && (
					<div className="flex items-center gap-2 text-sm text-[color:var(--fg)]/70">
						<svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M8.757 8.757 6.636 6.636m12.728 0-2.121 2.121M8.757 15.243l-2.121 2.121" />
						</svg>
						{loadingPhase === 'searching' && 'Searching knowledge base...'}
						{loadingPhase === 'analyzing' && 'Analyzing sources...'}
						{loadingPhase === 'crafting' && 'Crafting response...'}
						{!loadingPhase && 'Thinking through the best answer...'}
					</div>
				)}

				{isListening && (
					<div className="flex items-center gap-2 text-xs text-[color:var(--accent-strong)]">
						<span className="inline-flex size-2 rounded-full bg-[color:var(--accent-strong)]" aria-hidden="true" />
						Listening{interimTranscript ? `: ${interimTranscript}` : ''}
					</div>
				)}

				{error && (
					<div className="rounded-xl border border-red-400/60 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/60 dark:bg-red-900/30 dark:text-red-200">
						<p>{error}</p>
						{lastQueryValue && (
							<p className="mt-1 text-[color:var(--fg)]/60 dark:text-red-200/80">
								Last question: <span className="font-medium text-[color:var(--fg)]">{lastQueryValue}</span>
							</p>
						)}
						{retryCount > 0 && (
							<p className="mt-1 text-[color:var(--fg)]/60 dark:text-red-200/80">
								Retry attempts: {retryCount}/2
							</p>
						)}
						<div className="mt-2 flex flex-wrap gap-2">
							<button
								type="button"
								className="inline-flex items-center gap-2 rounded-full border border-red-400/60 px-3 py-1 font-medium transition hover:border-red-500 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 disabled:opacity-60 dark:hover:border-red-400 dark:hover:text-red-100"
								onClick={() => {
									// Manual retry - clear error and use lastFailedQuery if available
									const queryToRetry = lastFailedQuery || lastQueryValue;
									if (queryToRetry) {
										setError(null);
										setRetryCount(0);
										sendQuery(queryToRetry);
										
										// Track manual retry
										autoragEvents.manualRetry({
										message_id: lastFailedQuery,
									});
									}
								}}
								disabled={!canRetry && !lastFailedQuery}
							>
								Try again
							</button>
							<a
								href="/projects"
								className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
							>
								Browse projects
							</a>
							<a
								href="/contact"
								className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
							>
								Contact Blake
							</a>
						</div>
					</div>
				)}

				{fallbackResults.length > 0 && (
					<div className="min-w-0 rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--surface-subtle)]/30 p-3 text-xs text-[color:var(--fg)]/70">
						<div className="flex items-center justify-between gap-2">
							<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Related suggestions</span>
							<button
								type="button"
								className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-2.5 py-1 text-[0.625rem] font-medium text-[color:var(--fg)]/65 transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
								onClick={() => setShowFallbackSuggestions(!showFallbackSuggestions)}
							>
								{showFallbackSuggestions ? 'Hide' : `Show all (${fallbackResults.length})`}
							</button>
						</div>
						<ul className="mt-2 flex flex-wrap gap-2">
							{visibleFallbackResults.map((result, index) => (
								<li
									key={`fallback-${index}`}
									className="group flex min-w-0 max-w-full flex-1 flex-col gap-1 rounded-2xl border border-[color:var(--border)]/35 bg-[color:var(--surface)]/70 px-3 py-2 transition hover:border-[color:var(--accent)]/40"
								>
									<a
										href={result.url}
										className="truncate text-[color:var(--accent)] underline decoration-dotted underline-offset-2 group-hover:text-[color:var(--accent-strong)]"
										target="_blank"
										rel="noreferrer"
									>
										{result.title}
									</a>
									{showFallbackSuggestions && result.excerpt && (
										<p className="line-clamp-2 break-words text-[color:var(--fg)]/60">{result.excerpt}</p>
									)}
								</li>
							))}
						</ul>
						{hasMoreFallbackResults && !showFallbackSuggestions && (
							<p className="mt-1 text-[0.6rem] text-[color:var(--fg)]/50">Showing top {visibleFallbackResults.length} of {fallbackResults.length} matches.</p>
						)}
					</div>
				)}

				{canStartNewChat && (
					<div className="flex items-center justify-between gap-2 border-t border-[color:var(--border)]/40 bg-[color:var(--surface-subtle)]/35 px-4 py-2 text-[0.7rem] text-[color:var(--fg)]/65">
						<span className="truncate pr-2">Want to start fresh?</span>
						<button
							type="button"
							className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 px-3 py-1 text-[0.65rem] font-medium text-[color:var(--fg)]/70 transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/45"
							onClick={startNewChat}
						>
							<span>Start new chat</span>
							<svg className="size-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
								<path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12m-6-6 6 6-6 6" />
							</svg>
						</button>
					</div>
				)}

				<form className="border-t border-[color:var(--border)]/40 bg-[color:var(--surface)]/50 px-4 py-3" onSubmit={handleSubmit}>
					<div className="relative">
						<textarea
							id="ai-chat-input"
							ref={inputRef}
							className="h-24 w-full resize-none rounded-2xl border border-[color:var(--border)]/40 bg-[color:var(--surface)]/70 px-4 pb-3 pr-12 pt-6 text-sm text-[color:var(--fg)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/40"
							placeholder=""
							value={inputValue}
							onChange={(event) => {
								setInputValue(event.target.value);
								
								// Send typing indicator via WebSocket
								if (wsRef.current?.isConnected()) {
									wsRef.current.sendTyping(true);
									
									// Clear previous timeout
									if (typingTimeoutRef.current !== null) {
										window.clearTimeout(typingTimeoutRef.current);
									}
									
									// Stop typing indicator after 2 seconds of inactivity
									typingTimeoutRef.current = window.setTimeout(() => {
										if (wsRef.current?.isConnected()) {
											wsRef.current.sendTyping(false);
										}
									}, 2000);
								}
							}}
							onKeyDown={handleTextareaKeyDown}
							onFocus={() => setComposerFocused(true)}
							onBlur={() => setComposerFocused(false)}
							disabled={chatState === 'loading'}
							required
							rows={3}
						/>
						<label
							htmlFor="ai-chat-input"
							className={`pointer-events-none absolute left-4 font-medium text-[color:var(--fg)]/60 transition-all duration-150 ease-out ${
								floatingLabelActive ? 'top-2 text-[0.7rem] opacity-85' : 'top-4 text-sm opacity-70'
							}`}
						>
							Ask about projects, case studies, or posts…
						</label>
						<button
							type="submit"
							className="absolute bottom-3 right-3 inline-flex size-9 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--on-accent)] shadow-sm transition-transform duration-150 hover:scale-105 hover:bg-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60 active:scale-95 disabled:opacity-50"
							aria-label={chatState === 'loading' ? 'Sending message' : 'Send message'}
							disabled={chatState === 'loading'}
						>
							{chatState === 'loading' ? (
								<svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M8.757 8.757 6.636 6.636m12.728 0-2.121 2.121M8.757 15.243l-2.121 2.121" />
								</svg>
							) : (
								<svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
									<path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4.5 3m0-6L5 12m13.5-7.5-13 7a1 1 0 0 0 0 1.8l13 7A1 1 0 0 0 20 20.5v-17a1 1 0 0 0-1.5-.9Z" />
								</svg>
							)}
						</button>
					</div>
					<div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[0.65rem] text-[color:var(--fg)]/60">
						<span>Shift+Enter for a new line</span>
						<span className="flex gap-2">
							<span className="whitespace-nowrap">⌘K / Ctrl+K reopens</span>
							<span className="whitespace-nowrap">/ focuses input</span>
						</span>
					</div>
				</form>
			</div>
		</div>
	);
}
