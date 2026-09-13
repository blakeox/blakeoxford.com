/**
 * ChatGuidedPrompts component
 * Displays guided prompt suggestions for new users
 */
import { memo } from 'react';
import { GUIDED_PROMPTS } from '@/lib/chat';
import type { ChatGuidedPromptsProps } from '@/features/chat/types';
import { CHAT_ACCENT_ICON_WELL } from '@/features/chat/chatStyles';
import { OVERLAY_SECTION_BAND, SECTION_LABEL } from '@/features/overlay/overlayStyles';
import { crossRendererSurfaceRecipe } from '@/lib/design-system/recipes';
import { cn } from '@/utils/cn';

export const ChatGuidedPrompts = memo(function ChatGuidedPrompts({
  visible,
  onSelectPrompt,
}: ChatGuidedPromptsProps) {
  if (!visible) return null;

  return (
    <div className={OVERLAY_SECTION_BAND}>
      <div className="flex flex-col gap-0.5">
        <span className={SECTION_LABEL}>Jump in</span>
        <span className="text-muted-foreground">
          Choose a suggested prompt to get a rich, sourced answer.
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {GUIDED_PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            className={cn(
              'group flex h-full flex-col items-start gap-2 px-3 py-3 text-left',
              crossRendererSurfaceRecipe.interactive
            )}
            onClick={() => onSelectPrompt(prompt.prompt)}
            title={prompt.prompt}
          >
            <span className={CHAT_ACCENT_ICON_WELL}>{prompt.icon}</span>
            <span className="text-sm font-semibold text-foreground group-hover:text-accent-emphasis">
              {prompt.label}
            </span>
            <span className="text-xxs text-muted-foreground">{prompt.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

ChatGuidedPrompts.displayName = 'ChatGuidedPrompts';
