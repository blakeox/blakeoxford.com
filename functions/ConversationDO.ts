/**
 * Cloudflare Durable Object: Real-time conversation state management
 * 
 * Features:
 * - WebSocket connections for live updates
 * - Typing indicators
 * - Conversation persistence across refreshes
 * - Per-user rate limiting
 * - Active user presence tracking
 */

import type { Env, ConversationState, WSMessage, RateLimitData } from './types';
import { buildApiCorsHeaders, isAllowedApiOrigin } from './shared/cors';

const MAX_REQUEST_BYTES = 32 * 1024;

function conversationCorsHeaders(request: Request): Record<string, string> {
	return buildApiCorsHeaders(request, {
		methods: 'GET, POST, OPTIONS',
		allowHeaders: 'content-type, x-session-id',
		extra: { 'content-type': 'application/json; charset=utf-8' },
	});
}

interface SessionData {
	socket: WebSocket;
	userId: string;
	sessionId: string;
	connected: number;
}

export class ConversationDurableObject {
	private state: DurableObjectState;
	private env: Env;
	private sessions: Map<string, SessionData>;
	private typingUsers: Set<string>;
	private rateLimit: Map<string, RateLimitData>;
	private conversationState: ConversationState;
	private lastActivity: number;
	
	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
		this.env = env;
		this.sessions = new Map();
		this.typingUsers = new Set();
		this.rateLimit = new Map();
		this.conversationState = {
			messages: [],
			created: Date.now(),
			updated: Date.now()
		};
		this.lastActivity = Date.now();
		
		// Load conversation state on initialization
		this.state.blockConcurrencyWhile(async () => {
			const stored = await this.state.storage.get<ConversationState>('conversation');
			this.conversationState = stored || {
				messages: [],
				created: Date.now(),
				updated: Date.now()
			};
		});
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const corsHeaders = conversationCorsHeaders(request);

