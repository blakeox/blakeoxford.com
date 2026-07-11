/**
 * Type definitions for AI Chat Island component
 */

// Re-export from conversation-utils to ensure consistency
export type { ChatMessage } from './conversation-utils';

/** Simplified mutable ref shape to avoid deprecated React types */
export type MutableRef<T> = { current: T };

export type ChatState = 'idle' | 'loading' | 'ready';

export type LoadingPhase = 'searching' | 'analyzing' | 'crafting' | null;

export type SearchFallback = {
	title: string;
	url: string;
	excerpt?: string;
	score: number;
};

export type SpeechRecognitionLike = {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	maxAlternatives: number;
	start: () => void;
	stop: () => void;
	abort?: () => void;
	onresult: ((event: { results: Array<{ isFinal: boolean; 0?: { transcript?: string } }> }) => void) | null;
	onerror: ((event: unknown) => void) | null;
	onend: (() => void) | null;
};

// Initial message for chat
import type { ChatMessage } from './conversation-utils';

export const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
	id: 'welcome',
	role: 'assistant',
	content: 'Ask about projects, case studies, or posts.',
	timestamp: Date.now(),
};
