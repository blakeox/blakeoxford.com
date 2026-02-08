/**
 * WebSocket client for real-time conversation features
 * 
 * Features:
 * - Automatic reconnection
 * - Typing indicators
 * - Live message sync
 * - Presence tracking
 * - Graceful fallback to HTTP
 */

import { logger } from '../utils/logger';

export type WSMessage = 
	| { type: 'init'; state: any; sessionId: string; activeSessions: number }
	| { type: 'message'; message: any }
	| { type: 'typing'; sessionId: string; isTyping: boolean; typingCount: number }
	| { type: 'presence'; action: 'join' | 'leave'; sessionId: string; activeSessions: number }
	| { type: 'pong'; timestamp: number }
	| { type: 'state'; state: any; activeSessions: number }
	| { type: 'error'; error: string };

export type WSOptions = {
	conversationId?: string;
	sessionId?: string;
	userId?: string;
	onMessage?: (message: WSMessage) => void;
	onConnect?: () => void;
	onDisconnect?: () => void;
	onError?: (error: Error) => void;
};

export class ConversationWebSocket {
	private ws: WebSocket | null = null;
	public options: WSOptions;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;
	private heartbeatInterval: number | null = null;
	private isConnecting = false;
	private isClosed = false;

	constructor(options: WSOptions = {}) {
		this.options = {
			conversationId: 'default',
			sessionId: this.generateSessionId(),
			userId: 'anonymous',
			...options
		};
	}

	/**
	 * Connect to WebSocket
	 */
	async connect(): Promise<void> {
		if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting || this.isClosed) {
			return;
		}

		this.isConnecting = true;

		try {
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
			const host = window.location.host;
			const url = new URL(`${protocol}//${host}/api/conversation-ws`);
			url.searchParams.set('id', this.options.conversationId!);
			url.searchParams.set('sessionId', this.options.sessionId!);
			url.searchParams.set('userId', this.options.userId!);

			this.ws = new WebSocket(url.toString());

			this.ws.onopen = () => {
				this.isConnecting = false;
				this.reconnectAttempts = 0;
				this.startHeartbeat();
				this.options.onConnect?.();
			};

			this.ws.onmessage = (event) => {
				try {
					const message: WSMessage = JSON.parse(event.data);
					this.options.onMessage?.(message);
				} catch (error) {
					logger.error('Failed to parse WebSocket message:', error);
				}
			};

			this.ws.onerror = () => {
				this.options.onError?.(new Error('WebSocket error occurred'));
			};

			this.ws.onclose = () => {
				this.isConnecting = false;
				this.stopHeartbeat();
				this.options.onDisconnect?.();

				// Attempt reconnection if not manually closed
				if (!this.isClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
					this.reconnectAttempts++;
					const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
					setTimeout(() => this.connect(), Math.min(delay, 30000));
				}
			};
		} catch (error) {
			this.isConnecting = false;
			this.options.onError?.(error as Error);
		}
	}

	/**
	 * Send message through WebSocket
	 */
	send(data: any): boolean {
		if (this.ws?.readyState === WebSocket.OPEN) {
			try {
				this.ws.send(JSON.stringify(data));
				return true;
			} catch (error) {
				logger.error('Failed to send WebSocket message:', error);
				return false;
			}
		}
		return false;
	}

	/**
	 * Send typing indicator
	 */
	sendTyping(isTyping: boolean): void {
		this.send({ type: 'typing', isTyping });
	}

	/**
	 * Send message
	 */
	sendMessage(content: string, role: 'user' | 'assistant' = 'user'): void {
		this.send({ type: 'message', role, content });
	}

	/**
	 * Request current state
	 */
	requestState(): void {
		this.send({ type: 'getState' });
	}

	/**
	 * Close connection
	 */
	close(): void {
		this.isClosed = true;
		this.stopHeartbeat();
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}

	/**
	 * Start heartbeat to keep connection alive
	 */
	private startHeartbeat(): void {
		this.stopHeartbeat();
		this.heartbeatInterval = window.setInterval(() => {
			if (this.ws?.readyState === WebSocket.OPEN) {
				this.send({ type: 'ping' });
			}
		}, 30000); // 30 seconds
	}

	/**
	 * Stop heartbeat
	 */
	private stopHeartbeat(): void {
		if (this.heartbeatInterval !== null) {
			window.clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}
	}

	/**
	 * Generate unique session ID
	 */
	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
	}
}

/**
 * HTTP fallback for when WebSocket is unavailable
 */
export class ConversationHTTP {
	private options: WSOptions;
	private baseUrl: string;

	constructor(options: WSOptions = {}) {
		this.options = {
			conversationId: 'default',
			sessionId: this.generateSessionId(),
			userId: 'anonymous',
			...options
		};
		this.baseUrl = `/api/conversation/${this.options.conversationId}`;
	}

	/**
	 * Get conversation state
	 */
	async getState(): Promise<any> {
		const response = await fetch(`${this.baseUrl}/state`, {
			method: 'GET',
			credentials: 'include'
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	/**
	 * Send message
	 */
	async sendMessage(content: string, role: 'user' | 'assistant' = 'user'): Promise<any> {
		const response = await fetch(`${this.baseUrl}/message`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({
				content,
				role,
				sessionId: this.options.sessionId,
				userId: this.options.userId
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	/**
	 * Send typing indicator
	 */
	async sendTyping(isTyping: boolean): Promise<void> {
		try {
			await fetch(`${this.baseUrl}/typing`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					isTyping,
					sessionId: this.options.sessionId
				})
			});
		} catch (error) {
			// Typing indicators are non-critical, fail silently
			logger.debug('Typing indicator failed:', error);
		}
	}

	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
	}
}
