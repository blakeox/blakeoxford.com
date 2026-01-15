/**
 * Conversation management utilities
 */

import type { AIChatSource } from '../ai-search';

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
	sources?: AIChatSource[];
	qualityScore?: number;
	qualityDetails?: {
		completeness: number;
		citationAccuracy: number;
		conciseness: number;
		relevance: number;
		reasoning: string;
	};
	citationHealth?: 'healthy' | 'warning' | 'error'; // Source health status
	feedback?: 'positive' | 'negative';
	responseTime?: number; // Response time in milliseconds (for assistant messages)
	retryCount?: number;
	error?: {
		category: string;
		message: string;
		retryable: boolean;
	};
}

/**
 * Filter messages based on search query
 * @param messages - Array of chat messages
 * @param query - Search query string
 * @returns Filtered messages matching the query
 */
export function filterMessages(messages: ChatMessage[], query: string): ChatMessage[] {
	if (!query.trim()) return messages;

	const lowerQuery = query.toLowerCase();
	return messages.filter((msg) => {
		// Search in content
		if (msg.content.toLowerCase().includes(lowerQuery)) return true;

		// Search in sources
		if (msg.sources) {
			return msg.sources.some(
				(src) =>
					src.title.toLowerCase().includes(lowerQuery) ||
					src.snippet?.toLowerCase().includes(lowerQuery)
			);
		}

		return false;
	});
}

/**
 * Calculate conversation analytics
 * @param messages - Array of chat messages
 * @returns Analytics data about the conversation
 */
export function calculateConversationAnalytics(messages: ChatMessage[]): {
	totalMessages: number;
	userMessages: number;
	assistantMessages: number;
	totalSources: number;
	avgResponseTimeMs: number;
	avgQualityScore: number;
	feedbackStats: {
		positive: number;
		negative: number;
		total: number;
	};
} {
	const userMessages = messages.filter((m) => m.role === 'user');
	const assistantMessages = messages.filter((m) => m.role === 'assistant');

	const totalSources = assistantMessages.reduce((sum, msg) => sum + (msg.sources?.length || 0), 0);

	// Calculate average response time (time between user message and assistant response)
	const responseTimes: number[] = [];
	for (let i = 1; i < messages.length; i++) {
		if (messages[i].role === 'assistant' && messages[i - 1].role === 'user') {
			responseTimes.push(messages[i].timestamp - messages[i - 1].timestamp);
		}
	}
	const avgResponseTimeMs =
		responseTimes.length > 0
			? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
			: 0;

	// Calculate average quality score
	const qualityScores = assistantMessages
		.map((m) => m.qualityScore)
		.filter((s): s is number => s !== undefined);
	const avgQualityScore =
		qualityScores.length > 0
			? qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length
			: 0;

	// Feedback statistics
	const feedbackMessages = assistantMessages.filter((m) => m.feedback);
	const feedbackStats = {
		positive: feedbackMessages.filter((m) => m.feedback === 'positive').length,
		negative: feedbackMessages.filter((m) => m.feedback === 'negative').length,
		total: feedbackMessages.length,
	};

	return {
		totalMessages: messages.length,
		userMessages: userMessages.length,
		assistantMessages: assistantMessages.length,
		totalSources,
		avgResponseTimeMs: Math.round(avgResponseTimeMs),
		avgQualityScore: Math.round(avgQualityScore),
		feedbackStats,
	};
}

/**
 * Enhance user query with conversation context
 * @param query - User's query
 * @param hasHistory - Whether there's conversation history
 * @returns Enhanced query string
 */
export function enhanceQuery(query: string, hasHistory: boolean): string {
	if (!hasHistory) {
		return query;
	}

	// Add context indicators for follow-up questions
	const followUpIndicators = /^(and|also|what about|how about|can you|could you|please)/i;
	if (followUpIndicators.test(query.trim())) {
		return `Follow-up: ${query}`;
	}

	return query;
}

/**
 * Export conversation to markdown format
 * @param messages - Array of chat messages
 * @returns Markdown formatted conversation
 */
export function exportToMarkdown(messages: ChatMessage[]): string {
	const lines = ['# AI Chat Conversation', '', `*Exported: ${new Date().toLocaleString()}*`, ''];

	for (const msg of messages) {
		const timestamp = new Date(msg.timestamp).toLocaleTimeString();
		const role = msg.role === 'user' ? '**You**' : '**AI Assistant**';

		lines.push(`### ${role} (${timestamp})`, '', msg.content, '');

		if (msg.sources && msg.sources.length > 0) {
			lines.push('**Sources:**', '');
			for (const src of msg.sources) {
				lines.push(`- [${src.title}](${src.url})`);
			}
			lines.push('');
		}

		if (msg.qualityScore) {
			lines.push(`*Quality Score: ${msg.qualityScore}%*`, '');
		}

		lines.push('---', '');
	}

	return lines.join('\n');
}

/**
 * Export conversation to JSON format
 * @param messages - Array of chat messages
 * @returns JSON string of conversation
 */
export function exportToJSON(messages: ChatMessage[]): string {
	return JSON.stringify(
		{
			exported: new Date().toISOString(),
			version: '1.0',
			messages: messages.map((msg) => ({
				id: msg.id,
				role: msg.role,
				content: msg.content,
				timestamp: msg.timestamp,
				sources: msg.sources,
				qualityScore: msg.qualityScore,
				qualityDetails: msg.qualityDetails,
				feedback: msg.feedback,
			})),
		},
		null,
		2
	);
}
