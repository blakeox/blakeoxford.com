/**
 * AI Search Service
 * 
 * Service layer for AI-powered search and chat functionality.
 * Encapsulates all API interactions with the AI search backend.
 * 
 * @module services/AISearchService
 */

import { AppError, ErrorCodes, createApiErrorFromResponse } from '../utils/errors';
import type { SearchFallback } from '../lib/chat';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AISearchRequest {
	query: string;
	history?: Array<{ role: 'user' | 'assistant'; content: string }>;
	useMemory?: boolean;
	sessionId?: string;
}

export interface AISearchResponse {
	answer: string;
	sources?: Array<{
		title: string;
		url: string;
		snippet?: string;
		score?: number;
		type?: string;
	}>;
	fallbackResults?: SearchFallback[];
	metadata?: {
		processingTime?: number;
		modelUsed?: string;
		tokensUsed?: number;
	};
}

export interface AISearchStreamCallbacks {
	onChunk: (chunk: string) => void;
	onSources?: (sources: AISearchResponse['sources']) => void;
	onComplete?: (response: AISearchResponse) => void;
	onError?: (error: AppError) => void;
}

export interface AISearchConfig {
	endpoint?: string;
	timeout?: number;
	maxRetries?: number;
	enableStreaming?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<AISearchConfig> = {
	endpoint: '/ai-search',
	timeout: 30000,
	maxRetries: 3,
	enableStreaming: true,
};

// ─── Service Class ────────────────────────────────────────────────────────────

/**
 * Service for interacting with the AI search API
 */
export class AISearchService {
	private config: Required<AISearchConfig>;
	private abortController: AbortController | null = null;

	constructor(config: AISearchConfig = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Send a query and get a streamed response
	 */
	async queryStream(
		request: AISearchRequest,
		callbacks: AISearchStreamCallbacks
	): Promise<void> {
		// Abort any existing request
		this.abort();
		this.abortController = new AbortController();

		const { query, history = [], useMemory = true, sessionId } = request;

		try {
			const response = await fetch(this.config.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'text/event-stream',
				},
				body: JSON.stringify({
					query,
					history,
					useMemory,
					sessionId,
					stream: true,
				}),
				signal: this.abortController.signal,
			});

			if (!response.ok) {
				const error = await createApiErrorFromResponse(response);
				callbacks.onError?.(error);
				throw error;
			}

			await this.processStream(response, callbacks);
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				// Request was cancelled, don't report as error
				return;
			}

			const appError = AppError.from(error, ErrorCodes.AI_INFERENCE_ERROR);
			callbacks.onError?.(appError);
			throw appError;
		}
	}

	/**
	 * Send a query and get a complete response (non-streaming)
	 */
	async query(request: AISearchRequest): Promise<AISearchResponse> {
		this.abort();
		this.abortController = new AbortController();

		const { query, history = [], useMemory = true, sessionId } = request;

		try {
			const response = await fetch(this.config.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					query,
					history,
					useMemory,
					sessionId,
					stream: false,
				}),
				signal: this.abortController.signal,
			});

			if (!response.ok) {
				throw await createApiErrorFromResponse(response);
			}

			const data = await response.json();
			return this.normalizeResponse(data);
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				throw new AppError('Request cancelled', ErrorCodes.CHAT_TIMEOUT);
			}
			throw AppError.from(error, ErrorCodes.AI_INFERENCE_ERROR);
		}
	}

	/**
	 * Abort the current request
	 */
	abort(): void {
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = null;
		}
	}

	/**
	 * Check if the service is available
	 */
	async healthCheck(): Promise<boolean> {
		try {
			const response = await fetch(`${this.config.endpoint}/health`, {
				method: 'GET',
				signal: AbortSignal.timeout(5000),
			});
			return response.ok;
		} catch {
			return false;
		}
	}

	// ─── Private Methods ──────────────────────────────────────────────────────

	private async processStream(
		response: Response,
		callbacks: AISearchStreamCallbacks
	): Promise<void> {
		const reader = response.body?.getReader();
		if (!reader) {
			throw new AppError('No response body', ErrorCodes.AI_INFERENCE_ERROR);
		}

		const decoder = new TextDecoder();
		let buffer = '';
		let fullResponse: AISearchResponse = { answer: '' };

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = line.slice(6);
						if (data === '[DONE]') {
							callbacks.onComplete?.(fullResponse);
							return;
						}

						try {
							const parsed = JSON.parse(data);
							this.handleStreamEvent(parsed, callbacks, fullResponse);
						} catch {
							// Not JSON, treat as raw text chunk
							callbacks.onChunk(data);
							fullResponse.answer += data;
						}
					}
				}
			}

			callbacks.onComplete?.(fullResponse);
		} finally {
			reader.releaseLock();
		}
	}

	private handleStreamEvent(
		event: Record<string, unknown>,
		callbacks: AISearchStreamCallbacks,
		fullResponse: AISearchResponse
	): void {
		if (event.type === 'chunk' && typeof event.content === 'string') {
			callbacks.onChunk(event.content);
			fullResponse.answer += event.content;
		} else if (event.type === 'sources' && Array.isArray(event.sources)) {
			fullResponse.sources = event.sources as AISearchResponse['sources'];
			callbacks.onSources?.(fullResponse.sources);
		} else if (event.type === 'fallback' && Array.isArray(event.results)) {
			fullResponse.fallbackResults = event.results as SearchFallback[];
		} else if (event.type === 'metadata') {
			fullResponse.metadata = event.data as AISearchResponse['metadata'];
		}
	}

	private normalizeResponse(data: unknown): AISearchResponse {
		if (typeof data !== 'object' || data === null) {
			throw new AppError('Invalid response format', ErrorCodes.AI_INFERENCE_ERROR);
		}

		const response = data as Record<string, unknown>;
		return {
			answer: typeof response.answer === 'string' ? response.answer : '',
			sources: Array.isArray(response.sources) ? response.sources : undefined,
			fallbackResults: Array.isArray(response.fallbackResults) ? response.fallbackResults : undefined,
			metadata: typeof response.metadata === 'object' ? response.metadata as AISearchResponse['metadata'] : undefined,
		};
	}
}

// ─── Singleton Instance ───────────────────────────────────────────────────────

let instance: AISearchService | null = null;

/**
 * Get the singleton AI search service instance
 */
export function getAISearchService(config?: AISearchConfig): AISearchService {
	if (!instance || config) {
		instance = new AISearchService(config);
	}
	return instance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetAISearchService(): void {
	instance?.abort();
	instance = null;
}
