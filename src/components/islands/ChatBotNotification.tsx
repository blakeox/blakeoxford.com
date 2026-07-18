/**
 * Chat Bot Notification - Popup to inform users about the AI chat assistant
 * Shows a friendly notification pointing to the chat bot in the bottom right
 */

import { useCallback, useEffect, useState } from 'react';
import { logger } from '../../utils/logger';

const STORAGE_KEY = 'chat-bot-notification-dismissed';
const SHOW_DELAY = 3000; // Show after 3 seconds
const AUTO_HIDE_DELAY = 8000; // Auto-hide after 8 seconds

export default function ChatBotNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setIsDismissed(true);

    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (error) {
      logger.debug('Failed to save notification dismissal state:', error);
    }
  }, []);

  useEffect(() => {
    // Check if user has already dismissed the notification
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed === 'true') {
        setIsDismissed(true);
        return;
      }
    } catch (error) {
      logger.debug('Failed to read notification dismissal state:', error);
    }

    // Check if chat is already open
    const checkChatOpen = () => {
      const chatWrapper = document.querySelector('[data-ai-chat-open="true"]');
      return chatWrapper !== null;
    };

    // Don't show if chat is already open
    if (checkChatOpen()) {
      return;
    }

    // Show notification after delay
    const showTimer = setTimeout(() => {
      // Double-check chat isn't open before showing
      if (!checkChatOpen()) {
        setIsVisible(true);
      }
    }, SHOW_DELAY);

    // Auto-hide after delay
    const hideTimer = setTimeout(() => {
      handleDismiss();
    }, SHOW_DELAY + AUTO_HIDE_DELAY);

    // Listen for chat open events to hide notification
    const observer = new MutationObserver(() => {
      if (checkChatOpen() && isVisible) {
        handleDismiss();
      }
    });

    const chatWidget = document.querySelector('[data-ai-chat-widget]');
    if (chatWidget) {
      observer.observe(chatWidget, {
        attributes: true,
        attributeFilter: ['data-ai-chat-open'],
        subtree: true,
      });
    }

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      observer.disconnect();
    };
  }, [isVisible, handleDismiss]);

  const handleClickChat = () => {
    // Find and click the chat launcher button
    const launcher = document.querySelector('.ai-chat-launcher') as HTMLButtonElement;
    if (launcher) {
      launcher.click();
      handleDismiss();
    }
  };

  if (isDismissed || !isVisible) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed right-4 bottom-24 z-[1060] animate-slide-up sm:right-6 sm:bottom-28"
    >
      <div className="relative max-w-xs rounded-lg bg-surface p-4 shadow-lg ring-1 ring-border/30">
        {/* Arrow pointing to chat bot */}
        <div className="absolute right-6 -bottom-2 h-4 w-4 rotate-45 bg-surface" />

        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className="absolute top-2 right-2 rounded p-1 text-subtle-foreground transition-colors hover:bg-surface-subtle hover:text-muted-foreground"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="pr-6">
          <div className="mb-2 flex items-start gap-2">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-accent-emphasis"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Try the AI Assistant!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask me anything about my work, projects, or experience. I'm in the bottom right
                corner.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClickChat}
            className="mt-3 w-full rounded-md bg-button-primary-bg px-3 py-2 text-sm font-medium text-button-primary-fg transition-colors hover:bg-button-primary-bg-hover focus:ring-2 focus:ring-accent/60 focus:ring-offset-2 focus:ring-offset-background focus:outline-none"
          >
            Open Chat
          </button>
        </div>
      </div>
    </div>
  );
}
