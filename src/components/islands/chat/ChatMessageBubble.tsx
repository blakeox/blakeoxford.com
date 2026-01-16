/**
 * ChatMessageBubble component
 * Renders a single chat message with sources, actions, and feedback
 *
 * This is the main container component that composes:
 * - MessageContent: Core message rendering with quality indicators
 * - MessageSources: Source citations and expandable source lists
 * - MessageActions: Copy, share, feedback buttons
 * - MessageCTAs: Contextual call-to-actions and follow-up suggestions
 */
import { memo } from 'react';
import {
	cleanAssistantResponse,
	decodeHtmlEntities,
	decodeMimeEncodedWords,
} from '../../../lib/string-utils';
import { QualityIndicator } from './MessageContent';
import { CitationLinks, SourcesList } from './MessageSources';
import { MessageActions } from './MessageActions';
import { MatchedCTA, FollowUpSuggestions, ContextualCTAs } from './MessageCTAs';
import type { ChatMessageBubbleProps } from './types';

/**
 * ChatMessageBubble - Main container component
 * Composes sub-components for message rendering, sources, actions, and CTAs
 */
export const ChatMessageBubble = memo(function ChatMessageBubble({
	message,
	isStreaming,
	siteHostname,
	expandedSources,
	expandedIndividualSources,
	copiedMessageId,
	copiedShareUrl,
	messages,
	messagesRef,
	sourceRefs,
	toggleExpandedSource,
	toggleIndividualSource,
	handleFeedback,
	handleCopyMessage,
	handleOpenPrimarySource,
	setInputValue,
	sendQuery,
	copyWithFeedback,
}: ChatMessageBubbleProps) {
	const alignment = message.role === 'user' ? 'items-end text-right' : 'items-start text-left';
	const bubbleClasses = message.role === 'user'
		? 'bg-[color:var(--accent)] text-[color:var(--on-accent)]'
		: 'bg-[color:var(--surface)]/95 text-[color:var(--fg)] dark:bg-[color:var(--surface)]/90';
	const isAssistant = message.role === 'assistant';
	const bubbleContent = isAssistant ? cleanAssistantResponse(message.content) : message.content;
	const sources = isAssistant && message.sources ? message.sources : [];
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
	const isHelpful = message.feedback === 'positive';
	const isNotHelpful = message.feedback === 'negative';
	const messageTextClasses = isAssistant ? 'text-[0.95rem] leading-relaxed' : 'text-[0.9rem] leading-snug';

	return (
		<div key={message.id} className={`flex flex-col gap-2 ${alignment}`} data-ai-message-role={message.role}>
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
						<QualityIndicator message={message} totalSources={totalSources} />
					)}
					{isAssistant && totalSources > 0 && (
						<CitationLinks sources={sources} messageId={message.id} handleOpenPrimarySource={handleOpenPrimarySource} />
					)}
				</div>
			</div>

			{isAssistant && totalSources > 0 && (
				<SourcesList
					message={message}
					sources={sources}
					showAllSources={showAllSources}
					primarySource={primarySource}
					primarySourceTitle={primarySourceTitle}
					primaryLinkTarget={primaryLinkTarget}
					primaryLinkRel={primaryLinkRel}
					totalSources={totalSources}
					siteHostname={siteHostname}
					expandedIndividualSources={expandedIndividualSources}
					sourceRefs={sourceRefs}
					toggleExpandedSource={toggleExpandedSource}
					toggleIndividualSource={toggleIndividualSource}
				/>
			)}

			{/* Contextual CTA for matched conditions */}
			{isAssistant && sources.length > 0 && (
				<MatchedCTA
					message={message}
					messages={messages}
					sources={sources}
				/>
			)}

			{/* Dynamic follow-up suggestions */}
			{isAssistant && sources.length > 0 && (
				<FollowUpSuggestions
					sources={sources}
					setInputValue={setInputValue}
					sendQuery={sendQuery}
				/>
			)}

			{/* Contextual CTAs */}
			{isAssistant && sources.length > 0 && (
				<ContextualCTAs
					sources={sources}
					siteHostname={siteHostname}
					messagesCount={messagesRef.current.length}
				/>
			)}

			{isAssistant && (
				<MessageActions
					message={message}
					messages={messages}
					primarySource={primarySource}
					copiedMessageId={copiedMessageId}
					copiedShareUrl={copiedShareUrl}
					isHelpful={isHelpful}
					isNotHelpful={isNotHelpful}
					handleCopyMessage={handleCopyMessage}
					handleOpenPrimarySource={handleOpenPrimarySource}
					handleFeedback={handleFeedback}
					copyWithFeedback={copyWithFeedback}
				/>
			)}
		</div>
	);
});
