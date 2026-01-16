/**
 * MessageActions - Renders interactive action buttons for chat messages
 *
 * @component
 * @category Islands/Chat
 * @subcategory Message Interactions
 *
 * @description
 * A memoized React component that provides action buttons for AI chat messages:
 * - Copy answer to clipboard
 * - Share query via native share or clipboard
 * - View top source in new tab
 * - Quality score badge display
 * - Thumbs up/down feedback buttons
 *
 * Integrates with analytics tracking and provides visual feedback for all actions.
 *
 * @example Basic usage
 * ```tsx
 * <MessageActions
 *   message={chatMessage}
 *   messages={allMessages}
 *   primarySource={sources[0]}
 *   copiedMessageId={copiedId}
 *   copiedShareUrl={copiedUrl}
 *   isHelpful={feedbackState.helpful}
 *   isNotHelpful={feedbackState.notHelpful}
 *   handleCopyMessage={(msg) => navigator.clipboard.writeText(msg.content)}
 *   handleOpenPrimarySource={(url) => window.open(url, '_blank')}
 *   handleFeedback={(id, feedback) => submitFeedback(id, feedback)}
 *   copyWithFeedback={async (content, id, type) => { ... }}
 * />
 * ```
 *
 * @accessibility
 * - All buttons have focus-visible ring indicators
 * - Keyboard navigation fully supported (Tab, Enter)
 * - Visual state changes for copied/feedback actions
 * - ARIA labels on interactive elements
 * - Semantic button elements with type="button"
 *
 * @performance
 * - Wrapped in React.memo to prevent unnecessary re-renders
 * - Sub-components (ShareButton, QualityScoreBadge, FeedbackButtons) are optimized
 * - Analytics events fire only on user interaction
 *
 * @analytics
 * - Tracks copy, share, feedback, and source navigation events
 * - Uses autoragEvents for centralized analytics
 */
import { memo } from 'react';
import { autoragEvents } from '../../../lib/analytics';
import { getConfidenceIndicator } from '../../../lib/quality-utils';
import type { ChatMessage, Source } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MessageActionsProps {
	message: ChatMessage;
	messages: ChatMessage[];
	primarySource: Source | null;
	copiedMessageId: string | null;
	copiedShareUrl: string | null;
	isHelpful: boolean;
	isNotHelpful: boolean;
	handleCopyMessage: (message: ChatMessage) => void;
	handleOpenPrimarySource: (url: string) => void;
	handleFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
	copyWithFeedback: (content: string, id: string, type: 'message' | 'share') => Promise<boolean>;
}

// ─── Message Actions Component ────────────────────────────────────────────────

export const MessageActions = memo(function MessageActions({
	message,
	messages,
	primarySource,
	copiedMessageId,
	copiedShareUrl,
	isHelpful,
	isNotHelpful,
	handleCopyMessage,
	handleOpenPrimarySource,
	handleFeedback,
	copyWithFeedback,
}: MessageActionsProps) {
	return (
		<div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-[color:var(--fg)]/60">
			<button
				type="button"
				className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
				onClick={() => handleCopyMessage(message)}
			>
				{copiedMessageId === message.id ? 'Copied' : 'Copy answer'}
			</button>
			
			<ShareButton
				message={message}
				messages={messages}
				copiedShareUrl={copiedShareUrl}
				copyWithFeedback={copyWithFeedback}
			/>
			
			{primarySource?.url && (
				<button
					type="button"
					className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
					onClick={() => handleOpenPrimarySource(primarySource.url)}
				>
					View top source
				</button>
			)}

			<QualityScoreBadge message={message} />

			<FeedbackButtons
				messageId={message.id}
				isHelpful={isHelpful}
				isNotHelpful={isNotHelpful}
				handleFeedback={handleFeedback}
			/>
		</div>
	);
});

// ─── Share Button Component ───────────────────────────────────────────────────

function ShareButton({
	message,
	messages,
	copiedShareUrl,
	copyWithFeedback,
}: {
	message: ChatMessage;
	messages: ChatMessage[];
	copiedShareUrl: string | null;
	copyWithFeedback: (content: string, id: string, type: 'message' | 'share') => Promise<boolean>;
}) {
	const handleShare = () => {
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
	};

	return (
		<button
			type="button"
			className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-3 py-1 transition hover:border-[color:var(--accent)]/50 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
			title="Share this query"
			onClick={handleShare}
		>
			{copiedShareUrl === message.id ? (
				<>
					<svg className="size-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
						<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
					</svg>
					Copied!
				</>
			) : (
				<>
					<svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
					</svg>
					Share
				</>
			)}
		</button>
	);
}

// ─── Quality Score Badge Component ────────────────────────────────────────────

function QualityScoreBadge({ message }: { message: ChatMessage }) {
	if (message.qualityScore === undefined || message.qualityScore <= 0) {
		return null;
	}

	const confidence = getConfidenceIndicator(message.qualityScore);
	const hasDetails = message.qualityDetails !== undefined;

	return (
		<div 
			className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/50 px-3 py-1 text-[0.65rem]" 
			title={hasDetails 
				? `Completeness: ${message.qualityDetails?.completeness}% | Citations: ${message.qualityDetails?.citationAccuracy}% | Conciseness: ${message.qualityDetails?.conciseness}% | Relevance: ${message.qualityDetails?.relevance}%` 
				: `Overall quality score: ${message.qualityScore}%`
			}
		>
			<span className={confidence.color} aria-hidden="true">{confidence.emoji}</span>
			<span className="text-[color:var(--fg)]/60">{message.qualityScore}%</span>
			{hasDetails && (
				<span className={`font-medium ${confidence.color}`}>{confidence.label}</span>
			)}
		</div>
	);
}

// ─── Feedback Buttons Component ───────────────────────────────────────────────

function FeedbackButtons({
	messageId,
	isHelpful,
	isNotHelpful,
	handleFeedback,
}: {
	messageId: string;
	isHelpful: boolean;
	isNotHelpful: boolean;
	handleFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
}) {
	return (
		<div className="ml-auto inline-flex items-center gap-1">
			<button
				type="button"
				className={`inline-flex size-7 items-center justify-center rounded-full border border-[color:var(--border)]/40 transition hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
					isHelpful ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
				}`}
				aria-label={isHelpful ? 'Marked helpful' : 'Mark answer helpful'}
				onClick={() => handleFeedback(messageId, 'positive')}
			>
				👍
			</button>
			<button
				type="button"
				className={`inline-flex size-7 items-center justify-center rounded-full border border-[color:var(--border)]/40 transition hover:border-[color:var(--accent)]/60 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 ${
					isNotHelpful ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent-strong)]' : ''
				}`}
				aria-label={isNotHelpful ? 'Marked not helpful' : 'Mark answer not helpful'}
				onClick={() => handleFeedback(messageId, 'negative')}
			>
				👎
			</button>
		</div>
	);
}
