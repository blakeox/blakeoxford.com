import type { ReactNode, RefObject } from 'react';

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
      className="ai-chat-overlay pointer-events-none fixed inset-0 z-chat"
      style={{
        zIndex: 'var(--z-chat)',
        display: isOpen ? 'block' : 'none',
        visibility: isOpen ? 'visible' : 'hidden',
      }}
    >
      <button
        type="button"
        className="pointer-events-auto absolute inset-0 cursor-pointer bg-background-dark/30 backdrop-blur-[1px] sm:hidden"
        aria-label="Close assistant"
        tabIndex={-1}
        onClick={onClose}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center sm:inset-auto sm:bottom-[5.5rem] sm:right-6 sm:justify-end">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={labelledBy}
          data-panel
          data-ai-chat-panel
          data-ai-visible={isOpen ? 'true' : 'false'}
          className={`ai-chat-panel pointer-events-auto flex w-full flex-col overflow-hidden border border-border/50 bg-surface/92 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.28)] backdrop-blur-2xl ${
            isOpen ? 'opacity-100' : 'opacity-0'
          } max-h-[min(82dvh,40rem)] rounded-t-[1.25rem] sm:max-h-[min(72dvh,36rem)] sm:w-[min(100vw-3rem,26rem)] sm:rounded-[1.25rem]`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-border/70 sm:hidden"
            aria-hidden="true"
          />
          {children}
        </div>
      </div>
    </div>
  );
}
