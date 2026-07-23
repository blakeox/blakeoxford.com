/**
 * MessageContent - Renders message text content with streaming indicators and quality badges
 *
 * @component
 * @category Islands/Chat
 * @subcategory Message Display
 *
 * @description
 * A memoized React component that displays chat message content with streaming animations,
 * quality indicators, and accessibility features. Shows typing indicators during streaming,
 * quality scores after completion, and citation health metrics.
 *
 * @example Basic usage (assistant message)
 * ```tsx
 * <MessageContent
 * message={chatMessage}
 * isStreaming={false}
 * isAssistant={true}
 * bubbleContent="Here's your answer..."
 * totalSources={3}
 * messageTextClasses="text-foreground"
 * />
 * ```
 *
 * @example Streaming message
 * ```tsx
 * <MessageContent
 * message={chatMessage}
 * isStreaming={true}
 * isAssistant={true}
 * bubbleContent="Thinking about..."
 * totalSources={0}
 * messageTextClasses="text-foreground"
 * />
 * ```
 *
 * @accessibility
 * - Streaming indicator uses aria-live="assertive" for screen reader announcements
 * - Quality indicators have aria-label attributes for score interpretation
 * - Visual-only animations use aria-hidden="true" with screen reader text
 * - Supports keyboard navigation via parent component
 *
 * @performance
 * - Wrapped in React.memo to prevent unnecessary re-renders
 * - Conditional rendering based on streaming state
 * - QualityIndicator also memoized separately
 */
import { memo } from 'react';
import { getConfidenceIndicator, getCitationHealthIndicator } from '@/lib/quality-utils';
import type { ChatMessage } from '@/features/chat/types';

/**
 * Props for MessageContent component
 */
interface MessageContentProps {
  /** The complete chat message object with metadata */
  message: ChatMessage;
  /** Whether the message is currently being streamed */
  isStreaming: boolean;
  /** Whether this is an assistant (AI) message vs user message */
  isAssistant: boolean;
  /** The processed message text content to display */
  bubbleContent: string;
  /** Number of sources cited in the message */
  totalSources: number;
  /** Tailwind classes for text styling (color, size, etc.) */
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
        <span className={`break-words whitespace-pre-wrap ${messageTextClasses}`}>
          {bubbleContent}
        </span>
      ) : isAssistant && !isStreaming ? (
        <span className={`break-words whitespace-pre-wrap ${messageTextClasses}`}>Thinking…</span>
      ) : null}

      {isAssistant && isStreaming && (
        <span
          className="flex items-center gap-1 text-[0.75rem] text-foreground/60"
          aria-live="polite"
        >
          <span className="sr-only">Assistant is responding</span>
          <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-accent/60" />
          <span
            aria-hidden="true"
            className="size-1.5 animate-pulse rounded-full bg-accent/60 [animation-delay:150ms]"
          />
          <span
            aria-hidden="true"
            className="size-1.5 animate-pulse rounded-full bg-accent/60 [animation-delay:300ms]"
          />
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
export const QualityIndicator = memo(function QualityIndicator({
  message,
  totalSources,
}: {
  message: ChatMessage;
  totalSources: number;
}) {
  const indicator = getConfidenceIndicator(message.qualityScore ?? 0);
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[0.65rem]">
      <span className={`font-medium ${indicator.color}`} aria-label={`Quality: ${indicator.label}`}>
        <span aria-hidden="true">{indicator.emoji}</span> {indicator.label}
      </span>
      <span className="text-foreground/40">·</span>
      <span
        className="text-foreground/50"
        title={`Response quality score: ${message.qualityScore}/100`}
      >
        {message.qualityScore}/100
      </span>
      {message.citationHealth && totalSources > 0 && (
        <>
          <span className="text-foreground/40">·</span>
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
