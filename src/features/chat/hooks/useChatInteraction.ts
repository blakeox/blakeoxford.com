import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { ChatMessage, ChatState, MutableRef } from '@/lib/chat';
import { useTouchGestures } from '@/lib/hooks/useTouchGestures';

import { useAiChatBridge } from './useAiChatBridge';
import { useCopyFeedback } from './useCopyFeedback';
import { useInputHandlers } from './useInputHandlers';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useScrollManagement } from './useScrollManagement';
import { useUIState } from './useUIState';
import { useVoiceRecognition } from './useVoiceRecognition';

/**
 * Options for the composed chat interaction hook.
 *
 * Lifecycle/streaming callbacks (`openChat`, `closeChat`, `focusInput`, `sendQuery`,
 * `sourceRefs`) may be deferred wrappers when this hook runs before persistence
 * and streaming. Pass stable `() => ref.current()` wrappers so effects see the
 * real implementations after the rest of the controller finishes the render.
 */
export interface UseChatInteractionOptions {
  isOpen: boolean;
  messages: ChatMessage[];
  chatState: ChatState;
  setUseMemory: Dispatch<SetStateAction<boolean>>;
  setInputValue: Dispatch<SetStateAction<string>>;
  panelRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  openChat: () => void;
  closeChat: () => void;
  focusInput: () => void;
  sourceRefs: MutableRef<HTMLAnchorElement[]>;
  sendQuery: (query: string) => Promise<void>;
}

/**
 * Return shape for chat interaction — voice, UI, scroll, copy, input, and touch.
 */
export interface UseChatInteractionReturn {
  voiceSupported: boolean;
  isListening: boolean;
  interimTranscript: string;
  toggleListening: () => void;
  showDigest: boolean;
  showAnalytics: boolean;
  showAdvancedControls: boolean;
  showFallbackSuggestions: boolean;
  composerFocused: boolean;
  showScrollToLatest: boolean;
  expandedSources: Record<string, boolean>;
  expandedIndividualSources: Record<string, boolean>;
  toggleDigest: () => void;
  toggleAnalytics: () => void;
  toggleAdvancedControls: () => void;
  setShowFallbackSuggestions: (show: boolean) => void;
  setComposerFocused: (focused: boolean) => void;
  setShowScrollToLatest: (show: boolean) => void;
  toggleExpandedSource: (messageId: string) => void;
  toggleIndividualSource: (sourceKey: string) => void;
  setExpandedSources: Dispatch<SetStateAction<Record<string, boolean>>>;
  scrollToLatest: () => void;
  copiedMessageId: string | null;
  copiedShareUrl: string | null;
  copyWithFeedback: (content: string, id: string, type: 'message' | 'share') => Promise<boolean>;
  toggleMemory: () => void;
  toggleVoiceInput: () => void;
  handleTextareaKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  touchStartY: number | null;
  touchCurrentY: number | null;
  handleTouchStart: (event: React.TouchEvent) => void;
  handleTouchMove: (event: React.TouchEvent) => void;
  handleTouchEnd: () => void;
}

/**
 * Composes voice + UI state + scroll + keyboard + copy + input + touch + bridge.
 *
 * Call before persistence when the controller uses deferred lifecycle wrappers,
 * so voice and UI toggles are available to persistence and streaming.
 */
export function useChatInteraction(options: UseChatInteractionOptions): UseChatInteractionReturn {
  const {
    isOpen,
    messages,
    chatState,
    setUseMemory,
    setInputValue,
    panelRef,
    scrollContainerRef,
    openChat,
    closeChat,
    focusInput,
    sourceRefs,
    sendQuery,
  } = options;

  const { voiceSupported, isListening, interimTranscript, toggleListening } = useVoiceRecognition({
    onTranscript: (transcript) => {
      setInputValue((prev) => {
        const existing = prev.trim();
        const combined = existing ? `${existing} ${transcript}` : transcript;
        return combined.trim();
      });
    },
    language: 'en-US',
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
  });

  const {
    showDigest,
    showAnalytics,
    showAdvancedControls,
    showFallbackSuggestions,
    composerFocused,
    showScrollToLatest,
    expandedSources,
    expandedIndividualSources,
    toggleDigest,
    toggleAnalytics,
    toggleAdvancedControls,
    setShowFallbackSuggestions,
    setComposerFocused,
    setShowScrollToLatest,
    toggleExpandedSource,
    toggleIndividualSource,
    setExpandedSources,
  } = useUIState();

  const { touchStartY, touchCurrentY, handleTouchStart, handleTouchMove, handleTouchEnd } =
    useTouchGestures({
      onSwipeDown: closeChat,
      swipeThreshold: 100,
      enabled: isOpen,
    });

  useKeyboardShortcuts({
    enabled: isOpen,
    onClose: closeChat,
    panelRef,
    sourceRefs,
  });

  const { scrollToLatest } = useScrollManagement({
    containerRef: scrollContainerRef,
    enabled: isOpen,
    scrollTrigger: messages,
    showScrollButton: showScrollToLatest,
    onScrollButtonChange: setShowScrollToLatest,
    scrollThreshold: 48,
  });

  const { copiedMessageId, copiedShareUrl, copyWithFeedback } = useCopyFeedback({
    resetDelay: 2000,
  });

  const { toggleMemory, toggleVoiceInput, handleTextareaKeyDown } = useInputHandlers({
    chatState,
    voiceSupported,
    setUseMemory,
    openChat,
    toggleListening,
  });

  useAiChatBridge({
    openChat,
    closeChat,
    setInputValue,
    sendQuery,
    focusInput,
  });

  return {
    voiceSupported,
    isListening,
    interimTranscript,
    toggleListening,
    showDigest,
    showAnalytics,
    showAdvancedControls,
    showFallbackSuggestions,
    composerFocused,
    showScrollToLatest,
    expandedSources,
    expandedIndividualSources,
    toggleDigest,
    toggleAnalytics,
    toggleAdvancedControls,
    setShowFallbackSuggestions,
    setComposerFocused,
    setShowScrollToLatest,
    toggleExpandedSource,
    toggleIndividualSource,
    setExpandedSources,
    scrollToLatest,
    copiedMessageId,
    copiedShareUrl,
    copyWithFeedback,
    toggleMemory,
    toggleVoiceInput,
    handleTextareaKeyDown,
    touchStartY,
    touchCurrentY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
