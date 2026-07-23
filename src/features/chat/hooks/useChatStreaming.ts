import { buildHistoryForRequest } from '@/lib/chat';
import type { ChatMessage, ChatState, LoadingPhase, MutableRef, SearchFallback } from '@/lib/chat';

import { useMessageProcessing } from './internal/useMessageProcessing';
import { useQueryManagement } from './internal/useQueryManagement';

/**
 * Options for the composed chat streaming hook.
 * Combines query submission and message-processing concerns the controller
 * previously wired by hand.
 */
export interface UseChatStreamingOptions {
  chatState: ChatState;
  setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
  setLoadingPhase: React.Dispatch<React.SetStateAction<LoadingPhase>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setStreamingMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  setFallbackResults: React.Dispatch<React.SetStateAction<SearchFallback[]>>;
  setRetryCount: React.Dispatch<React.SetStateAction<number>>;
  setLastFailedQuery: React.Dispatch<React.SetStateAction<string>>;
  retryCount: number;
  useMemory: boolean;
  lastQueryRef: MutableRef<string | null>;
  messagesRef: MutableRef<ChatMessage[]>;
  activeRequestRef: MutableRef<AbortController | null>;
  scrollContainerRef: MutableRef<HTMLDivElement | null>;
  setShowScrollToLatest: (show: boolean) => void;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  openChat: () => void;
  focusInput: () => void;
  showDigest: boolean;
  showAnalytics: boolean;
  toggleDigest: () => void;
  toggleAnalytics: () => void;
  setShowFallbackSuggestions: (show: boolean) => void;
  setExpandedSources: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setComposerFocused: (focused: boolean) => void;
}

/**
 * Return shape for chat streaming — everything the controller needs from
 * query management and message processing.
 */
export interface UseChatStreamingReturn {
  sendQuery: (query: string) => Promise<void>;
  handleSubmit: (event: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
  handleReplayQuery: (query: string) => Promise<void>;
  handleGuidedPrompt: (prompt: string) => void;
  clearConversation: () => void;
  startNewChat: () => void;
}

/**
 * Composes query management + message processing into a single streaming surface.
 *
 * Internally wires stream chunk / source / finalize callbacks from message
 * processing into query management so the controller does not do that glue.
 */
export function useChatStreaming(options: UseChatStreamingOptions): UseChatStreamingReturn {
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
    setShowScrollToLatest,
    inputValue,
    setInputValue,
    openChat,
    focusInput,
    showDigest,
    showAnalytics,
    toggleDigest,
    toggleAnalytics,
    setShowFallbackSuggestions,
    setExpandedSources,
    setComposerFocused,
  } = options;

  const {
    appendAssistantChunk,
    finalizeAssistantMessage,
    assignAssistantSources,
    assignAssistantProvenance,
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
    setShowScrollToLatest,
    appendAssistantChunk,
    assignAssistantSources,
    assignAssistantProvenance,
    finalizeAssistantMessage,
    buildHistoryForRequest,
  });

  return {
    sendQuery,
    handleSubmit,
    handleReplayQuery,
    handleGuidedPrompt,
    clearConversation,
    startNewChat,
  };
}
