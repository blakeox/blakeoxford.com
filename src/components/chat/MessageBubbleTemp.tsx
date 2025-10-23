import React from 'react';
import type { ChatMessage } from '../../lib/chat-types';
import { cleanAssistantResponse } from '../../lib/string-utils';
import { decodeHtmlEntities, decodeMimeEncodedWords, formatPublishedDate } from '../../lib/string-utils';
import { getCitationHealthIndicator, getConfidenceIndicator } from '../../lib/quality-utils';
import { cleanSnippet } from '../../lib/chat-helpers';
import { getRelevanceExplanation } from '../../lib/response-handlers';
import { CONTEXTUAL_CTAS } from '../../lib/chat-constants';
import { generateContextualCTAs } from '../../lib/message-processing';
import { autoragEvents } from '../../lib/analytics';

interface MessageBubbleProps {
	message: ChatMessage;
	messages: ChatMessage[];
	streamingMessageId: string | null;
	expandedSources: Record<string, boolean>;
	expandedIndividualSources: Record<string, boolean>;
	toggleExpandedSource: (id: string) => void;
	toggleIndividualSource: (key: string) => void;
	handleOpenPrimarySource: (url: string) => void;
	handleCopyMessage: (message: ChatMessage) => void;
	copyWithFeedback: (text: string, id: string, type?: string) => Promise<boolean>;
	setInputValue: (value: string) => void;
	sendQuery: (query: string) => Promise<void>;
	siteHostname: string;
	sourceRefs: React.MutableRefObject<HTMLAnchorElement[]>;
	messagesRef: React.MutableRefObject<ChatMessage[]>;
	handleFeedback: (messageId: string, feedbackType: 'positive' | 'negative') => void;
	copiedMessageId: string | null;
	copiedShareUrl: string | null;
}

