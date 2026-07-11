/**
 * ChatMessageBubble — restrained message UI aligned with Find overlay density.
 */
import { memo } from 'react';
import {
	cleanAssistantResponse,
	decodeHtmlEntities,
	decodeMimeEncodedWords,
} from '../../../lib/string-utils';
import { formatAISearchProvenance } from '../../../lib/ai-search';
import { SourcesList } from './MessageSources';
import { MessageActions } from './MessageActions';
import { FollowUpSuggestions, MatchedCTA } from './MessageCTAs';
import type { ChatMessageBubbleProps } from './types';

export const ChatMessageBubble = memo(function ChatMessageBubble({
	message,
	isStreaming,
	siteHostname,
	expandedSources,
	expandedIndividualSources,
	copiedMessageId,
	copiedShareUrl,
	messages,
	messagesRef: _messagesRef,
	sourceRefs,
	toggleExpandedSource,
	toggleIndividualSource,
	handleFeedback,
	handleCopyMessage,
	handleOpenPrimarySource,
	setInputValue,
	sendQuery,
	copyWithFeedback,
	isLatestAssistant = false,
}: ChatMessageBubbleProps) {
	const isAssistant = message.role === 'assistant';
	const bubbleContent = isAssistant ? cleanAssistantResponse(message.content) : message.content;
	const sources = isAssistant && message.sources ? message.sources : [];
	const totalSources = sources.length;
	const provenanceLabel =
		isAssistant && !isStreaming
			? formatAISearchProvenance(message.provenance, totalSources)
			: null;
	const showAllSources = isAssistant ? Boolean(expandedSources[message.id]) : false;
	const primarySource = sources[0] ?? null;
	const primarySourceTitle = primarySource
		? decodeMimeEncodedWords(decodeHtmlEntities(primarySource.title || primarySource.url))
		: null;
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

	return (
		<div
			key={message.id}
			className={`flex flex-col gap-1.5 ${isAssistant ? 'items-start' : 'items-end'}`}
			data-ai-message-role={message.role}
		>
			<div
				className={`max-w-[92%] px-3.5 py-2.5 text-sm ${
					isAssistant
						? 'rounded-2xl rounded-tl-md bg-surface-subtle/90 text-foreground ring-1 ring-border/30'
						: 'rounded-2xl rounded-tr-md bg-accent text-on-accent shadow-sm shadow-accent/20'
				}`}
			>
				{bubbleContent ? (
					<span className={`whitespace-pre-wrap break-words ${isAssistant ? 'leading-relaxed' : 'leading-snug'}`}>
						{bubbleContent}
					</span>
				) : isAssistant && !isStreaming ? (
					<span className="text-muted-foreground">Thinking…</span>
				) : null}
				{isAssistant && isStreaming ? (
					<span className="mt-1 flex items-center gap-1" aria-live="polite">
						<span className="sr-only">Assistant is responding</span>
						<span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-accent/60" />
						<span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-accent/60 [animation-delay:150ms]" />
						<span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-accent/60 [animation-delay:300ms]" />
					</span>
				) : null}
			</div>

			{provenanceLabel ? (
				<span
					className="max-w-[92%] px-1 text-xxs text-subtle-foreground"
					data-ai-provenance
					title={
						message.provenance?.provider
							? `Cloudflare ${message.provenance.provider}${message.provenance.cacheStatus ? ` · cache ${message.provenance.cacheStatus}` : ''}`
							: undefined
					}
				>
					{provenanceLabel}
				</span>
			) : null}

			{isAssistant && totalSources > 0 && !isStreaming ? (
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
			) : null}

			{isAssistant && isLatestAssistant && !isStreaming && sources.length > 0 ? (
				<>
					<FollowUpSuggestions
						sources={sources}
						setInputValue={setInputValue}
						sendQuery={sendQuery}
						maxSuggestions={2}
					/>
					<MatchedCTA message={message} messages={messages} sources={sources} compact />
				</>
			) : null}

			{isAssistant && !isStreaming ? (
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
					compact
				/>
			) : null}
		</div>
	);
});

ChatMessageBubble.displayName = 'ChatMessageBubble';
