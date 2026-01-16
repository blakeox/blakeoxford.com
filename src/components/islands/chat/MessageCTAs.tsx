/**
 * MessageCTAs Component
 * Renders contextual call-to-actions, matched CTAs, and follow-up suggestions
 */
import { memo } from 'react';
import { autoragEvents } from '../../../lib/analytics';
import {
	CONTEXTUAL_CTAS,
	generateContextualCTAs,
} from '../../../lib/chat';
import type { ChatMessage, Source } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchedCTAProps {
	message: ChatMessage;
	messages: ChatMessage[];
	sources: Source[];
}

interface FollowUpSuggestionsProps {
	sources: Source[];
	setInputValue: (value: string) => void;
	sendQuery: (query: string) => void;
}

interface ContextualCTAsProps {
	sources: Source[];
	siteHostname: string;
	messagesCount: number;
}

// ─── Matched CTA Component ────────────────────────────────────────────────────

export const MatchedCTA = memo(function MatchedCTA({
	message,
	messages,
	sources,
}: MatchedCTAProps) {
	const messageIndex = messages.findIndex((m) => m.id === message.id);
	const userQuery = messageIndex > 0 ? messages[messageIndex - 1]?.content || '' : '';
	const matchedCTA = CONTEXTUAL_CTAS.find((cta) => cta.condition(userQuery, sources));

	if (!matchedCTA) return null;

	return (
		<div className="mt-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:border-blue-800 dark:from-blue-950/30 dark:to-purple-950/30">
			<div className="flex items-start gap-3">
				<span className="shrink-0 text-2xl" aria-hidden="true">
					{matchedCTA.icon}
				</span>
				<div className="flex-1">
					<p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{matchedCTA.message}</p>
					<a
						href={matchedCTA.ctaLink}
						className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-900"
						onClick={() => {
							if (typeof window !== 'undefined') {
								autoragEvents.ctaClick({
									type: 'quality-suggestion',
									label: matchedCTA.ctaText,
									source: userQuery,
								});
							}
						}}
					>
						{matchedCTA.ctaText}
						<svg
							className="size-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</a>
				</div>
			</div>
		</div>
	);
});

// ─── Follow-Up Suggestions Component ──────────────────────────────────────────

export const FollowUpSuggestions = memo(function FollowUpSuggestions({
	sources,
	setInputValue,
	sendQuery,
}: FollowUpSuggestionsProps) {
	// Generate dynamic follow-up suggestions based on sources
	const suggestions: Array<{ label: string; query: string; icon: string }> = [];

	// Extract unique collections
	const collections = [...new Set(sources.map((s) => s.collection).filter(Boolean))] as string[];

	// Suggest exploring specific collections
	if (collections.includes('projects')) {
		const projectSources = sources.filter((s) => s.collection === 'projects');
		if (projectSources.length > 0) {
			const projectTitle = projectSources[0].title;
			suggestions.push({
				label: 'Project details',
				query: `Tell me more about the ${projectTitle} project`,
				icon: '🔍',
			});
		}
	}

	if (collections.includes('blog')) {
		const blogSources = sources.filter((s) => s.collection === 'blog');
		if (blogSources.length > 0) {
			const blogTitle = blogSources[0].title;
			suggestions.push({
				label: 'Related article',
				query: `What else has Blake written about topics in "${blogTitle}"?`,
				icon: '📚',
			});
		}
	}

	// Suggest digging deeper into top source
	if (sources[0] && sources[0].title) {
		const topSourceTitle = sources[0].title;
		if (!suggestions.some((s) => s.query.includes(topSourceTitle))) {
			suggestions.push({
				label: 'Deep dive',
				query: `Can you explain "${topSourceTitle}" in more detail?`,
				icon: '💡',
			});
		}
	}

	// Suggest comparing if multiple sources
	if (sources.length >= 2 && sources[0].title && sources[1].title) {
		suggestions.push({
			label: 'Compare',
			query: `How does "${sources[0].title}" compare to "${sources[1].title}"?`,
			icon: '⚖️',
		});
	}

	// Limit to 3 suggestions
	const limitedSuggestions = suggestions.slice(0, 3);

	if (limitedSuggestions.length === 0) return null;

	return (
		<div className="mt-3 space-y-2">
			<p className="text-xs font-medium uppercase tracking-wide text-[color:var(--fg)]/50">
				Keep exploring
			</p>
			<div className="flex flex-wrap gap-2">
				{limitedSuggestions.map((suggestion, index) => (
					<button
						key={index}
						type="button"
						onClick={() => {
							setInputValue(suggestion.query);
							setTimeout(() => sendQuery(suggestion.query), 100);

							autoragEvents.suggestedQuery({
								query: suggestion.query,
							});
						}}
						className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)]/40 bg-[color:var(--surface)]/50 px-3 py-1.5 text-xs text-[color:var(--fg)]/80 transition-all duration-200 hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--accent)]/10 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
					>
						<span className="text-sm" aria-hidden="true">{suggestion.icon}</span>
						{suggestion.label}
					</button>
				))}
			</div>
		</div>
	);
});

// ─── Contextual CTAs Component ────────────────────────────────────────────────

export const ContextualCTAs = memo(function ContextualCTAs({
	sources,
	siteHostname,
	messagesCount,
}: ContextualCTAsProps) {
	const ctas = generateContextualCTAs(sources, siteHostname, messagesCount);
	if (ctas.length === 0) return null;

	return (
		<div className="mt-3 space-y-2">
			<p className="text-xs font-medium uppercase tracking-wide text-[color:var(--fg)]/50">
				Take action
			</p>
			<div className="flex flex-col gap-2">
				{ctas.map((cta, index) => (
					<a
						key={index}
						href={cta.url}
						target={cta.url.startsWith('http') ? '_blank' : undefined}
						rel={cta.url.startsWith('http') ? 'noreferrer' : undefined}
						onClick={() => {
							autoragEvents.ctaClick({
								type: cta.type,
								label: cta.label,
							});
						}}
						className="group inline-flex items-center gap-2.5 rounded-xl border border-[color:var(--accent)]/30 bg-gradient-to-br from-[color:var(--accent)]/10 to-[color:var(--accent)]/5 px-4 py-3 text-sm font-medium text-[color:var(--accent-strong)] shadow-sm transition-all duration-200 hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--accent)]/15 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
					>
						<span className="text-lg" aria-hidden="true">{cta.icon}</span>
						<span className="flex-1">{cta.label}</span>
						<svg className="size-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
						</svg>
					</a>
				))}
			</div>
		</div>
	);
});
