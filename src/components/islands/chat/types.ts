/**
 * Shared types for chat components
 */
import type { RefObject } from 'react';
import type { ChatMessage, ChatState, LoadingPhase, SearchFallback } from '../../../lib/chat';
import type { ConversationWebSocket } from '../../../lib/chat/conversation-ws';
import type { AIChatSource } from '../../../lib/ai-search';

// Re-export types for components that need them
export type { ChatMessage, ChatState, LoadingPhase, SearchFallback };

// Re-export Source type with a shorter alias
export type Source = AIChatSource;
export type { AIChatSource };

/**
 * Feedback analytics data
 */
export interface FeedbackAnalytics {
	totalAssistant: number;
	positive: number;
	negative: number;
	positiveRate: number | null;
}

/**
 * Props for ChatHeader component
 */
export interface ChatHeaderProps {
	wsConnected: boolean;
	activeUsers: number;
	voiceSupported: boolean;
	isListening: boolean;
	showAdvancedControls: boolean;
	toggleVoiceInput: () => void;
	toggleAdvancedControls: () => void;
	closeChat: () => void;
}

/**
 * Props for ChatAdvancedControls component
 */
export interface ChatAdvancedControlsProps {
	showAdvancedControls: boolean;
	useMemory: boolean;
	showDigest: boolean;
	showAnalytics: boolean;
	messages: ChatMessage[];
	feedbackAnalytics: FeedbackAnalytics;
	toggleMemory: () => void;
	toggleDigest: () => void;
	toggleAnalytics: () => void;
	clearConversation: () => void;
	handleExportConversation: () => void;
}

/**
 * Props for ChatGuidedPrompts component
 */
export interface ChatGuidedPromptsProps {
	visible: boolean;
	onSelectPrompt: (prompt: string) => void;
}

/**
 * Props for ChatRecentQueries component
 */
export interface ChatRecentQueriesProps {
	queries: string[];
	onReplayQuery: (query: string) => void;
}

/**
 * Props for ChatDigest component
 */
export interface ChatDigestProps {
	show: boolean;
	digest: string[];
}

/**
 * Props for ChatAnalytics component
 */
export interface ChatAnalyticsProps {
	show: boolean;
	messages: ChatMessage[];
	sessionStartTime: number;
	feedbackAnalytics: FeedbackAnalytics;
}

/**
 * Props for ChatQuickActions component
 */
export interface ChatQuickActionsProps {
	onAction: (query: string, label: string, category: string) => void;
	setInputValue: (value: string) => void;
}

/**
 * Props for ChatMessageBubble component
 */
export interface ChatMessageBubbleProps {
	message: ChatMessage;
	isStreaming: boolean;
	siteHostname: string;
	expandedSources: Record<string, boolean>;
	expandedIndividualSources: Record<string, boolean>;
	copiedMessageId: string | null;
	copiedShareUrl: string | null;
	messages: ChatMessage[];
	messagesRef: RefObject<ChatMessage[]>;
	sourceRefs: RefObject<HTMLAnchorElement[]>;
	toggleExpandedSource: (messageId: string) => void;
	toggleIndividualSource: (sourceKey: string) => void;
	handleFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
	handleCopyMessage: (message: ChatMessage) => void;
	handleOpenPrimarySource: (url: string) => void;
	setInputValue: (value: string) => void;
	sendQuery: (query: string) => void;
	copyWithFeedback: (content: string, id: string, type: 'message' | 'share') => Promise<boolean>;
}

/**
 * Props for ChatMessageList component
 */
export interface ChatMessageListProps {
	messages: ChatMessage[];
	chatState: ChatState;
	streamingMessageId: string | null;
	isOtherUserTyping: boolean;
	wsConnected: boolean;
	showScrollToLatest: boolean;
	siteHostname: string;
	expandedSources: Record<string, boolean>;
	expandedIndividualSources: Record<string, boolean>;
	copiedMessageId: string | null;
	copiedShareUrl: string | null;
	scrollContainerRef: RefObject<HTMLDivElement | null>;
	messagesRef: RefObject<ChatMessage[]>;
	sourceRefs: RefObject<HTMLAnchorElement[]>;
	toggleExpandedSource: (messageId: string) => void;
	toggleIndividualSource: (sourceKey: string) => void;
	handleFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
	handleCopyMessage: (message: ChatMessage) => void;
	handleOpenPrimarySource: (url: string) => void;
	scrollToLatest: () => void;
	setInputValue: (value: string) => void;
	sendQuery: (query: string) => void;
	copyWithFeedback: (content: string, id: string, type: 'message' | 'share') => Promise<boolean>;
}

/**
 * Props for ChatInput component
 */
export interface ChatInputProps {
	inputValue: string;
	chatState: ChatState;
	inputRef: RefObject<HTMLTextAreaElement | null>;
	wsRef: RefObject<ConversationWebSocket | null>;
	typingTimeoutRef: RefObject<number | null>;
	setInputValue: (value: string) => void;
	setComposerFocused: (focused: boolean) => void;
	handleTextareaKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
	handleSubmit: (e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
}

/**
 * Props for ChatStatusIndicators component
 */
export interface ChatStatusIndicatorsProps {
	chatState: ChatState;
	loadingPhase: LoadingPhase;
	isListening: boolean;
	interimTranscript: string;
	error: string | null;
	lastQueryValue: string | null;
	lastFailedQuery: string;
	retryCount: number;
	canRetry: boolean;
	setError: (error: string | null) => void;
	setRetryCount: (count: number) => void;
	sendQuery: (query: string) => void;
}

/**
 * Props for ChatFallbackResults component
 */
export interface ChatFallbackResultsProps {
	fallbackResults: SearchFallback[];
	visibleFallbackResults: SearchFallback[];
	hasMoreFallbackResults: boolean;
	showFallbackSuggestions: boolean;
	setShowFallbackSuggestions: (show: boolean) => void;
}

/**
 * Props for ChatNewChatPrompt component
 */
export interface ChatNewChatPromptProps {
	canStartNewChat: boolean;
	startNewChat: () => void;
}

/**
 * Props for ChatLauncher component
 */
export interface ChatLauncherProps {
	isOpen: boolean;
	launcherRef: RefObject<HTMLButtonElement | null>;
	openChat: () => void;
	closeChat: () => void;
}