export default function MessageBubble(props: MessageBubbleProps) {
	const {
		message,
		messages,
		streamingMessageId,
		expandedSources,
		expandedIndividualSources,
		toggleExpandedSource,
		toggleIndividualSource,
		handleOpenPrimarySource,
		handleCopyMessage,
		copyWithFeedback,
		setInputValue,
		sendQuery,
		siteHostname,
		sourceRefs,
		messagesRef,
		handleFeedback,
		copiedMessageId,
		copiedShareUrl,
	} = props;

	const alignment = message.role === 'user' ? 'items-end text-right' : 'items-start text-left';
	const bubbleClasses = message.role === 'user'
		? 'bg-[color:var(--accent)] text-[color:var(--on-accent)]'
		: 'bg-[color:var(--surface)]/95 text-[color:var(--fg)] dark:bg-[color:var(--surface)]/90';
	const isAssistant = message.role === 'assistant';
	const isStreaming = streamingMessageId === message.id;
	const bubbleContent = isAssistant ? cleanAssistantResponse(message.content) : message.content;
	const sources = (isAssistant && message.sources) ? message.sources : [];
	const totalSources = sources.length;
	const showAllSources = isAssistant ? Boolean(expandedSources[message.id]) : false;
	const primarySource = sources[0] ?? null;
	const primarySourceTitle = primarySource ? decodeMimeEncodedWords(decodeHtmlEntities(primarySource.title || primarySource.url)) : null;

	let primarySourceIsExternal = false;
	if (primarySource) {
		try {
			const parsed = primarySource.url.startsWith('http')
				? new URL(primarySource.url)
				: new URL(primarySource.url, `https://${siteHostname}`);
			primarySourceIsExternal = parsed.hostname !== siteHostname;
		} catch {
			primarySourceIsExternal = !primarySource.url.startsWith('/');
		}
	}
	const primaryLinkTarget = primarySourceIsExternal ? '_blank' : undefined;
	const primaryLinkRel = primarySourceIsExternal ? 'noreferrer' : undefined;
	const messageTextClasses = isAssistant ? 'text-[0.95rem] leading-relaxed' : 'text-[0.9rem] leading-snug';
	const isHelpful = message.feedback === 'positive';
	const isNotHelpful = message.feedback === 'negative';

	return (
		<div className={`flex flex-col gap-2 ${alignment}`} data-ai-message-role={message.role}>
			<div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ring-1 ring-[color:var(--border)]/20 dark:ring-[color:var(--border)]/30 ${bubbleClasses}`}>
				<div className="flex flex-col gap-2">
					{bubbleContent ? (
						<span className={`whitespace-pre-wrap break-words ${messageTextClasses}`}>{bubbleContent}</span>
					) : (
						isAssistant && !isStreaming ? (
							<span className={`whitespace-pre-wrap break-words ${messageTextClasses}`}>Thinking…</span>
						) : null
					)}
					{isAssistant && isStreaming && (
						<span className="flex items-center gap-1 text-[0.75rem] text-[color:var(--fg)]/60" aria-live="assertive">
							<span className="sr-only">Assistant is responding</span>
							<span aria-hidden="true" className="size-1.5 rounded-full bg-[color:var(--accent)]/60 animate-pulse" />
							<span aria-hidden="true" className="size-1.5 rounded-full bg-[color:var(--accent)]/60 animate-pulse [animation-delay:150ms]" />
							<span aria-hidden="true" className="size-1.5 rounded-full bg-[color:var(--accent)]/60 animate-pulse [animation-delay:300ms]" />
						</span>
					)}
					{isAssistant && !isStreaming && message.qualityScore !== undefined && (
						<div className="flex flex-wrap items-center gap-1.5 text-[0.65rem]">
							{(() => {
								const indicator = getConfidenceIndicator(message.qualityScore);
								return (
									<>
										<span className={`font-medium ${indicator.color}`} aria-label={`Quality: ${indicator.label}`}>
											<span aria-hidden="true">{indicator.emoji}</span> {indicator.label}
										</span>
										<span className="text-[color:var(--fg)]/40">·</span>
										<span className="text-[color:var(--fg)]/50" title={`Response quality score: ${message.qualityScore}/100`}>
											{message.qualityScore}/100
										</span>
									</>
								);
							})()}
							{message.citationHealth && totalSources > 0 && (
								<>
									<span className="text-[color:var(--fg)]/40">·</span>
									{(() => {
										const healthIndicator = getCitationHealthIndicator(message.citationHealth);
										return (
											<span
												className={`font-medium ${healthIndicator.color}`}
												title={healthIndicator.description}
												aria-label={`Citation health: ${healthIndicator.label}`}
											>
												<span aria-hidden="true">{healthIndicator.icon}</span> {healthIndicator.label}
											</span>
										);
									})()}
								</>
							)}
						</div>
					)}
					{isAssistant && totalSources > 0 && (
						<div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-[color:var(--fg)]/60">
							<span className="uppercase tracking-wide text-[color:var(--fg)]/45">Cited</span>
							{sources.map((source, index) => (
								<button
									key={`${message.id}-citation-${index}`}
									type="button"
									className="rounded-full border border-[color:var(--accent)]/30 px-2 py-0.5 text-[color:var(--accent)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]"
									onClick={() => handleOpenPrimarySource(source.url)}
								>
									[{index + 1}]
								</button>
							))}
						</div>
					)}
				</div>
			</div>
			{isAssistant && totalSources > 0 && (
				<div className="mt-1 flex flex-col gap-2 text-xs" aria-label="Referenced sources">
					<div className="flex flex-wrap items-center gap-2">
						<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Sources</span>
						{primarySource && primarySourceTitle && (
							<a
								href={primarySource.url}
								target={primaryLinkTarget}
								rel={primaryLinkRel}
								className="max-w-full min-w-0 break-words whitespace-normal rounded-full border border-[color:var(--border)]/40 px-2.5 py-0.5 text-left text-[0.65rem] leading-tight text-[color:var(--accent)] transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]"
							>
								{primarySourceTitle}
							</a>
						)}
						{totalSources > 1 && !showAllSources && (
							<span className="text-[color:var(--fg)]/50">+{totalSources - 1} more</span>
						)}
						<button
							type="button"
							className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-2.5 py-0.5 text-[0.65rem] text-[color:var(--fg)]/65 transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]/40"
							onClick={() => toggleExpandedSource(message.id)}
						>
							{showAllSources ? 'Hide details' : totalSources > 1 ? `Show all (${totalSources})` : 'Show details'}
						</button>
					</div>
					{showAllSources && (
						<ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
							{sources.map((source, index) => {
								const relevance = typeof source.score === 'number' ? Math.round(Math.min(Math.max(source.score, 0), 1) * 100) : null;
								const title = decodeMimeEncodedWords(decodeHtmlEntities(source.title || ''));
								const displayTitle = title || decodeMimeEncodedWords(decodeHtmlEntities(source.url));
								const snippetSource = source.summary || source.snippet || '';
								const snippet = snippetSource ? cleanSnippet(snippetSource) : '';
								const publishedLabel = formatPublishedDate(source.publishedAt ?? undefined);
								const sourceKey = `${message.id}-source-${index}`;
								const isExpanded = expandedIndividualSources[sourceKey];
								const relevanceInfo = relevance !== null ? getRelevanceExplanation(relevance) : null;

								let isExternalLink = false;
								try {
									const parsed = source.url.startsWith('http')
										? new URL(source.url)
										: new URL(source.url, `https://${siteHostname}`);
									isExternalLink = parsed.hostname !== siteHostname;
								} catch {
									isExternalLink = !source.url.startsWith('/');
								}
								const linkTarget = isExternalLink ? '_blank' : undefined;
								const linkRel = isExternalLink ? 'noreferrer' : undefined;
								return (
									<li
										key={sourceKey}
										className="group w-full rounded-2xl border border-[color:var(--border)]/40 bg-gradient-to-br from-[color:var(--surface-subtle)]/40 to-[color:var(--surface)]/20 px-4 py-3 text-left text-[color:var(--fg)]/80 shadow-sm transition hover:border-[color:var(--accent)]/60 hover:bg-[color:var(--surface)]/60 hover:shadow-md"
									>
										<div className="flex items-start gap-3">
											<div className="flex shrink-0 items-center gap-2">
												<span className="inline-flex size-6 items-center justify-center rounded-full bg-[color:var(--accent)]/15 text-xs font-bold text-[color:var(--accent)]">{index + 1}</span>
												{source.icon && <span className="shrink-0 text-xl" aria-hidden="true">{source.icon}</span>}
											</div>
											<div className="min-w-0 flex-1">
												<a
													ref={(element) => {
														if (element) sourceRefs.current.push(element);
													}}
													href={source.url}
													tabIndex={0}
													target={linkTarget}
													rel={linkRel}
													className="block font-medium text-[color:var(--accent)] underline decoration-dotted underline-offset-2 transition group-hover:text-[color:var(--accent-strong)]"
												>
													{displayTitle}
												</a>
												<div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.65rem] text-[color:var(--fg)]/60">
													{source.collection && (
														<span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--accent)]/15 px-2.5 py-0.5 font-semibold text-[color:var(--accent-strong)]">
															{source.collection === 'blog' && '📝'}
															{source.collection === 'projects' && '🚀'}
															{source.collection !== 'blog' && source.collection !== 'projects' && '📄'}
															{source.collection}
														</span>
													)}
													{relevance !== null && (
														<span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold ${
															relevance >= 90
																? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-700 dark:text-green-400'
																: relevance >= 75
																? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/10 text-blue-700 dark:text-blue-400'
																: relevance >= 60
																? 'bg-gradient-to-r from-purple-500/20 to-pink-500/10 text-purple-700 dark:text-purple-400'
																: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/10 text-yellow-700 dark:text-yellow-400'
														}`}>
															<svg className="size-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
																<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
															</svg>
															{relevance}% match
														</span>
													)}
													{publishedLabel && (
														<time className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/60 px-2.5 py-0.5" dateTime={source.publishedAt ?? undefined}>
															<svg className="size-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
																<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
															</svg>
															{publishedLabel}
														</time>
													)}
													{isExternalLink && (
														<span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/40 px-2.5 py-0.5 text-[color:var(--fg)]/50">
															External
															<svg className="size-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
																<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 5h7.06m0 0v7.06m0-7.06-8.12 8.12" />
															</svg>
														</span>
													)}
												</div>

												{/* Relevance Explanation & Expand Toggle */}
												{(relevanceInfo || snippet) && (
													<div className="mt-2">
														{relevanceInfo && !isExpanded && (
															<div className={`flex items-start gap-2 rounded-lg border border-[color:var(--border)]/20 bg-[color:var(--surface)]/20 px-3 py-2 text-[0.65rem] ${relevanceInfo.color}`}>
																<span className="text-sm" aria-hidden="true">{relevanceInfo.icon}</span>
																<span className="flex-1 leading-relaxed">{relevanceInfo.text}</span>
															</div>
														)}

														{(snippet || relevanceInfo) && (
															<button
																type="button"
																onClick={() => toggleIndividualSource(sourceKey)}
																className="mt-1.5 inline-flex items-center gap-1 text-[0.65rem] text-[color:var(--accent)] transition hover:text-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]/40"
															>
																<svg
																	className={`size-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
																	viewBox="0 0 20 20"
																	fill="currentColor"
																	aria-hidden="true"
																>
																	<path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
																</svg>
																{isExpanded ? 'Hide details' : 'Show details'}
															</button>
														)}

														{/* Expanded Details */}
														{isExpanded && (
															<div className="mt-2 space-y-2">
																{relevanceInfo && (
																	<div className={`flex items-start gap-2 rounded-lg border border-[color:var(--border)]/20 bg-[color:var(--surface)]/20 px-3 py-2 text-[0.65rem] ${relevanceInfo.color}`}>
																		<span className="text-sm" aria-hidden="true">{relevanceInfo.icon}</span>
																		<div className="flex-1">
																			<div className="font-medium">Why this source?</div>
																			<div className="mt-0.5 leading-relaxed">{relevanceInfo.text}</div>
																		</div>
																	</div>
																)}
																{snippet && (
																	<p className="rounded-lg border border-[color:var(--border)]/20 bg-[color:var(--surface)]/30 px-3 py-2 text-xs leading-relaxed text-[color:var(--fg)]/70">
																		<span className="font-medium text-[color:var(--fg)]/50">Preview: </span>
																		{snippet}
																	</p>
																)}
															</div>
														)}
													</div>
												)}
											</div>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			)}
			{isAssistant && sources.length > 0 && (() => {
				const messageIndex = messages.findIndex((m) => m.id === message.id);
				const userQuery = messageIndex > 0 ? messages[messageIndex - 1]?.content || '' : '';
				const matchedCTA = CONTEXTUAL_CTAS.find((cta) => cta.condition(userQuery, sources));

				if (matchedCTA) {
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
				}
				return null;
			})()}
			{isAssistant && sources.length > 0 && (() => {
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
			})()}

			{/* Contextual CTAs */}
			{isAssistant && sources.length > 0 && (() => {
				const ctas = generateContextualCTAs(sources, siteHostname, messagesRef.current.length);
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
			})()}

			{isAssistant && (
				<div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-[color:var(--fg)]/60">
					<button
						type="button"
						className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
						onClick={() => handleCopyMessage(message)}
					>
						{copiedMessageId === message.id ? 'Copied' : 'Copy answer'}
					</button>
					<button
						type="button"
						className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
						title="Share this query"
						onClick={() => {
							const messageIndex = messages.findIndex((m) => m.id === message.id);
							const userQuery = messageIndex > 0 ? messages[messageIndex - 1]?.content || '' : '';
							const shareUrl = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(userQuery)}&autosubmit=true`;

							if (navigator.share) {
								navigator.share({
									title: 'AutoRAG Query Result',
									text: `Check out this answer from Blake's AI assistant: "${userQuery}"`,
									url: shareUrl,
								}).then(() => {
									autoragEvents.share('native');
								}).catch(() => {/* User cancelled */});
							} else {
								copyWithFeedback(shareUrl, message.id, 'share').then((success) => {
									if (success) {
										autoragEvents.share('clipboard');
									}
								});
							}
						}}
					>
						{copiedShareUrl === message.id ? (
							<>
								<svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
								Copied!
							</>
						) : (
							<>
								<svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
								</svg>
								Share
							</>
						)}
					</button>
					{primarySource?.url && (
						<button
							type="button"
							className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
							onClick={() => handleOpenPrimarySource(primarySource.url)}
						>
							View top source
						</button>
					)}

					{/* Quality Score Indicator */}
					{message.qualityScore !== undefined && message.qualityScore > 0 && (() => {
						const confidence = getConfidenceIndicator(message.qualityScore);
						const hasDetails = message.qualityDetails !== undefined;

						return (
							<div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/50 px-3 py-1 text-[0.65rem]" title={hasDetails ? `Completeness: ${message.qualityDetails?.completeness}% | Citations: ${message.qualityDetails?.citationAccuracy}% | Conciseness: ${message.qualityDetails?.conciseness}% | Relevance: ${message.qualityDetails?.relevance}%` : `Overall quality score: ${message.qualityScore}%`}>
								<span className={confidence.color} aria-hidden="true">{confidence.emoji}</span>
								<span className="text-[color:var(--fg)]/60">{message.qualityScore}%</span>
								{hasDetails && (
									<span className={`font-medium ${confidence.color}`}>{confidence.label}</span>
								)}
							</div>
						);
					})()}

					<div className="ml-auto inline-flex items-center gap-1">
						<button
							type="button"
							className={`inline-flex size-7 items-center justify-center rounded-full border border-[color:var(--border)]/40 transition hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
								isHelpful ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
							}`}
							aria-label={isHelpful ? 'Marked helpful' : 'Mark answer helpful'}
							onClick={() => handleFeedback(message.id, 'positive')}
						>
							👍
						</button>
						<button
							type="button"
							className={`inline-flex size-7 items-center justify-center rounded-full border border-[color:var(--border)]/40 transition hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
								isNotHelpful ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
							}`}
							aria-label={isNotHelpful ? 'Marked not helpful' : 'Mark answer not helpful'}
							onClick={() => handleFeedback(message.id, 'negative')}
						>
							👎
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
