/**
 * MessageContent Component
 * Renders the message text content with quality indicators
 */
import { memo } from 'react';
import { getConfidenceIndicator, getCitationHealthIndicator } from '../../../lib/quality-utils';
import type { ChatMessage } from './types';

interface MessageContentProps {
	message: ChatMessage;
	isStreaming: boolean;
	isAssistant: boolean;
	bubbleContent: string;
	totalSources: number;
	messageTextClasses: string;
}

export const MessageContent = memo(function MessageContent({
	message,
	isStreaming,
	isAssistant,
	bubbleContent,
	totalSources,
	messageTextClasses,
}: MessageContentProps) {
	return (
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
		</div>
	);
});

/**
 * Quality indicator badge - Exported for use in ChatMessageBubble
 */
export const QualityIndicator = memo(function QualityIndicator({ message, totalSources }: { message: ChatMessage; totalSources: number }) {
	const indicator = getConfidenceIndicator(message.qualityScore ?? 0);
	return (
		<div className="flex flex-wrap items-center gap-1.5 text-[0.65rem]">
			<span className={`font-medium ${indicator.color}`} aria-label={`Quality: ${indicator.label}`}>
				<span aria-hidden="true">{indicator.emoji}</span> {indicator.label}
			</span>
			<span className="text-[color:var(--fg)]/40">·</span>
			<span className="text-[color:var(--fg)]/50" title={`Response quality score: ${message.qualityScore}/100`}>
				{message.qualityScore}/100
			</span>
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
	);
});
