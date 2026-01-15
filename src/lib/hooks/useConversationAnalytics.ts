/**
 * Conversation Analytics Hook
 * 
 * Custom React hook for computing conversation analytics and derived state.
 * Provides memoized calculations for queries, digests, feedback, and UI state.
 * 
 * @module hooks/useConversationAnalytics
 */

import { useMemo } from 'react';
import type { ChatMessage } from '../chat/chat-types';
import { INITIAL_ASSISTANT_MESSAGE } from '../chat/chat-types';
import { decodeHtmlEntities } from '../string-utils';

export interface ConversationAnalyticsOptions {
	/** Array of chat messages */
	messages: ChatMessage[];
	/** Current interim transcript from voice input */
	interimTranscript?: string;
	/** Current input value */
	inputValue?: string;
	/** Whether composer is focused */
	composerFocused?: boolean;
}

export interface FeedbackAnalytics {
	/** Total number of assistant messages */
	totalAssistant: number;
	/** Number of positive feedback */
	positive: number;
	/** Number of negative feedback */
	negative: number;
	/** Positive feedback rate percentage */
	positiveRate: number | null;
	/** Top cited sources */
	topSources: Array<{
		url: string;
		title: string;
		count: number;
	}>;
}

export interface ConversationAnalyticsReturn {
	/** Last 3 user queries in reverse order */
	recentQueries: string[];
	/** Digest of last 3 assistant messages (first sentence, max 140 chars) */
	conversationDigest: string[];
	/** Feedback and citation analytics */
	feedbackAnalytics: FeedbackAnalytics;
	/** Whether guided prompts should be visible */
	guidedPromptVisible: boolean;
	/** Whether composer has any value */
	composerHasValue: boolean;
	/** Whether floating label should be active */
	floatingLabelActive: boolean;
	/** Whether user can start a new chat */
	canStartNewChat: boolean;
}

/**
 * Custom hook for computing conversation analytics and derived state
 * 
 * Provides comprehensive conversation insights including:
 * - Recent user queries
 * - Conversation digest
 * - Feedback analytics
 * - Citation tracking
 * - UI state derivations
 * 
 * Features:
 * - Memoized calculations for performance
 * - Filtered and sorted data
 * - Top sources by citation count
 * - Feedback rate calculations
 * - UI state helpers
 * 
 * Common use cases:
 * - Chat analytics dashboards
 * - Conversation summaries
 * - Quality metrics
 * - UI state management
 * 
 * @example
 * ```tsx
 * const {
 *   recentQueries,
 *   conversationDigest,
 *   feedbackAnalytics,
 *   guidedPromptVisible,
 *   composerHasValue,
 * } = useConversationAnalytics({
 *   messages,
 *   interimTranscript,
 *   inputValue,
 *   composerFocused,
 * });
 * ```
 * 
 * @param options - Configuration options
 * @returns Analytics and derived state
 */
export function useConversationAnalytics(
	options: ConversationAnalyticsOptions
): ConversationAnalyticsReturn {
	const {
		messages,
		interimTranscript = '',
		inputValue = '',
		composerFocused = false,
	} = options;

	/**
	 * Extract last 3 user queries in reverse chronological order
	 */
	const recentQueries = useMemo(() => {
		return messages
			.filter((message) => message.role === 'user')
			.map((message) => message.content.trim())
			.filter((value) => value.length > 0)
			.slice(-3)
			.reverse();
	}, [messages]);

	/**
	 * Create digest of last 3 assistant responses
	 * Takes first sentence of each, truncated to 140 chars
	 */
	const conversationDigest = useMemo(() => {
		const assistantMessages = messages.filter(
			(message) => message.role === 'assistant' && message.id !== INITIAL_ASSISTANT_MESSAGE.id,
		);
		
		if (assistantMessages.length === 0) return [] as string[];
		
		return assistantMessages
			.slice(-3)
			.map((message) => {
				const segment = message.content.split(/(?<=[.!?])\s+/u)[0]?.trim() ?? '';
				if (!segment) return '';
				return segment.length > 140 ? `${segment.slice(0, 137).trim()}…` : segment;
			})
			.filter((value) => value.length > 0);
	}, [messages]);

	/**
	 * Calculate feedback analytics and top cited sources
	 */
	const feedbackAnalytics = useMemo(() => {
		const assistantMessages = messages.filter(
			(message) => message.role === 'assistant' && message.id !== INITIAL_ASSISTANT_MESSAGE.id,
		);
		
		const totalAssistant = assistantMessages.length;
		const positive = assistantMessages.filter((message) => message.feedback === 'positive').length;
		const negative = assistantMessages.filter((message) => message.feedback === 'negative').length;
		
		// Track citations by URL
		const cited = new Map<
			string,
			{
				url: string;
				title: string;
				count: number;
			}
		>();
		
		assistantMessages.forEach((message) => {
			message.sources?.forEach((source) => {
				if (!source.url) return;
				const existing = cited.get(source.url) ?? {
					url: source.url,
					title: decodeHtmlEntities(source.title || source.url),
					count: 0,
				};
				existing.count += 1;
				cited.set(source.url, existing);
			});
		});
		
		const topSources = Array.from(cited.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 3);
		
		return {
			totalAssistant,
			positive,
			negative,
			positiveRate: totalAssistant > 0 ? Math.round((positive / totalAssistant) * 100) : null,
			topSources,
		};
	}, [messages]);

	/**
	 * Determine if guided prompts should be shown
	 * Only show when no user messages yet
	 */
	const guidedPromptVisible = useMemo(
		() => messages.filter((message) => message.role === 'user').length === 0,
		[messages]
	);

	/**
	 * Check if composer has any value (input or voice)
	 */
	const composerHasValue = useMemo(
		() => inputValue.trim().length > 0 || interimTranscript.length > 0,
		[inputValue, interimTranscript]
	);

	/**
	 * Determine if floating label should be active
	 */
	const floatingLabelActive = useMemo(
		() => composerFocused || composerHasValue,
		[composerFocused, composerHasValue]
	);

	/**
	 * Check if user can start a new chat
	 * Requires at least one exchange (2+ messages)
	 */
	const canStartNewChat = useMemo(
		() => messages.length > 1,
		[messages.length]
	);

	return {
		recentQueries,
		conversationDigest,
		feedbackAnalytics,
		guidedPromptVisible,
		composerHasValue,
		floatingLabelActive,
		canStartNewChat,
	};
}
