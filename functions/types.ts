/**
 * Cloudflare Workers Environment Bindings
 * Type definitions for all KV namespaces, Durable Objects, AI bindings, and secrets
 */

export interface Env {
	// KV Namespaces
	RATE_LIMIT_KV: KVNamespace;
	CONTACT_MESSAGES: KVNamespace;
	CSP_REPORTS: KVNamespace;
	CONVERSATION_CACHE_KV: KVNamespace;
	AI_RESPONSE_CACHE: KVNamespace;
	AI_FEEDBACK_KV: KVNamespace;

	// Durable Objects
	CONVERSATION_DO: DurableObjectNamespace;

	// Workers AI
	AI: Ai;

	// Vectorize
	VECTORIZE: VectorizeIndex;

	// Analytics Engine
	AI_ANALYTICS: AnalyticsEngineDataset;

	// Secrets
	RESEND_API_KEY: string;
	TURNSTILE_SECRET_KEY: string;
	AI_SEARCH_API_TOKEN?: string;
	AI_SEARCH_API_ENDPOINT?: string;
	AI_GATEWAY_ID?: string;
	AI_GATEWAY_ACCOUNT_ID?: string;

	// Assets binding (for static site)
	ASSETS: Fetcher;

	// Sentry
	SENTRY_DSN?: string;
}

/**
 * WebSocket message types for Durable Object
 */
export interface WSMessage {
	type: 'typing' | 'message' | 'presence' | 'ping' | 'pong';
	userId?: string;
	conversationId?: string;
	content?: string;
	timestamp?: number;
	metadata?: Record<string, unknown>;
}

/**
 * Conversation state stored in Durable Object
 */
export interface ConversationState {
	messages: Array<{
		id: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: number;
		sources?: Array<{
			title: string;
			url: string;
			excerpt?: string;
		}>;
	}>;
	created: number;
	updated: number;
	metadata?: Record<string, unknown>;
}

/**
 * Rate limit tracking
 */
export interface RateLimitData {
	count: number;
	resetTime: number;
}

/**
 * Contact form data
 */
export interface ContactFormData {
	name: string;
	email: string;
	message: string;
	'cf-turnstile-response': string;
}

/**
 * Email formatting options
 */
export interface EmailData {
	from: string;
	to: string[];
	subject: string;
	html: string;
	text: string;
}
