/**
 * Message processing utilities for chat functionality
 */

import type { AIChatMessage, AIChatSource } from './ai-search';
import type { ChatMessage } from './chat-types';
import {
	DEEP_CONVERSATION_THRESHOLD,
	MAX_ASSISTANT_MESSAGE_LENGTH,
	MAX_CTAS,
	MAX_USER_MESSAGE_LENGTH,
	MULTIPLE_SOURCES_THRESHOLD,
} from './chat-constants';

/**
 * Compress older messages into a condensed summary
 */
export function compressOlderMessages(messages: ChatMessage[]): string {
	if (messages.length === 0) return '';
	
	// Create a condensed summary of older conversation
	const pairs: Array<{ user: string; assistant: string }> = [];
	
	for (let i = 0; i < messages.length; i++) {
		if (messages[i].role === 'user') {
			const userMsg = messages[i].content;
			const assistantMsg = messages[i + 1]?.role === 'assistant' ? messages[i + 1].content : '';
			
			// Truncate long messages while preserving key points
			const truncatedUser = userMsg.length > MAX_USER_MESSAGE_LENGTH 
				? userMsg.substring(0, MAX_USER_MESSAGE_LENGTH) + '...'
				: userMsg;
			const truncatedAssistant = assistantMsg.length > MAX_ASSISTANT_MESSAGE_LENGTH
				? assistantMsg.substring(0, MAX_ASSISTANT_MESSAGE_LENGTH) + '...'
				: assistantMsg;
			
			pairs.push({ user: truncatedUser, assistant: truncatedAssistant });
			i++; // Skip the assistant message we just processed
		}
	}
	
	// Format as a concise summary
	const summary = pairs
		.map((pair, idx) => `[Q${idx + 1}] ${pair.user}\n[A${idx + 1}] ${pair.assistant}`)
		.join('\n\n');
	
	return `Previous conversation context (summarized):\n${summary}\n\n---\n`;
}

/**
 * Build conversation history for API request
 */
export function buildHistoryForRequest(
	messages: ChatMessage[],
	useMemory: boolean
): AIChatMessage[] {
	if (!useMemory) return [];
	
	const allMessages = messages.filter(
		(message) => message.role === 'user' || message.role === 'assistant'
	);
	
	// If conversation is short, send all messages
	if (allMessages.length <= 8) {
		return allMessages.map((message) => ({ 
			role: message.role, 
			content: message.content 
		}));
	}
	
	// For longer conversations: compress old, keep recent full
	const RECENT_MESSAGE_COUNT = 4; // Last 2 user-assistant pairs
	const recentMessages = allMessages.slice(-RECENT_MESSAGE_COUNT);
	const olderMessages = allMessages.slice(0, -RECENT_MESSAGE_COUNT);
	
	// Create compressed history
	const compressedSummary = compressOlderMessages(olderMessages);
	
	// Build payload: summary as system context + recent full messages
	const historyPayload: AIChatMessage[] = [];
	
	if (compressedSummary) {
		// Add summary as a system-like message for context
		historyPayload.push({
			role: 'user',
			content: compressedSummary,
		});
	}
	
	// Add recent messages in full
	recentMessages.forEach((message) => {
		historyPayload.push({
			role: message.role,
			content: message.content,
		});
	});
	
	return historyPayload;
}

/**
 * Generate contextual CTAs based on message sources
 */
export function generateContextualCTAs(
	sources: AIChatSource[],
	siteHostname: string,
	messageCount: number
): Array<{ label: string; url: string; icon: string; type: string }> {
	if (!sources || sources.length === 0) return [];
	
	const ctas: Array<{ label: string; url: string; icon: string; type: string }> = [];
	const seenUrls = new Set<string>();
	
	// Prioritize internal content (projects, blog posts)
	const internalSources = sources.filter((s) => {
		try {
			const url = new URL(s.url, `https://${siteHostname}`);
			return url.hostname === siteHostname;
		} catch {
			return !s.url.startsWith('http');
		}
	});
	
	// Group by collection type
	const projectSources = internalSources.filter((s) => s.collection === 'projects');
	const blogSources = internalSources.filter((s) => s.collection === 'blog');
	
	// Add project CTA (prioritize highest relevance)
	if (projectSources.length > 0) {
		const topProject = projectSources[0];
		if (!seenUrls.has(topProject.url)) {
			ctas.push({
				label: 'View Project Details',
				url: topProject.url,
				icon: '🚀',
				type: 'project',
			});
			seenUrls.add(topProject.url);
		}
	}
	
	// Add blog CTA (prioritize highest relevance)
	if (blogSources.length > 0) {
		const topBlog = blogSources[0];
		if (!seenUrls.has(topBlog.url)) {
			ctas.push({
				label: 'Read Full Article',
				url: topBlog.url,
				icon: '📚',
				type: 'blog',
			});
			seenUrls.add(topBlog.url);
		}
	}
	
	// If multiple projects mentioned, add "Browse All Projects"
	if (projectSources.length > MULTIPLE_SOURCES_THRESHOLD) {
		ctas.push({
			label: 'Browse All Projects',
			url: '/projects',
			icon: '🗂️',
			type: 'collection',
		});
	}
	
	// If multiple blog posts mentioned, add "Read More Articles"
	if (blogSources.length > MULTIPLE_SOURCES_THRESHOLD) {
		ctas.push({
			label: 'Read More Articles',
			url: '/blog',
			icon: '📖',
			type: 'collection',
		});
	}
	
	// Add contact CTA if conversation is deep
	if (messageCount > DEEP_CONVERSATION_THRESHOLD && ctas.length > 0 && ctas.length < MAX_CTAS) {
		ctas.push({
			label: 'Get in Touch',
			url: '/contact',
			icon: '💬',
			type: 'contact',
		});
	}
	
	// Limit to max CTAs
	return ctas.slice(0, MAX_CTAS);
}
