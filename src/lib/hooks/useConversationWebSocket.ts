/**
 * Conversation WebSocket Hook
 * 
 * Custom React hook for managing real-time WebSocket connections for chat conversations.
 * Provides presence tracking, typing indicators, and message synchronization.
 * 
 * @module hooks/useConversationWebSocket
 */

import { useEffect, useRef, useState } from 'react';
import { ConversationWebSocket, type WSMessage } from '../chat/conversation-ws';
import type { MutableRef } from '../chat/chat-types.js';

export interface UseConversationWebSocketOptions {
	/** Unique conversation identifier */
	conversationId: string;
	/** User identifier for presence tracking */
	userId: string;
	/** Whether the chat is currently open (controls connection) */
	isOpen: boolean;
	/** Delay before connecting (ms) to avoid blocking initial render */
	connectDelay?: number;
}

export interface UseConversationWebSocketReturn {
	/** Whether WebSocket is currently connected */
	wsConnected: boolean;
	/** Number of active users in the conversation */
	activeUsers: number;
	/** Whether another user is currently typing */
	isOtherUserTyping: boolean;
	/** WebSocket instance reference for direct access if needed */
	wsRef: MutableRef<ConversationWebSocket | null>;
}

/**
 * Custom hook for managing real-time WebSocket connections in chat conversations
 * 
 * Provides real-time features including:
 * - Connection status tracking
 * - Active user presence
 * - Typing indicators
 * - Message synchronization (extensible)
 * 
 * The hook automatically handles connection lifecycle based on the `isOpen` prop,
 * connecting only when needed and cleaning up on unmount or when chat closes.
 * 
 * Features:
 * - Automatic connection management based on chat state
 * - Delayed connection to avoid blocking initial render
 * - Graceful error handling with HTTP fallback
 * - Presence tracking with active user count
 * - Typing indicators for collaborative awareness
 * - Automatic cleanup on unmount
 * 
 * @param options - Configuration options for WebSocket connection
 * @returns WebSocket connection state and controls
 * 
 * @example
 * ```tsx
 * const { wsConnected, activeUsers, isOtherUserTyping } = useConversationWebSocket({
 *   conversationId: 'chat-123',
 *   userId: 'user-456',
 *   isOpen: isChatOpen,
 *   connectDelay: 1000
 * });
 * ```
 */
export function useConversationWebSocket(
	options: UseConversationWebSocketOptions
): UseConversationWebSocketReturn {
	const { conversationId, userId, isOpen, connectDelay = 1000 } = options;

	const [wsConnected, setWsConnected] = useState(false);
	const [activeUsers, setActiveUsers] = useState(1);
	const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
	const wsRef = useRef<ConversationWebSocket | null>(null);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		// Only connect WebSocket when chat is open
		if (!isOpen) return;

		// Create WebSocket connection
		const ws = new ConversationWebSocket({
			conversationId,
			userId,
			onMessage: (message: WSMessage) => {
				switch (message.type) {
					case 'init':
						setActiveUsers(message.activeSessions);
						setWsConnected(true);
						break;
					case 'presence':
						setActiveUsers(message.activeSessions);
						break;
					case 'typing':
						// Only show typing indicator for other users
						if (message.sessionId !== ws.options.sessionId) {
							setIsOtherUserTyping(message.isTyping);
						}
						break;
					case 'message':
						// Message sync handled separately - we use HTTP for now
						break;
					default:
						break;
				}
			},
			onConnect: () => {
				setWsConnected(true);
			},
			onDisconnect: () => {
				setWsConnected(false);
			},
			onError: (error) => {
				console.debug('WebSocket error:', error);
				setWsConnected(false);
			},
		});

		wsRef.current = ws;

		// Connect with a small delay to avoid blocking initial render
		const connectTimer = setTimeout(() => {
			ws.connect().catch((err) => {
				console.debug(
					'WebSocket connection failed, will use HTTP fallback:',
					err
				);
			});
		}, connectDelay);

		// Cleanup
		return () => {
			clearTimeout(connectTimer);
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
		};
	}, [conversationId, userId, isOpen, connectDelay]);

	return {
		wsConnected,
		activeUsers,
		isOtherUserTyping,
		wsRef,
	};
}
