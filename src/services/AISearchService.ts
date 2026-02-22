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

				// Process complete SSE events delimited by double-newline (\n\n or \r\n\r\n)
				let boundaryIdx = buffer.indexOf('\n\n');
				if (boundaryIdx === -1) boundaryIdx = buffer.indexOf('\r\n\r\n');
				while (boundaryIdx !== -1) {
					const eventBlock = buffer.slice(0, boundaryIdx);
					buffer = buffer.slice(boundaryIdx + (buffer[boundaryIdx] === '\r' ? 4 : 2));

					// Extract data: lines
					const lines = eventBlock.split(/\r?\n/);
					let dataPayload = '';
					for (const l of lines) {
						if (/^data:\s*/i.test(l)) {
							dataPayload += l.slice(l.indexOf(':') + 1) + '\n';
						} else if (l.trim()) {
							// accept other non-empty lines as potential payload fragments
							dataPayload += l + '\n';
						}
					}
					dataPayload = dataPayload.trim();

					if (!dataPayload) {
						boundaryIdx = buffer.indexOf('\n\n');
						if (boundaryIdx === -1) boundaryIdx = buffer.indexOf('\r\n\r\n');
						continue;
					}

					if (dataPayload === '[DONE]') {
						callbacks.onComplete?.(fullResponse);
						return;
					}

					// Attempt to parse permissively: find first JSON bracket and try to parse
					let parsed: unknown = null;
					try {
						const firstIdx = Math.min(
							...['{', '[']
								.map((ch) => dataPayload.indexOf(ch))
								.filter((i) => i >= 0)
						);
						if (!Number.isNaN(firstIdx) && firstIdx >= 0) {
							const candidate = dataPayload.slice(firstIdx).trim();
							try {
								parsed = JSON.parse(candidate);
							} catch (e1) {
								const cleaned = dataPayload.replace(/event:\s*[^\r\n]+/gi, '').replace(/^[^{[]*/s, '').trim();
								if (cleaned && (cleaned.startsWith('{') || cleaned.startsWith('['))) {
									try { parsed = JSON.parse(cleaned); } catch (e2) { /* leave null */ }
								}
							}
						} else if (dataPayload.startsWith('{') || dataPayload.startsWith('[')) {
							try { parsed = JSON.parse(dataPayload); } catch (e3) { /* leave null */ }
						}
					} catch (outer) {
						// permissive parse failed; parsed stays null
					}

					if (parsed) {
						this.handleStreamEvent(parsed as Record<string, unknown>, callbacks, fullResponse);
					} else {
						// Not JSON, treat as raw text chunk. Log payload for test triage.
						try {
							 
							console.debug('AI stream: non-JSON payload received', { dataPayload });
						} catch (e) {
							// ignore logging errors
						}
						callbacks.onChunk(dataPayload);
						fullResponse.answer += dataPayload;
					}

					boundaryIdx = buffer.indexOf('\n\n');
					if (boundaryIdx === -1) boundaryIdx = buffer.indexOf('\r\n\r\n');
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
