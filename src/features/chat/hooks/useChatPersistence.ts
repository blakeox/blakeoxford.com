import type { RefObject } from 'react';
import type { ChatMessage, ChatState, MutableRef, SearchFallback } from '@/lib/chat';

import { useChatEffects } from './useChatEffects';
import { useChatLifecycle } from './useChatLifecycle';
import { useChatStorage } from './useChatStorage';

/**
 * Options for the composed chat persistence hook.
 * Combines storage, panel lifecycle, and remaining chat effects the
 * controller previously wired by hand.
 */
export interface UseChatPersistenceOptions {
  messages: ChatMessage[];
  useMemory: boolean;
  onMessagesRestored?: (messages: ChatMessage[]) => void;
  maxRestoreMessages?: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
  setChatState: (state: ChatState | ((prev: ChatState) => ChatState)) => void;
  isListening: boolean;
  toggleListening: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  lastFocusedElementRef: RefObject<HTMLElement | null>;
  fallbackResults: SearchFallback[];
  chatState: ChatState;
  setShowFallbackSuggestions: (show: boolean) => void;
  launcherRef: MutableRef<HTMLButtonElement | null>;
  messagesRef: MutableRef<ChatMessage[]>;
  activeRequestRef: MutableRef<AbortController | null>;
  lastQueryRef: MutableRef<string | null>;
  /** Optional shared source refs so interaction (keyboard) and effects share one array. */
  sourceRefs?: MutableRef<HTMLAnchorElement[]>;
}

/**
 * Return shape for chat persistence — everything the controller needs from
 * storage, lifecycle, and effects.
 */
export interface UseChatPersistenceReturn {
  openChat: () => void;
  closeChat: () => void;
  focusInput: () => void;
  canRetry: boolean;
  lastQueryValue: string | null;
  sourceRefs: MutableRef<HTMLAnchorElement[]>;
}

/**
 * Composes storage + panel lifecycle + chat effects into a single persistence surface.
 *
 * Internally wires lifecycle outputs (focusInput, dispatchState, closeChat) into
 * effects so the controller does not do that glue.
 */
export function useChatPersistence(options: UseChatPersistenceOptions): UseChatPersistenceReturn {
  const {
    messages,
    useMemory,
    onMessagesRestored,
    maxRestoreMessages = 30,
    isOpen,
    setIsOpen,
    setError,
    setChatState,
    isListening,
    toggleListening,
    inputRef,
    lastFocusedElementRef,
    fallbackResults,
    chatState,
    setShowFallbackSuggestions,
    launcherRef,
    messagesRef,
    activeRequestRef,
    lastQueryRef,
    sourceRefs: sourceRefsOption,
  } = options;

  useChatStorage({
    messages,
    useMemory,
    onMessagesRestored,
    maxRestoreMessages,
  });

  const { openChat, closeChat, focusInput, dispatchState } = useChatLifecycle({
    isOpen,
    setIsOpen,
    setError,
    setChatState,
    isListening,
    toggleListening,
    inputRef,
    lastFocusedElementRef,
  });

  const { canRetry, lastQueryValue, sourceRefs } = useChatEffects({
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
    sourceRefs: sourceRefsOption,
  });

  return {
    openChat,
    closeChat,
    focusInput,
    canRetry,
    lastQueryValue,
    sourceRefs,
  };
}
