/**
 * ChatMessageBubble — answer-first message UI.
 * Citations sit under the bubble; Workers AI answers skip fake citation chrome.
 */
import { memo } from 'react';
import { cleanAssistantResponse } from '@/lib/string-utils';
import { formatAISearchProvenance } from '@/lib/ai-search';
import { getMessageBubbleClasses } from '@/lib/design-system/recipes';
import { MessageSources } from './MessageSources';
import { MessageActions } from './MessageActions';
import { MatchedCTA } from './MessageCTAs';
import { TypingDots } from './TypingDots';
import type { ChatMessageBubbleProps } from '@/features/chat/types';

export const ChatMessageBubble = memo(function ChatMessageBubble({
  message,
  isStreaming,
  siteHostname,
  expandedSources: _expandedSources,
  expandedIndividualSources: _expandedIndividualSources,
  copiedMessageId,
  copiedShareUrl,
  messages,
  messagesRef: _messagesRef,
  sourceRefs,
  toggleExpandedSource: _toggleExpandedSource,
  toggleIndividualSource: _toggleIndividualSource,
  handleFeedback,
  handleCopyMessage,
  handleOpenPrimarySource,
  setInputValue: _setInputValue,
  sendQuery: _sendQuery,
  copyWithFeedback,
  isLatestAssistant = false,
}: ChatMessageBubbleProps) {
  const isAssistant = message.role === 'assistant';
  const bubbleContent = isAssistant ? cleanAssistantResponse(message.content) : message.content;
  const sources = isAssistant && message.sources ? message.sources : [];
  const totalSources = sources.length;
  const provenanceLabel =
    isAssistant && !isStreaming ? formatAISearchProvenance(message.provenance, totalSources) : null;
  const primarySource = sources[0] ?? null;
  const isHelpful = message.feedback === 'positive';
  const isNotHelpful = message.feedback === 'negative';
  const showCitations = isAssistant && !isStreaming && totalSources > 0;
  const provider = message.provenance?.provider ?? '';
  const isWorkersAi = provider === 'workers-ai';

  return (
    <div
      className={`flex flex-col gap-1.5 ${isAssistant ? 'items-start' : 'items-end'}`}
      data-ai-message-role={message.role}
    >
      <div className={getMessageBubbleClasses(isAssistant ? 'assistant' : 'user')}>
        {bubbleContent ? (
          <span
            className={`break-words whitespace-pre-wrap ${isAssistant ? 'leading-relaxed' : 'leading-snug'}`}
          >
            {bubbleContent}
          </span>
        ) : isAssistant && !isStreaming ? (
          <span className="text-muted-foreground">Thinking…</span>
        ) : null}
        {isAssistant && isStreaming ? <TypingDots className="mt-1" /> : null}
      </div>

      {showCitations && !isWorkersAi ? (
        <MessageSources
          sources={sources}
          messageId={message.id}
          siteHostname={siteHostname}
          sourceRefs={sourceRefs}
          onOpenSource={handleOpenPrimarySource}
        />
      ) : null}

      {provenanceLabel ? (
        <span className="max-w-[92%] px-1 text-xxs text-subtle-foreground" data-ai-provenance>
          {provenanceLabel}
        </span>
      ) : null}

      {isAssistant && isLatestAssistant && !isStreaming && showCitations && !isWorkersAi ? (
        <MatchedCTA message={message} messages={messages} sources={sources} compact />
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
