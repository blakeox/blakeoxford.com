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

export class ConversationDurableObject {
	constructor(state, env) {
		this.state = state;
		this.env = env;
		this.sessions = new Map(); // sessionId -> WebSocket
		this.typingUsers = new Set(); // Track who's typing
		this.rateLimit = new Map(); // userId -> { count, resetTime }
		this.conversationState = null; // Persistent conversation data
		this.lastActivity = Date.now();
		
		// Load conversation state on initialization
		this.state.blockConcurrencyWhile(async () => {
			this.conversationState = await this.state.storage.get('conversation') || {
				messages: [],
				created: Date.now(),
				updated: Date.now()
			};
		});
	}

	async fetch(request) {
		const url = new URL(request.url);
		
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

		return new Response('Not found', { status: 404 });
	}

	/**
	 * Handle WebSocket connection
	 */
	async handleWebSocket(request) {
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
			type: 'init',
			state: this.conversationState,
			sessionId,
			activeSessions: this.sessions.size
		});

		// Notify others of new user
		this.broadcast({
			type: 'presence',
			action: 'join',
			sessionId,
			activeSessions: this.sessions.size
		}, sessionId);

		// Handle incoming messages
		server.addEventListener('message', async (event) => {
			try {
				const data = JSON.parse(event.data);
				await this.handleWebSocketMessage(sessionId, userId, data);
			} catch (err) {
				this.sendToSession(sessionId, {
					type: 'error',
					error: 'Invalid message format'
				});
			}
		});

		// Handle disconnection
		server.addEventListener('close', () => {
			this.sessions.delete(sessionId);
			this.typingUsers.delete(sessionId);
			this.broadcast({
				type: 'presence',
				action: 'leave',
				sessionId,
				activeSessions: this.sessions.size
			});
		});

		server.addEventListener('error', () => {
			this.sessions.delete(sessionId);
			this.typingUsers.delete(sessionId);
		});

		return new Response(null, { status: 101, webSocket: client });
	}

	/**
	 * Handle WebSocket messages
	 */
	async handleWebSocketMessage(sessionId, userId, data) {
		this.lastActivity = Date.now();

		switch (data.type) {
			case 'typing':
				this.handleTypingIndicator(sessionId, data.isTyping);
				break;

			case 'message':
				await this.handleNewMessage(sessionId, userId, data);
				break;

			case 'ping':
				this.sendToSession(sessionId, { type: 'pong', timestamp: Date.now() });
				break;

			case 'getState':
				this.sendToSession(sessionId, {
					type: 'state',
					state: this.conversationState,
					activeSessions: this.sessions.size
				});
				break;

			default:
				this.sendToSession(sessionId, {
					type: 'error',
					error: `Unknown message type: ${data.type}`
				});
		}
	}

	/**
	 * Handle typing indicator
	 */
	handleTypingIndicator(sessionId, isTyping) {
		if (isTyping) {
			this.typingUsers.add(sessionId);
		} else {
			this.typingUsers.delete(sessionId);
		}

		// Broadcast typing status to others
		this.broadcast({
			type: 'typing',
			sessionId,
			isTyping,
			typingCount: this.typingUsers.size
		}, sessionId);
	}

	/**
	 * Handle new message
	 */
	async handleNewMessage(sessionId, userId, data) {
		const message = {
			id: crypto.randomUUID(),
			role: data.role || 'user',
			content: data.content,
			timestamp: Date.now(),
			userId,
			sessionId
		};

		// Add to conversation state
		this.conversationState.messages.push(message);
		this.conversationState.updated = Date.now();

		// Persist to storage
		await this.state.storage.put('conversation', this.conversationState);

		// Broadcast to all connected sessions
		this.broadcast({
			type: 'message',
			message
		});

		// Clear typing indicator for this user
		this.typingUsers.delete(sessionId);
		this.broadcast({
			type: 'typing',
			sessionId,
			isTyping: false,
			typingCount: this.typingUsers.size
		}, sessionId);
	}

	/**
	 * Handle HTTP GET state (fallback)
	 */
	async handleGetState(request) {
		return new Response(JSON.stringify({
			state: this.conversationState,
			activeSessions: this.sessions.size,
			typingCount: this.typingUsers.size
		}), {
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type'
			}
		});
	}

	/**
	 * Handle HTTP POST message (fallback)
	 */
	async handlePostMessage(request) {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type'
				}
			});
		}

		try {
			const data = await request.json();
			const sessionId = data.sessionId || crypto.randomUUID();
			const userId = data.userId || 'anonymous';

			if (!this.checkRateLimit(userId)) {
				return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
					status: 429,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			await this.handleNewMessage(sessionId, userId, data);

			return new Response(JSON.stringify({
				success: true,
				state: this.conversationState
			}), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		} catch (err) {
			return new Response(JSON.stringify({ error: err.message }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	/**
	 * Handle typing indicator via HTTP (fallback)
	 */
	async handleTyping(request) {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type'
				}
			});
		}

		try {
			const data = await request.json();
			const sessionId = data.sessionId || crypto.randomUUID();
			
			this.handleTypingIndicator(sessionId, data.isTyping);

			return new Response(JSON.stringify({ success: true }), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		} catch (err) {
			return new Response(JSON.stringify({ error: err.message }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	/**
	 * Rate limiting: 60 requests per minute per user
	 */
	checkRateLimit(userId) {
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
	sendToSession(sessionId, message) {
		const session = this.sessions.get(sessionId);
		if (session?.socket) {
			try {
				session.socket.send(JSON.stringify(message));
			} catch (err) {
				// Socket closed, clean up
				this.sessions.delete(sessionId);
			}
		}
	}

	/**
	 * Broadcast message to all sessions (optionally excluding one)
	 */
	broadcast(message, excludeSessionId = null) {
		for (const [sessionId, session] of this.sessions.entries()) {
			if (sessionId !== excludeSessionId) {
				this.sendToSession(sessionId, message);
			}
		}
	}

	/**
	 * Alarm handler for cleanup
	 */
	async alarm() {
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
