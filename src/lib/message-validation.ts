/**
 * Message validation and restoration utilities
 * Handles safe restoration of chat messages from storage
 */

import type { AIChatSource } from './ai-search';

// Local type definition to avoid circular dependencies
type ChatMessage = {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	sources?: AIChatSource[];
	feedback?: 'positive' | 'negative';
	qualityScore?: number;
	qualityDetails?: {
		completeness: number;
		citationAccuracy: number;
		conciseness: number;
		relevance: number;
		reasoning: string;
	};
	citationHealth?: 'healthy' | 'warning' | 'error';
	timestamp?: number;
	responseTime?: number;
};

/**
 * Validate that a value is a valid chat message
 */
function isValidMessage(item: unknown): item is ChatMessage {
	if (!item || typeof item !== 'object') return false;
	
	const msg = item as Partial<ChatMessage>;
	return (
		(msg.role === 'user' || msg.role === 'assistant') &&
		typeof msg.id === 'string' &&
		typeof msg.content === 'string'
	);
}

/**
 * Validate and sanitize a source object
 */
function isValidSource(source: unknown): source is AIChatSource {
	if (!source || typeof source !== 'object') return false;
	
	const src = source as Partial<AIChatSource>;
	return (
		typeof src.title === 'string' &&
		typeof src.url === 'string'
	);
}

/**
 * Sanitize sources array, limiting to maximum count
 */
function sanitizeSources(sources: unknown, maxSources = 5): AIChatSource[] | undefined {
	if (!Array.isArray(sources)) return undefined;
	
	return sources
		.filter(isValidSource)
		.slice(0, maxSources);
}

/**
 * Sanitize feedback value
 */
function sanitizeFeedback(feedback: unknown): 'positive' | 'negative' | undefined {
	if (feedback === 'positive' || feedback === 'negative') {
		return feedback;
	}
	return undefined;
}

/**
 * Sanitize quality score
 */
function sanitizeQualityScore(score: unknown): number | undefined {
	return typeof score === 'number' ? score : undefined;
}

/**
 * Sanitize citation health status
 */
function sanitizeCitationHealth(health: unknown): 'healthy' | 'warning' | 'error' | undefined {
	if (health === 'healthy' || health === 'warning' || health === 'error') {
		return health;
	}
	return undefined;
}

/**
 * Restore messages from storage with validation and sanitization
 * @param stored - Raw stored data
 * @param maxMessages - Maximum messages to restore
 * @returns Validated chat messages or empty array
 */
export function restoreMessages(stored: unknown, maxMessages = 30): ChatMessage[] {
	if (!Array.isArray(stored) || stored.length === 0) {
		return [];
	}

	const restored = stored
		.filter(isValidMessage)
		.slice(-maxMessages)
		.map((item): ChatMessage => {
			const sources = sanitizeSources(item.sources);
			const feedback = sanitizeFeedback(item.feedback);
			const qualityScore = sanitizeQualityScore(item.qualityScore);
			const citationHealth = sanitizeCitationHealth(item.citationHealth);

			return {
				id: item.id,
				role: item.role,
				content: item.content,
				sources,
				feedback,
				qualityScore,
				citationHealth,
			} as ChatMessage;
		});

	return restored;
}
