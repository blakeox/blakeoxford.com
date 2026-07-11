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
 * Corner companion panel for Ask — stays over the page instead of owning a modal surface.
 * Mobile: bottom sheet with a light scrim. Desktop: docked above the FAB, page remains readable.
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
      className={`ai-chat-overlay fixed inset-0 z-chat ${
        isOpen ? 'pointer-events-none' : 'pointer-events-none'
      }`}
      style={{
        zIndex: 'var(--z-chat)',
        display: isOpen ? 'block' : 'none',
        visibility: isOpen ? 'visible' : 'hidden',
      }}
    >
      {/* Mobile-only soft scrim — desktop leaves the page fully interactive around the dock */}
      <button
        type="button"
        className="pointer-events-auto absolute inset-0 cursor-pointer bg-background-dark/40 backdrop-blur-[2px] sm:hidden"
        aria-label="Close assistant"
        tabIndex={-1}
        onClick={onClose}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end p-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:p-0">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={labelledBy}
          data-panel
          data-ai-chat-panel
          data-ai-visible={isOpen ? 'true' : 'false'}
          className={`ai-chat-panel pointer-events-auto flex w-full flex-col overflow-hidden border border-border/60 bg-surface/95 shadow-xl backdrop-blur-xl motion-safe:transition-[transform,opacity] motion-safe:duration-normal motion-safe:ease-standard motion-reduce:transition-none ${
            isOpen
              ? 'translate-y-0 opacity-100'
              : 'translate-y-3 opacity-0 sm:translate-y-2'
          } max-h-[min(78dvh,36rem)] rounded-t-2xl sm:h-[min(70dvh,34rem)] sm:max-h-[34rem] sm:w-[min(100vw-2.5rem,24rem)] sm:rounded-2xl`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border/60 sm:hidden"
            aria-hidden="true"
          />
          {children}
        </div>
      </div>
    </div>
  );
}
