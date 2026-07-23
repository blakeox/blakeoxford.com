import type { Dispatch, SetStateAction } from 'react';
import type { ChatMessage, ConversationWebSocket, MutableRef, SearchFallback } from '@/lib/chat';

import { useComputedValues } from './useComputedValues';
import {
  useConversationAnalytics,
  type FeedbackAnalytics,
} from './useConversationAnalytics';
import { useConversationWebSocket } from './useConversationWebSocket';
import { useMessageActions } from './useMessageActions';

/**
 * Options for the composed chat session hook.
 * Combines WebSocket presence, conversation analytics, message actions,
 * and computed fallback values the controller previously wired by hand.
 */
export interface UseChatSessionOptions {
  isOpen: boolean;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  interimTranscript: string;
  inputValue: string;
  composerFocused: boolean;
  showFallbackSuggestions: boolean;
  fallbackResults: SearchFallback[];
  lastQueryRef: MutableRef<string | null>;
  messagesRef: MutableRef<ChatMessage[]>;
  copyWithFeedback: (content: string, id: string, type: 'message' | 'share') => Promise<boolean>;
  conversationId?: string;
  userId?: string;
  connectDelay?: number;
}

/**
 * Return shape for chat session — presence, analytics, actions, and computed values.
 */
export interface UseChatSessionReturn {
  wsConnected: boolean;
  activeUsers: number;
  isOtherUserTyping: boolean;
  wsRef: MutableRef<ConversationWebSocket | null>;
  recentQueries: string[];
  conversationDigest: string[];
  feedbackAnalytics: FeedbackAnalytics;
  guidedPromptVisible: boolean;
  composerHasValue: boolean;
  floatingLabelActive: boolean;
  canStartNewChat: boolean;
  handleFeedback: (messageId: string, sentiment: 'positive' | 'negative') => Promise<void>;
  handleCopyMessage: (message: ChatMessage) => Promise<void>;
  handleOpenPrimarySource: (url: string) => void;
  handleExportConversation: () => void;
  visibleFallbackResults: SearchFallback[];
  hasMoreFallbackResults: boolean;
}

/**
 * Composes WebSocket + analytics + message actions + computed values.
 */
export function useChatSession(options: UseChatSessionOptions): UseChatSessionReturn {
  const {
    isOpen,
    messages,
    setMessages,
    interimTranscript,
    inputValue,
    composerFocused,
    showFallbackSuggestions,
    fallbackResults,
    lastQueryRef,
    messagesRef,
    copyWithFeedback,
    conversationId = 'default',
    userId = 'anonymous',
    connectDelay = 1000,
  } = options;

  const { wsConnected, activeUsers, isOtherUserTyping, wsRef } = useConversationWebSocket({
    conversationId,
    userId,
    isOpen,
    connectDelay,
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

  const { handleFeedback, handleCopyMessage, handleOpenPrimarySource, handleExportConversation } =
    useMessageActions({
      messages,
      setMessages,
      lastQueryRef,
      messagesRef,
      copyWithFeedback,
    });

  const { visibleFallbackResults, hasMoreFallbackResults } = useComputedValues({
    showFallbackSuggestions,
    fallbackResults,
  });

  return {
    wsConnected,
    activeUsers,
    isOtherUserTyping,
    wsRef,
    recentQueries,
    conversationDigest,
    feedbackAnalytics,
    guidedPromptVisible,
    composerHasValue,
    floatingLabelActive,
    canStartNewChat,
    handleFeedback,
    handleCopyMessage,
    handleOpenPrimarySource,
    handleExportConversation,
    visibleFallbackResults,
    hasMoreFallbackResults,
  };
}
