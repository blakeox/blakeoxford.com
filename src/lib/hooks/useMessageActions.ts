import { useCallback } from 'react';
import type { ChatMessage, MutableRef } from '../chat';
import { decodeMimeEncodedWords, decodeHtmlEntities } from '../string-utils';
import { autoragEvents } from '../analytics';

/**
 * Options for the message actions hook
 */
interface UseMessageActionsOptions {
	/** Current messages array */
	messages: ChatMessage[];
	/** Function to update messages state */
	setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
	/** Reference to last query */
	lastQueryRef: MutableRef<string | null>;
	/** Reference to messages for feedback metadata */
	messagesRef: MutableRef<ChatMessage[]>;
	/** Copy with feedback function */
	copyWithFeedback: (content: string, id: string, type: 'message' | 'share') => Promise<boolean>;
}

/**
 * Return type for the message actions hook
 */
interface UseMessageActionsReturn {
	/** Handle feedback submission for a message */
	handleFeedback: (messageId: string, sentiment: 'positive' | 'negative') => Promise<void>;
	/** Handle copying a message to clipboard */
	handleCopyMessage: (message: ChatMessage) => Promise<void>;
	/** Handle opening a primary source URL */
	handleOpenPrimarySource: (url: string) => void;
	/** Handle exporting the conversation to Markdown */
	handleExportConversation: () => void;
}

/**
 * Custom hook for message actions (feedback, copy, export, source navigation)
 * 
 * Manages all user interactions with chat messages including:
 * - Sentiment feedback (positive/negative) with API submission
 * - Message copying with visual feedback
 * - Conversation export to Markdown with metadata
 * - Primary source navigation
 * 
 * This hook consolidates message-level actions that were previously
 * scattered throughout the component, providing a clean interface
 * for message interactions.
 * 
 * @param options - Configuration including messages state and refs
 * @returns Message action handlers
 * 
 * @example
 * ```tsx
 * const { handleFeedback, handleCopyMessage, handleExportConversation } = useMessageActions({
 *   messages,
 *   setMessages,
 *   lastQueryRef,
 *   messagesRef,
 *   copyWithFeedback,
 * });
 * 
 * // Use in UI
 * <button onClick={() => handleFeedback(messageId, 'positive')}>👍</button>
 * <button onClick={() => handleCopyMessage(message)}>Copy</button>
 * <button onClick={handleExportConversation}>Export</button>
 * ```
 */
export function useMessageActions(options: UseMessageActionsOptions): UseMessageActionsReturn {
	const { messages, setMessages, lastQueryRef, messagesRef, copyWithFeedback } = options;

	/**
	 * Handle feedback submission for a message
	 * Toggles sentiment if same value clicked, submits to API
	 */
	const handleFeedback = useCallback(
		async (messageId: string, sentiment: 'positive' | 'negative') => {
			let resolvedSentiment: 'positive' | 'negative' | undefined;
			
			// Update message feedback state
			setMessages((prev) =>
				prev.map((message) => {
					if (message.id !== messageId) return message;
					const nextSentiment = message.feedback === sentiment ? undefined : sentiment;
					resolvedSentiment = nextSentiment;
					return { ...message, feedback: nextSentiment };
				}),
			);
			
			// If feedback was toggled off, don't submit
			if (!resolvedSentiment) return;

			autoragEvents.feedback({
				sentiment: resolvedSentiment,
				message_id: messageId,
			});
			
			// Submit feedback to API
			try {
				await fetch('/api/ai-feedback', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						messageId,
						sentiment: resolvedSentiment,
						query: lastQueryRef.current,
						metadata: {
							conversationLength: messagesRef.current.length,
						},
					}),
					keepalive: true,
				});
			} catch {
				/* ignore feedback errors - non-critical */
			}
		},
		[lastQueryRef, messagesRef, setMessages],
	);

	/**
	 * Handle copying a message to clipboard with visual feedback
	 */
	const handleCopyMessage = useCallback(
		async (message: ChatMessage) => {
			if (!message.content) return;
			await copyWithFeedback(message.content, message.id, 'message');
		},
		[copyWithFeedback],
	);

	/**
	 * Handle opening a primary source URL
	 * Uses location.assign for proper navigation
	 */
	const handleOpenPrimarySource = useCallback((url: string) => {
		if (!url) return;
		if (typeof window !== 'undefined') {
			window.location.assign(url);
		}
	}, []);

	/**
	 * Handle exporting the conversation to Markdown
	 * Creates a downloadable file with full conversation history,
	 * sources, metadata, and formatting
	 */
	const handleExportConversation = useCallback(() => {
		if (messages.length === 0) return;
		
		// Generate Markdown content
		const timestamp = new Date().toLocaleString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
		
		let markdown = '# AI Conversation with Blake Oxford\n\n';
		markdown += `**Exported**: ${timestamp}  \n`;
		markdown += `**Messages**: ${messages.length}  \n`;
		markdown += `**URL**: ${window.location.href}\n\n`;
		markdown += '---\n\n';
		
		// Add each message with sources
		messages.forEach((message, index) => {
			const role = message.role === 'user' ? '👤 You' : '🤖 AI Assistant';
			markdown += `## ${role}\n\n`;
			markdown += `${message.content}\n\n`;
			
			// Add sources for assistant messages
			if (message.role === 'assistant' && message.sources && message.sources.length > 0) {
				markdown += '### 📚 Sources\n\n';
				message.sources.forEach((source, sourceIndex: number) => {
					const title = decodeMimeEncodedWords(decodeHtmlEntities(source.title || source.url));
					const score = source.score ? ` (${Math.round(source.score * 100)}% relevant)` : '';
					const collection = source.collection ? ` [${source.collection}]` : '';
					markdown += `${sourceIndex + 1}. [${title}](${source.url})${score}${collection}\n`;
					if (source.snippet) {
						markdown += `   > ${source.snippet}\n\n`;
					}
				});
				markdown += '\n';
			}
			
			if (index < messages.length - 1) {
				markdown += '---\n\n';
			}
		});
		
		markdown += '\n---\n\n';
		markdown += `*Conversation exported from [blakeoxford.com](${window.location.origin})*\n`;
		
		// Create and download file
		const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		const filename = `ai-conversation-${Date.now()}.md`;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		
		// Track export
		autoragEvents.export('markdown');
	}, [messages]);

	return {
		handleFeedback,
		handleCopyMessage,
		handleOpenPrimarySource,
		handleExportConversation,
	};
}
