/**
 * ChatHeader — Ask companion chrome with page context + New chat.
 */
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import {
  OVERLAY_ICON_BUTTON,
  OVERLAY_MENU_ITEM,
  OVERLAY_MENU_PANEL,
} from '@/features/overlay/overlayStyles';
import { CHAT_ACCENT_CHIP, CHAT_TOGGLE_ACTIVE } from '@/features/chat/chatStyles';
import { disabledControlClasses, STATUS_DOT, STATUS_PULSE_DOT } from '@/lib/design-system/recipes';
import { cn } from '@/utils/cn';
import type { ChatHeaderProps } from '@/features/chat/types';

function MenuButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(OVERLAY_MENU_ITEM, disabledControlClasses)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type MenuPosition = {
  top: number;
  right: number;
  maxHeight: number;
};

export const ChatHeader = memo(function ChatHeader({
  isOpen,
  pageLabel = 'Site assistant',
  wsConnected,
  activeUsers,
  voiceSupported,
  isListening,
  showAdvancedControls,
  useMemory,
  canStartNewChat,
  hasMessages,
  toggleVoiceInput,
  toggleAdvancedControls,
  toggleMemory,
  clearConversation,
  handleExportConversation,
  startNewChat,
  closeChat,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => {
    // Exclude closing commands before the outer dialog handles the same Tab.
    menuRef.current?.setAttribute('inert', '');
    setMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  const syncMenuPosition = useCallback(() => {
    const toggle = toggleRef.current;
    if (!toggle) return;
    const rect = toggle.getBoundingClientRect();
    // Keep menu semantics and focus inside the dialog, accounting for the
    // glass panel's containing block and the space available below the trigger.
    const panel = toggle.closest<HTMLElement>('[data-ai-chat-panel]');
    if (!panel) return;
    const bounds = panel.getBoundingClientRect();
    const topEdge = bounds.top + panel.clientTop;
    const rightEdge = bounds.right - panel.clientLeft;
    const bottomEdge = bounds.bottom - panel.clientTop;
    setMenuPosition({
      top: rect.bottom - topEdge + 6,
      right: Math.max(8, rightEdge - rect.right),
      maxHeight: Math.max(0, bottomEdge - rect.bottom - 14),
    });
  }, []);

  useEffect(() => {
    if (!isOpen || !menuOpen) {
      setMenuOpen(false);
      setMenuPosition(null);
      return;
    }

    syncMenuPosition();
    const onResize = () => syncMenuPosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    const panel = toggleRef.current?.closest('[data-ai-chat-panel]');
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    if (panel) observer?.observe(panel);

    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    };
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !toggleRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', onEscape, true);
    document.addEventListener('click', onDocClick, true);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      document.removeEventListener('keydown', onEscape, true);
      document.removeEventListener('click', onDocClick, true);
    };
  }, [isOpen, menuOpen, syncMenuPosition, closeMenu]);

  const menuReady = isOpen && menuOpen && menuPosition !== null;
  useEffect(() => {
    if (menuReady)
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus();
  }, [menuReady]);

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      // Resume the dialog's Tab sequence from the disclosure button.
      closeMenu();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')
    );
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  };

  const menuPanel =
    menuReady && menuPosition ? (
      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label="Assistant options"
        onKeyDownCapture={handleMenuKeyDown}
        className={OVERLAY_MENU_PANEL}
        style={{ ...menuPosition, position: 'absolute', overflowY: 'auto' }}
      >
        {voiceSupported ? (
          <MenuButton
            onClick={() => {
              toggleVoiceInput();
              closeMenu();
            }}
          >
            {isListening ? 'Stop voice input' : 'Voice input'}
          </MenuButton>
        ) : null}
        <MenuButton onClick={() => toggleMemory()}>
          {useMemory ? 'Memory on' : 'Memory off'}
        </MenuButton>
        <MenuButton onClick={() => toggleAdvancedControls()}>
          {showAdvancedControls ? 'Hide session settings' : 'Session settings'}
        </MenuButton>
        <MenuButton
          disabled={!hasMessages}
          onClick={() => {
            handleExportConversation();
            closeMenu();
          }}
        >
          Export chat
        </MenuButton>
        <MenuButton
          disabled={!hasMessages}
          onClick={() => {
            clearConversation();
            closeMenu();
          }}
        >
          Clear chat
        </MenuButton>
      </div>
    ) : null;

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border/40 px-3.5 py-2.5 sm:px-4 sm:py-3">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p
            id="ai-chat-heading"
            className="shrink-0 text-sm font-semibold tracking-tight text-foreground"
          >
            Ask
          </p>
          {isListening ? (
            <span className={CHAT_ACCENT_CHIP}>
              <span className={STATUS_PULSE_DOT} aria-hidden="true" />
              Listening
            </span>
          ) : (
            <span
              className="inline-flex min-w-0 items-center gap-1.5 truncate text-xxs text-muted-foreground"
              title={pageLabel}
            >
              <span className={STATUS_DOT} aria-hidden="true" />
              <span className="truncate">
                <span className="text-subtle-foreground">Viewing</span>{' '}
                <span className="font-medium text-foreground">{pageLabel}</span>
              </span>
            </span>
          )}
        </div>
        <span className="sr-only">{wsConnected ? 'Live connection' : 'Offline'}</span>
        {activeUsers > 1 ? <span className="sr-only">{activeUsers} online</span> : null}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {canStartNewChat ? (
          <button
            type="button"
            className={OVERLAY_ICON_BUTTON}
            aria-label="Start new chat"
            title="New chat"
            onClick={startNewChat}
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
        ) : null}

        <button
          ref={toggleRef}
          type="button"
          className={cn(
            OVERLAY_ICON_BUTTON,
            (menuOpen || showAdvancedControls) && CHAT_TOGGLE_ACTIVE
          )}
          aria-label="Assistant options"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-controls={menuReady ? menuId : undefined}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h.01M12 12h.01M18 12h.01" />
          </svg>
        </button>

        {menuPanel}

        <button
          type="button"
          className={OVERLAY_ICON_BUTTON}
          aria-label="Close Ask"
          onClick={closeChat}
        >
          <svg
            className="size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 6l12 12M6 18L18 6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader';
