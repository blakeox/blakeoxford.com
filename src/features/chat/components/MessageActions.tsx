/**
 * MessageActions — copy + feedback by default; share/source demoted.
 */
import { memo } from 'react';
import { autoragEvents } from '@/lib/analytics';
import type { ChatMessage, Source } from '@/features/chat/types';

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
  compact?: boolean;
}

const chip =
  'focus-ring-interactive inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 text-xxs text-muted-foreground transition hover:border-accent/40 hover:text-accent';

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
  compact = false,
}: MessageActionsProps) {
  const handleShare = () => {
    const messageIndex = messages.findIndex((m) => m.id === message.id);
    const userQuery = messageIndex > 0 ? messages[messageIndex - 1]?.content || '' : '';
    const shareUrl = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(userQuery)}&autosubmit=true`;

    if (navigator.share) {
      navigator
        .share({
          title: 'AI assistant answer',
          text: `Answer from Blake's assistant: "${userQuery}"`,
          url: shareUrl,
        })
        .then(() => autoragEvents.share('native'))
        .catch(() => {
          /* cancelled */
        });
    } else {
      void copyWithFeedback(shareUrl, message.id, 'share').then((success) => {
        if (success) autoragEvents.share('clipboard');
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" className={chip} onClick={() => handleCopyMessage(message)}>
        {copiedMessageId === message.id ? 'Copied' : 'Copy'}
      </button>

      {!compact && primarySource?.url ? (
        <button
          type="button"
          className={chip}
          onClick={() => handleOpenPrimarySource(primarySource.url)}
        >
          Source
        </button>
      ) : null}

      {!compact ? (
        <button type="button" className={chip} onClick={handleShare} title="Share this query">
          {copiedShareUrl === message.id ? 'Link copied' : 'Share'}
        </button>
      ) : null}

      <div className="ml-auto inline-flex items-center gap-1">
        <button
          type="button"
          className={`${chip} size-7 justify-center px-0 ${isHelpful ? 'border-accent/40 bg-accent-subtle text-accent' : ''}`}
          aria-label={isHelpful ? 'Marked helpful' : 'Mark answer helpful'}
          onClick={() => handleFeedback(message.id, 'positive')}
        >
          <svg
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 11v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm0 0 4.2-7.2A1.5 1.5 0 0 1 12.5 3H13a2 2 0 0 1 2 2v4h4.4a2 2 0 0 1 1.96 2.4l-1.1 6A2 2 0 0 1 18.3 19H9"
            />
          </svg>
        </button>
        <button
          type="button"
          className={`${chip} size-7 justify-center px-0 ${isNotHelpful ? 'border-accent/40 bg-accent-subtle text-accent' : ''}`}
          aria-label={isNotHelpful ? 'Marked not helpful' : 'Mark answer not helpful'}
          onClick={() => handleFeedback(message.id, 'negative')}
        >
          <svg
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 13V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3Zm0 0-4.2 7.2A1.5 1.5 0 0 1 11.5 21H11a2 2 0 0 1-2-2v-4H4.6a2 2 0 0 1-1.96-2.4l1.1-6A2 2 0 0 1 5.7 5H15"
            />
          </svg>
        </button>
      </div>
    </div>
  );
});
