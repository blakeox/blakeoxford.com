import { useMemo, useRef, useState } from 'react';

import type { ChatMessage, ChatState, LoadingPhase, SearchFallback } from '@/lib/chat';
import {
  INITIAL_ASSISTANT_MESSAGE,
  PREFERENCES_STORAGE_KEY,
  getBooleanPreference,
} from '@/lib/chat';

import { useChatInteraction } from './useChatInteraction';
import { useChatPersistence } from './useChatPersistence';
import { useChatSession } from './useChatSession';
import { useChatStreaming } from './useChatStreaming';

/**
 * Central controller hook that encapsulates all chat state, effects, and actions.
 * Consolidating this logic keeps the island component focused on rendering.
 *
 * Composed surfaces (4 hook calls):
 * 1. interaction — voice, UI, scroll, keyboard, copy, input, touch, bridge
 * 2. persistence — storage, lifecycle, effects (needs voice + UI from interaction)
 * 3. streaming — query + message processing
 * 4. session — websocket, analytics, message actions, computed values
 *
 * Lifecycle/streaming callbacks are deferred via refs so interaction can run
 * before persistence and streaming without circular hook order.
 */
export function useAIChatController() {
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
  const sourceRefs = useRef<HTMLAnchorElement[]>([]);

  // Deferred lifecycle / streaming so interaction can run first (voice + UI).
  const openChatRef = useRef<() => void>(() => {});
  const closeChatRef = useRef<() => void>(() => {});
  const focusInputRef = useRef<() => void>(() => {});
  const sendQueryRef = useRef<(query: string) => Promise<void>>(async () => {});

  const interaction = useChatInteraction({
    isOpen,
    messages,
    chatState,
    setUseMemory,
    setInputValue,
    panelRef,
    scrollContainerRef,
    openChat: () => openChatRef.current(),
    closeChat: () => closeChatRef.current(),
    focusInput: () => focusInputRef.current(),
    sourceRefs,
    sendQuery: (query) => sendQueryRef.current(query),
  });

  const { openChat, closeChat, focusInput, canRetry, lastQueryValue } = useChatPersistence({
    messages,
    useMemory,
    onMessagesRestored: setMessages,
    maxRestoreMessages: 30,
    isOpen,
    setIsOpen,
    setError,
    setChatState,
    isListening: interaction.isListening,
    toggleListening: interaction.toggleListening,
    inputRef,
    lastFocusedElementRef: lastFocusedElement,
    fallbackResults,
    chatState,
    setShowFallbackSuggestions: interaction.setShowFallbackSuggestions,
    launcherRef,
    messagesRef,
    activeRequestRef,
    lastQueryRef,
    sourceRefs,
  });

  openChatRef.current = openChat;
  closeChatRef.current = closeChat;
  focusInputRef.current = focusInput;

  const {
    sendQuery,
    handleSubmit,
    handleReplayQuery,
    handleGuidedPrompt,
    clearConversation,
    startNewChat,
  } = useChatStreaming({
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
    setShowScrollToLatest: interaction.setShowScrollToLatest,
    inputValue,
    setInputValue,
    openChat,
    focusInput,
    showDigest: interaction.showDigest,
    showAnalytics: interaction.showAnalytics,
    toggleDigest: interaction.toggleDigest,
    toggleAnalytics: interaction.toggleAnalytics,
    setShowFallbackSuggestions: interaction.setShowFallbackSuggestions,
    setExpandedSources: interaction.setExpandedSources,
    setComposerFocused: interaction.setComposerFocused,
  });

  sendQueryRef.current = sendQuery;

  const session = useChatSession({
    isOpen,
    messages,
    setMessages,
    interimTranscript: interaction.interimTranscript,
    inputValue,
    composerFocused: interaction.composerFocused,
    showFallbackSuggestions: interaction.showFallbackSuggestions,
    fallbackResults,
    lastQueryRef,
    messagesRef,
    copyWithFeedback: interaction.copyWithFeedback,
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
    voiceSupported: interaction.voiceSupported,
    isListening: interaction.isListening,
    interimTranscript: interaction.interimTranscript,
    toggleListening: interaction.toggleListening,
    wsConnected: session.wsConnected,
    activeUsers: session.activeUsers,
    isOtherUserTyping: session.isOtherUserTyping,
    wsRef: session.wsRef,
    showDigest: interaction.showDigest,
    showAnalytics: interaction.showAnalytics,
    showAdvancedControls: interaction.showAdvancedControls,
    showFallbackSuggestions: interaction.showFallbackSuggestions,
    composerFocused: interaction.composerFocused,
    showScrollToLatest: interaction.showScrollToLatest,
    expandedSources: interaction.expandedSources,
    expandedIndividualSources: interaction.expandedIndividualSources,
    toggleDigest: interaction.toggleDigest,
    toggleAnalytics: interaction.toggleAnalytics,
    toggleAdvancedControls: interaction.toggleAdvancedControls,
    setShowFallbackSuggestions: interaction.setShowFallbackSuggestions,
    setFallbackResults,
    setComposerFocused: interaction.setComposerFocused,
    setShowScrollToLatest: interaction.setShowScrollToLatest,
    toggleExpandedSource: interaction.toggleExpandedSource,
    toggleIndividualSource: interaction.toggleIndividualSource,
    openChat,
    closeChat,
    focusInput,
    touchStartY: interaction.touchStartY,
    touchCurrentY: interaction.touchCurrentY,
    handleTouchStart: interaction.handleTouchStart,
    handleTouchMove: interaction.handleTouchMove,
    handleTouchEnd: interaction.handleTouchEnd,
    canRetry,
    lastQueryValue,
    sourceRefs,
    scrollToLatest: interaction.scrollToLatest,
    recentQueries: session.recentQueries,
    conversationDigest: session.conversationDigest,
    feedbackAnalytics: session.feedbackAnalytics,
    guidedPromptVisible: session.guidedPromptVisible,
    composerHasValue: session.composerHasValue,
    floatingLabelActive: session.floatingLabelActive,
    canStartNewChat: session.canStartNewChat,
    copiedMessageId: interaction.copiedMessageId,
    copiedShareUrl: interaction.copiedShareUrl,
    copyWithFeedback: interaction.copyWithFeedback,
    clearConversation,
    startNewChat,
    handleFeedback: session.handleFeedback,
    handleCopyMessage: session.handleCopyMessage,
    handleOpenPrimarySource: session.handleOpenPrimarySource,
    handleExportConversation: session.handleExportConversation,
    toggleMemory: interaction.toggleMemory,
    toggleVoiceInput: interaction.toggleVoiceInput,
    handleTextareaKeyDown: interaction.handleTextareaKeyDown,
    sendQuery,
    handleSubmit,
    handleReplayQuery,
    handleGuidedPrompt,
    visibleFallbackResults: session.visibleFallbackResults,
    hasMoreFallbackResults: session.hasMoreFallbackResults,
  };
}
