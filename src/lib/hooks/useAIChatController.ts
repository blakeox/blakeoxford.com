import { useMemo, useRef, useState } from 'react';

import type {
	ChatMessage,
	ChatState,
	LoadingPhase,
	SearchFallback,
} from '../chat';
import {
	INITIAL_ASSISTANT_MESSAGE,
	PREFERENCES_STORAGE_KEY,
	buildHistoryForRequest,
	getBooleanPreference,
} from '../chat';

// Local hook imports (not using barrel to avoid circular dependency)
import { useConversationAnalytics } from './useConversationAnalytics';
import { useConversationWebSocket } from './useConversationWebSocket';
import { useCopyFeedback } from './useCopyFeedback';
import { useChatEffects } from './useChatEffects';
import { useChatLifecycle } from './useChatLifecycle';
import { useChatStorage } from './useChatStorage';
import { useComputedValues } from './useComputedValues';
import { useInputHandlers } from './useInputHandlers';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useMessageActions } from './useMessageActions';
import { useMessageProcessing } from './useMessageProcessing';
import { useQueryManagement } from './useQueryManagement';
import { useScrollManagement } from './useScrollManagement';
import { useTouchGestures } from './useTouchGestures';
import { useUIState } from './useUIState';
import { useVoiceRecognition } from './useVoiceRecognition';

/**
 * Central controller hook that encapsulates all chat state, effects, and actions.
 * Consolidating this logic keeps the island component focused on rendering.
 */
export function useAIChatController() {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
	const [inputValue, setInputValue] = useState('');
	const [chatState, setChatState] = useState<ChatState>('idle');
	const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
	const [error, setError] = useState<string | null>(null);
	const [useMemory, setUseMemory] = useState<boolean>(() =>
		getBooleanPreference(PREFERENCES_STORAGE_KEY, 'useMemory', true),
	);
	const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
	const [sessionStartTime] = useState<number>(() => Date.now());
	const [fallbackResults, setFallbackResults] = useState<SearchFallback[]>([]);
	const [retryCount, setRetryCount] = useState(0);
	const [lastFailedQuery, setLastFailedQuery] = useState('');

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
	const typingTimeoutRef = useRef<number | null>(null);

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

	const { wsConnected, activeUsers, isOtherUserTyping, wsRef } = useConversationWebSocket({
		conversationId: 'default',
		userId: 'anonymous',
		isOpen,
		connectDelay: 1000,
	});

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
	} = useUIState();

	useChatStorage({
		messages,
		useMemory,
		onMessagesRestored: setMessages,
		maxRestoreMessages: 30,
	});

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

	const { touchStartY, touchCurrentY, handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures({
		onSwipeDown: closeChat,
		swipeThreshold: 100,
		enabled: isOpen,
	});

	const { canRetry, lastQueryValue, sourceRefs } = useChatEffects({
		isOpen,
		messages,
		fallbackResults,
		chatState,
		focusInput,
		dispatchState,
		setShowFallbackSuggestions,
		closeChat,
		launcherRef,
		messagesRef,
		activeRequestRef,
		lastQueryRef,
	});

	useKeyboardShortcuts({
		enabled: isOpen,
		onOpen: openChat,
		onClose: closeChat,
		onToggle: () => (isOpen ? closeChat() : openChat()),
		panelRef,
		sourceRefs,
	});

	const { scrollToLatest } = useScrollManagement({
		containerRef: scrollContainerRef,
		enabled: isOpen,
		scrollTrigger: messages,
		showScrollButton: showScrollToLatest,
		onScrollButtonChange: setShowScrollToLatest,
		scrollThreshold: 48,
	});

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

	const { copiedMessageId, copiedShareUrl, copyWithFeedback } = useCopyFeedback({
		resetDelay: 2000,
	});

	const {
		updateFallbackSuggestions,
		appendAssistantChunk,
		finalizeAssistantMessage,
		assignAssistantSources,
		clearConversation,
		startNewChat,
	} = useMessageProcessing({
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
	});

	const { handleFeedback, handleCopyMessage, handleOpenPrimarySource, handleExportConversation } = useMessageActions({
		messages,
		setMessages,
		lastQueryRef,
		messagesRef,
		copyWithFeedback,
	});

	const { toggleMemory, toggleVoiceInput, handleTextareaKeyDown } = useInputHandlers({
		chatState,
		voiceSupported,
		setUseMemory,
		openChat,
		toggleListening,
	});

	const { sendQuery, handleSubmit, handleReplayQuery, handleGuidedPrompt } = useQueryManagement({
		inputValue,
		setInputValue,
		openChat,
		focusInput,
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
	});

	const { visibleFallbackResults, hasMoreFallbackResults } = useComputedValues({
		showFallbackSuggestions,
		fallbackResults,
	});

	return {
		isOpen,
		messages,
		inputValue,
		setInputValue,
		chatState,
		loadingPhase,
		error,
		setError,
		useMemory,
		streamingMessageId,
		sessionStartTime,
		fallbackResults,
		retryCount,
		setRetryCount,
		lastFailedQuery,
		siteHostname,
		panelRef,
		inputRef,
		scrollContainerRef,
		launcherRef,
		messagesRef,
		typingTimeoutRef,
		voiceSupported,
		isListening,
		interimTranscript,
		toggleListening,
		wsConnected,
		activeUsers,
		isOtherUserTyping,
		wsRef,
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
		openChat,
		closeChat,
		focusInput,
		touchStartY,
		touchCurrentY,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		canRetry,
		lastQueryValue,
		sourceRefs,
		scrollToLatest,
		recentQueries,
		conversationDigest,
		feedbackAnalytics,
		guidedPromptVisible,
		composerHasValue,
		floatingLabelActive,
		canStartNewChat,
		copiedMessageId,
		copiedShareUrl,
		copyWithFeedback,
		clearConversation,
		startNewChat,
		handleFeedback,
		handleCopyMessage,
		handleOpenPrimarySource,
		handleExportConversation,
		toggleMemory,
		toggleVoiceInput,
		handleTextareaKeyDown,
		sendQuery,
		handleSubmit,
		handleReplayQuery,
		handleGuidedPrompt,
		visibleFallbackResults,
		hasMoreFallbackResults,
	};
}
