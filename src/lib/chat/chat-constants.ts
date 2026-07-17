/**
 * Constants and configuration for AI Chat Island
 */

import type { AIChatSource } from '../ai-search';

// Storage keys
export const CONVERSATION_STORAGE_KEY = 'ai-chat:conversation';
export const PREFERENCES_STORAGE_KEY = 'ai-chat:preferences';

// API endpoints
export const SEMANTIC_SEARCH_URL = '/api/semantic-search';

// Guided prompts for quick start
export const GUIDED_PROMPTS = [
	{
		id: 'recent-work',
		label: 'Latest case study',
		description: 'See what shipped most recently and the impact it created.',
		icon: '🆕',
		prompt: 'What is Blake\'s latest case study and what were the key results?',
	},
	{
		id: 'skills',
		label: 'Technical stack',
		description: 'Get a quick overview of systems, frameworks, and specialties.',
		icon: '🛠️',
		prompt: 'Summarize Blake\'s core technical skills and current focus areas.',
	},
	{
		id: 'collaboration',
		label: 'Ways to collaborate',
		description: 'Explore engagement models and how to start a project together.',
		icon: '🤝',
		prompt: 'How can I collaborate with Blake on a new project?',
	},
] as const;

// Quick action chips (Ask empty state) — two starters only
export const QUICK_ACTIONS = [
	{
		icon: '',
		label: 'Ask about this page',
		query: 'Summarize what this page is about and why it matters.',
		category: 'page',
	},
	{
		icon: '',
		label: 'Ask about Blake',
		query: 'What does Blake do well?',
		category: 'experience',
	},
] as const;

// Contextual CTAs
export interface ContextualCTA {
	condition: (query: string, sources: AIChatSource[]) => boolean;
	message: string;
	ctaText: string;
	ctaLink: string;
	icon: string;
}

export const CONTEXTUAL_CTAS: ContextualCTA[] = [
	{
		condition: (query, sources) =>
			query.toLowerCase().includes('project') ||
			query.toLowerCase().includes('portfolio') ||
			sources.some((s) => s.collection === 'projects'),
		message: 'Interested in working together on a similar project?',
		ctaText: 'Schedule a consultation',
		ctaLink: '/contact?ref=autorag&topic=project-inquiry',
		icon: '📅',
	},
	{
		condition: (query) =>
			query.toLowerCase().includes('experience') ||
			query.toLowerCase().includes('skills') ||
			query.toLowerCase().includes('expertise'),
		message: 'Want to discuss how my experience fits your needs?',
		ctaText: 'Let\'s chat',
		ctaLink: '/contact?ref=autorag&topic=expertise-inquiry',
		icon: '💬',
	},
	{
		condition: (_query, sources) => sources.some((s) => s.collection === 'blog'),
		message: 'Found this helpful? Get more insights delivered to your inbox.',
		ctaText: 'Subscribe to newsletter',
		ctaLink: '#newsletter-signup',
		icon: '📧',
	},
	{
		condition: (query) =>
			query.toLowerCase().includes('hire') ||
			query.toLowerCase().includes('available') ||
			query.toLowerCase().includes('freelance'),
		message: 'I\'m currently available for new opportunities!',
		ctaText: 'View availability & rates',
		ctaLink: '/contact?ref=autorag&topic=hiring',
		icon: '✨',
	},
];

// Message history limits
export const MAX_HISTORY_MESSAGES = 10;
export const COMPRESSION_THRESHOLD = 8;

// Quality scoring thresholds
export const QUALITY_THRESHOLDS = {
	HIGH: 80,
	MODERATE: 60,
	LOW: 0,
} as const;

// Retry configuration
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 2000;

// Text truncation limits
export const MAX_SUMMARY_LENGTH = 240;
export const SUMMARY_TRUNCATE_AT = 237; // Leave room for ellipsis

// Message compression limits
export const MAX_USER_MESSAGE_LENGTH = 150;
export const MAX_ASSISTANT_MESSAGE_LENGTH = 200;

// CTA generation thresholds
export const MULTIPLE_SOURCES_THRESHOLD = 2;
export const DEEP_CONVERSATION_THRESHOLD = 5;
export const MAX_CTAS = 3;
