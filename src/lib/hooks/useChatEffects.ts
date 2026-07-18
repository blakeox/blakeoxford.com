import { useEffect } from 'react';
import type { ChatMessage, ChatState, MutableRef } from '../chat';

/**
 * Options for the chat effects hook
 */
interface UseChatEffectsOptions {
  /** Whether the chat panel is open */
  isOpen: boolean;
  /** Current messages array */
  messages: ChatMessage[];
  /** Fallback search results */
  fallbackResults: any[];
  /** Current chat state */
  chatState: ChatState;
  /** Function to focus the input field */
  focusInput: () => void;
  /** Function to dispatch state changes */
  dispatchState: (isOpen: boolean) => void;
  /** Function to set fallback suggestions visibility */
  setShowFallbackSuggestions: (show: boolean) => void;
  /** Function to close the chat panel */
  closeChat: () => void;
  /** Reference to the launcher button */
  launcherRef: MutableRef<HTMLButtonElement | null>;
  /** Reference to messages for history building */
  messagesRef: MutableRef<ChatMessage[]>;
  /** Reference to active request controller */
  activeRequestRef: MutableRef<AbortController | null>;
  /** Reference to last query */
  lastQueryRef: MutableRef<string | null>;
}

/**
 * Return type for the chat effects hook
 */
interface UseChatEffectsReturn {
  /** Whether a retry is possible */
  canRetry: boolean;
  /** Last query value for display */
  lastQueryValue: string | null;
  /** Source references array */
  sourceRefs: MutableRef<HTMLAnchorElement[]>;
}

/**
 * Custom hook for chat lifecycle effects and computed values
 *
 * Manages side effects and derived state including:
 * - Auto-focus on chat open
 * - ARIA attributes management for launcher button
 * - State dispatching to parent/analytics
 * - Fallback suggestions visibility toggling
 * - Messages ref synchronization
 * - Request cleanup on unmount
 * - Source refs management
 * - Retry capability computation
 *
 * This hook consolidates all remaining useEffect calls and computed
 * values that were scattered in the main component.
 *
 * @param options - Configuration including state and refs
 * @returns Computed values and managed refs
 *
 * @example
 * ```tsx
 * const { canRetry, sourceRefs } = useChatEffects({
 *   isOpen,
 *   messages,
 *   fallbackResults,
 *   chatState,
 *   focusInput,
 *   dispatchState,
 *   setShowFallbackSuggestions,
 *   launcherRef,
 *   messagesRef,
 *   activeRequestRef,
 *   lastQueryRef,
 * });
 *
 * // Use in UI
 * {canRetry && <button onClick={handleRetry}>Retry</button>}
 * <a ref={el => el && sourceRefs.current.push(el)}>Source</a>
 * ```
 */
export function useChatEffects(options: UseChatEffectsOptions): UseChatEffectsReturn {
  const {
    isOpen,
    messages,
    fallbackResults,
    chatState,
    focusInput,
    dispatchState,
    setShowFallbackSuggestions,
    closeChat,
    launcherRef,
    messagesRef,
    activeRequestRef,
    lastQueryRef,
  } = options;

  // Auto-focus input when chat opens
  useEffect(() => {
    if (!isOpen) return;
    focusInput();
  }, [focusInput, isOpen]);

  // Handle Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeChat();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeChat, isOpen]);

  // Update ARIA expanded attribute on launcher button
  useEffect(() => {
    if (!launcherRef.current) return;
    launcherRef.current.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }, [isOpen, launcherRef]);

  // Dispatch state changes for analytics/parent components
  useEffect(() => {
    dispatchState(isOpen);
  }, [dispatchState, isOpen]);

  // Sync messages to ref for use in callbacks
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages, messagesRef]);

  // Hide fallback suggestions when new results arrive
  useEffect(() => {
    setShowFallbackSuggestions(false);
  }, [fallbackResults, setShowFallbackSuggestions]);

  // Cleanup: abort active requests on unmount
  useEffect(() => {
    return () => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
        activeRequestRef.current = null;
      }
    };
  }, [activeRequestRef]);

  // Source refs array - reset on each render
  const sourceRefs: MutableRef<HTMLAnchorElement[]> = { current: [] };

  // Compute retry capability
  const lastQueryValue = lastQueryRef.current;
  const canRetry = Boolean(lastQueryValue) && chatState !== 'loading';

  return {
    canRetry,
    lastQueryValue,
    sourceRefs,
  };
}