		if (!isAllowedApiOrigin(request)) {
			return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
				status: 403,
				headers: corsHeaders,
			});
		}

		const contentLength = Number(request.headers.get('content-length') || 0);
		if (contentLength > MAX_REQUEST_BYTES) {
			return new Response(JSON.stringify({ error: 'Request body too large' }), {
				status: 413,
				headers: corsHeaders,
			});
		}
		
		// WebSocket upgrade request
		if (request.headers.get('Upgrade') === 'websocket') {
			return this.handleWebSocket(request);
		}

		// HTTP endpoints for fallback/management
		if (url.pathname.endsWith('/state')) {
			return this.handleGetState(request);
		}

		if (url.pathname.endsWith('/message')) {
			return this.handlePostMessage(request);
		}

		if (url.pathname.endsWith('/typing')) {
			return this.handleTyping(request);
		}

		return new Response('Not found', { status: 404, headers: corsHeaders });
	}

	/**
	 * Handle WebSocket connection
	 */
	private async handleWebSocket(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const sessionId = url.searchParams.get('sessionId') || crypto.randomUUID();
		const userId = url.searchParams.get('userId') || 'anonymous';

		// Rate limiting check
		if (!this.checkRateLimit(userId)) {
			return new Response('Rate limit exceeded', { status: 429 });
		}

		// Create WebSocket pair
		const pair = new WebSocketPair();
		const [client, server] = Object.values(pair);

		// Accept the WebSocket connection
		server.accept();

		// Store session
		this.sessions.set(sessionId, {
			socket: server,
			userId,
			sessionId,
			connected: Date.now()
		});

		// Send initial state to new connection
		this.sendToSession(sessionId, {
			type: 'presence',
			userId,
			conversationId: sessionId,
			content: JSON.stringify({
				state: this.conversationState,
				sessionId,
				activeSessions: this.sessions.size
			}),
			timestamp: Date.now()
		});

		// Notify others of new user
		this.broadcast({
			type: 'presence',
			userId,
			content: JSON.stringify({
				action: 'join',
				sessionId,
				activeSessions: this.sessions.size
			}),
			timestamp: Date.now()
		}, sessionId);

		// Handle incoming messages
		server.addEventListener('message', async (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data as string) as WSMessage;
				await this.handleWebSocketMessage(sessionId, userId, data);
			} catch (error) {
				console.warn('ConversationDO: invalid message payload', error);
				this.sendToSession(sessionId, {
					type: 'message',
					content: JSON.stringify({ type: 'error', error: 'Invalid message format' }),
					timestamp: Date.now()
				});
			}
		});

		// Handle disconnection
		server.addEventListener('close', () => {
			this.sessions.delete(sessionId);
			this.typingUsers.delete(sessionId);
			this.broadcast({
				type: 'presence',
				userId,
				content: JSON.stringify({
					action: 'leave',
					sessionId,
					activeSessions: this.sessions.size
				}),
				timestamp: Date.now()
			});
		});

		server.addEventListener('error', () => {
			this.sessions.delete(sessionId);
			this.typingUsers.delete(sessionId);
		});

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	/**
	 * Handle WebSocket messages
	 */
	private async handleWebSocketMessage(sessionId: string, userId: string, data: WSMessage): Promise<void> {
		this.lastActivity = Date.now();

		switch (data.type) {
			case 'typing':
				this.handleTypingIndicator(sessionId, data.content === 'true');
				break;

			case 'message':
				await this.handleNewMessage(sessionId, userId, data);
				break;

			case 'ping':
				this.sendToSession(sessionId, { 
					type: 'pong', 
					timestamp: Date.now() 
				});
				break;

			case 'presence':
				this.sendToSession(sessionId, {
					type: 'presence',
					userId,
					content: JSON.stringify({
						state: this.conversationState,
						activeSessions: this.sessions.size
					}),
					timestamp: Date.now()
				});
				break;

			default:
				this.sendToSession(sessionId, {
					type: 'message',
					content: JSON.stringify({
						type: 'error',
						error: `Unknown message type: ${data.type}`
					}),
					timestamp: Date.now()
				});
		}
	}

	/**
	 * Handle typing indicator
	 */
	private handleTypingIndicator(sessionId: string, isTyping: boolean): void {
		if (isTyping) {
			this.typingUsers.add(sessionId);
		} else {
			this.typingUsers.delete(sessionId);
		}

		// Broadcast typing status to others
		this.broadcast({
			type: 'typing',
			content: JSON.stringify({
				sessionId,
				isTyping,
				typingCount: this.typingUsers.size
			}),
			timestamp: Date.now()
		}, sessionId);
	}

	/**
	 * Handle new message
	 */
	private async handleNewMessage(sessionId: string, userId: string, data: WSMessage): Promise<void> {
		const message = {
			id: crypto.randomUUID(),
			role: 'user' as const,
			content: data.content || '',
			timestamp: Date.now(),
			metadata: {
				userId,
				sessionId
			}
		};

		// Add to conversation state
		this.conversationState.messages.push(message);
		this.conversationState.updated = Date.now();

		// Persist to storage
		await this.state.storage.put('conversation', this.conversationState);

		// Broadcast to all connected sessions
		this.broadcast({
			type: 'message',
			userId,
			content: JSON.stringify({ message }),
			timestamp: Date.now()
		});

		// Clear typing indicator for this user
		this.typingUsers.delete(sessionId);
		this.broadcast({
			type: 'typing',
			content: JSON.stringify({
				sessionId,
				isTyping: false,
				typingCount: this.typingUsers.size
			}),
			timestamp: Date.now()
		}, sessionId);
	}

	/**
	 * Handle HTTP GET state (fallback)
	 */
	private async handleGetState(request: Request): Promise<Response> {
		return new Response(JSON.stringify({
			state: this.conversationState,
			activeSessions: this.sessions.size,
			typingCount: this.typingUsers.size
		}), {
			headers: conversationCorsHeaders(request)
		});
	}

	/**
	 * Handle HTTP POST message (fallback)
	 */
	private async handlePostMessage(request: Request): Promise<Response> {
		const corsHeaders = conversationCorsHeaders(request);
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		try {
			const data = await request.json() as Partial<WSMessage> & { sessionId?: string; userId?: string };
			const sessionId = data.sessionId || crypto.randomUUID();
			const userId = data.userId || 'anonymous';

			if (!this.checkRateLimit(userId)) {
				return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
					status: 429,
					headers: corsHeaders
				});
			}

			await this.handleNewMessage(sessionId, userId, data as WSMessage);

				return new Response(JSON.stringify({
					success: true,
					state: this.conversationState
				}), {
					headers: corsHeaders
				});
		} catch (err) {
			const error = err as Error;
			return new Response(JSON.stringify({ error: error.message }), {
				status: 400,
				headers: corsHeaders
			});
		}
	}

	/**
	 * Handle typing indicator via HTTP (fallback)
	 */
	private async handleTyping(request: Request): Promise<Response> {
		const corsHeaders = conversationCorsHeaders(request);
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		try {
			const data = await request.json() as { sessionId?: string; isTyping: boolean };
			const sessionId = data.sessionId || crypto.randomUUID();
			
				this.handleTypingIndicator(sessionId, data.isTyping);

				return new Response(JSON.stringify({ success: true }), {
					headers: corsHeaders
				});
		} catch (err) {
			const error = err as Error;
			return new Response(JSON.stringify({ error: error.message }), {
				status: 400,
				headers: corsHeaders
			});
		}
	}

	/**
	 * Rate limiting: 60 requests per minute per user
	 */
	private checkRateLimit(userId: string): boolean {
		const now = Date.now();
		const limit = this.rateLimit.get(userId);

		if (!limit || now > limit.resetTime) {
			// New window
			this.rateLimit.set(userId, {
				count: 1,
				resetTime: now + 60000 // 1 minute
			});
			return true;
		}

		if (limit.count >= 60) {
			return false;
		}

		limit.count++;
		return true;
	}

	/**
	 * Send message to specific session
	 */
	private sendToSession(sessionId: string, message: WSMessage): void {
		const session = this.sessions.get(sessionId);
		if (session?.socket) {
			try {
				session.socket.send(JSON.stringify(message));
			} catch (error) {
				console.warn('ConversationDO: failed to send message', error);
				// Socket closed, clean up
				this.sessions.delete(sessionId);
			}
		}
	}

	/**
	 * Broadcast message to all sessions (optionally excluding one)
	 */
	private broadcast(message: WSMessage, excludeSessionId: string | null = null): void {
		for (const sessionId of this.sessions.keys()) {
			if (sessionId !== excludeSessionId) {
				this.sendToSession(sessionId, message);
			}
		}
	}

	/**
	 * Alarm handler for cleanup
	 */
	async alarm(): Promise<void> {
		const now = Date.now();
		const inactiveTimeout = 30 * 60 * 1000; // 30 minutes

		// Clean up if no activity
		if (now - this.lastActivity > inactiveTimeout && this.sessions.size === 0) {
			// Backup to KV before shutdown
			if (this.env.AI_RESPONSE_CACHE && this.conversationState.messages.length > 0) {
				const backupKey = `conversation:backup:${this.state.id.toString()}`;
				await this.env.AI_RESPONSE_CACHE.put(
					backupKey,
					JSON.stringify(this.conversationState),
					{ expirationTtl: 7 * 24 * 60 * 60 } // 7 days
				);
			}
		}

		// Schedule next alarm
		await this.state.storage.setAlarm(now + 5 * 60 * 1000); // 5 minutes
	}
}
