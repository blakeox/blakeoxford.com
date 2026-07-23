import type { ReactNode, RefObject } from 'react';

import { cn } from '@/utils/cn';
import {
  CHAT_DOCK_BACKDROP,
  CHAT_DOCK_DRAG_HANDLE,
  CHAT_DOCK_FRAME,
  CHAT_DOCK_PANEL,
  CHAT_DOCK_ROOT,
} from './chatStyles';

type ChatDockProps = {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  panelRef?: RefObject<HTMLDivElement | null>;
  onTouchStart?: (event: React.TouchEvent) => void;
  onTouchMove?: (event: React.TouchEvent) => void;
  onTouchEnd?: (event: React.TouchEvent) => void;
};

/**
 * Corner companion for Ask.
 * Visual thesis: calm glass dock rising from the FAB — presence without taking the page.
 * Visibility uses Tailwind display utilities (`block`/`hidden`), same contract as OverlayShell.
 */
export function ChatDock({
  isOpen,
  onClose,
  labelledBy,
  children,
  panelRef,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: ChatDockProps) {
  return (
    <div
      role="presentation"
      aria-hidden={!isOpen}
      inert={!isOpen}
      data-ai-chat-overlay
      data-state={isOpen ? 'open' : 'closed'}
      className={cn(CHAT_DOCK_ROOT, isOpen ? 'block' : 'hidden')}
    >
      <button
        type="button"
        className={CHAT_DOCK_BACKDROP}
        aria-label="Close assistant"
        tabIndex={-1}
        onClick={onClose}
        data-a11y-allow-color-contrast=""
      />

      <div className={CHAT_DOCK_FRAME}>
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={labelledBy}
          data-panel
          data-ai-chat-panel
          data-ai-visible={isOpen ? 'true' : 'false'}
          className={cn(CHAT_DOCK_PANEL, isOpen ? 'opacity-100' : 'opacity-0')}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className={CHAT_DOCK_DRAG_HANDLE} aria-hidden="true" />
          {children}
        </div>
      </div>
    </div>
  );
}
