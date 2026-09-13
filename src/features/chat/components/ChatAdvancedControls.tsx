/**
 * ChatAdvancedControls — quiet session settings for Ask overlay.
 */
import type { ChatAdvancedControlsProps } from '@/features/chat/types';
import { SECTION_LABEL } from '@/features/overlay/overlayStyles';
import { getChipClasses } from '@/lib/design-system/recipes';

export function ChatAdvancedControls({
  showAdvancedControls,
  useMemory,
  showDigest,
  showAnalytics,
  messages,
  feedbackAnalytics,
  toggleMemory,
  toggleDigest,
  toggleAnalytics,
  clearConversation,
  handleExportConversation,
}: ChatAdvancedControlsProps) {
  if (!showAdvancedControls) return null;

  const chip = (active: boolean) =>
    getChipClasses({
      variant: 'quiet',
      size: 'xs',
      shape: 'pill',
      active,
      className: 'px-2.5 font-medium',
    });

  return (
    <div className="border-b border-border/40 px-3 py-2.5 sm:px-4">
      <p className={`${SECTION_LABEL} mb-2`}>Session</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={chip(useMemory)} onClick={toggleMemory}>
          {useMemory ? 'Memory on' : 'Memory off'}
        </button>
        <button type="button" className={chip(showDigest)} onClick={toggleDigest}>
          Digest
        </button>
        <button type="button" className={chip(showAnalytics)} onClick={toggleAnalytics}>
          Insights
        </button>
        <button
          type="button"
          className={chip(false)}
          onClick={clearConversation}
          disabled={messages.length === 0}
        >
          Clear
        </button>
        <button
          type="button"
          className={chip(false)}
          onClick={handleExportConversation}
          disabled={messages.length === 0}
        >
          Export
        </button>
      </div>
      {feedbackAnalytics.totalAssistant > 0 ? (
        <p className="mt-2 text-xxs text-subtle-foreground">
          {feedbackAnalytics.totalAssistant} replies
          {feedbackAnalytics.positiveRate !== null
            ? ` · ${feedbackAnalytics.positiveRate}% helpful`
            : ''}
        </p>
      ) : null}
    </div>
  );
}
