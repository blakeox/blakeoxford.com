/**
 * ChatAdvancedControls — quiet session settings for Ask overlay.
 */
import type { ChatAdvancedControlsProps } from './types';
import { SECTION_LABEL } from '../../../features/overlay/overlayStyles';

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
    `focus-ring-interactive inline-flex items-center rounded-full border px-2.5 py-1 text-xxs font-medium transition ${
      active
        ? 'border-accent/40 bg-accent-subtle text-accent'
        : 'border-border/50 text-muted-foreground hover:border-accent/50 hover:text-accent'
    }`;

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
