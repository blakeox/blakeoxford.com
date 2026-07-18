/**
 * Hooks Module - Consolidated exports for React hooks
 *
 * This barrel file provides a single import point for all chat-related hooks,
 * eliminating deep imports and improving code organization.
 *
 * @example
 * ```ts
 * import {
 *   useAIChatController,
 *   useChatStorage,
 *   useVoiceRecognition
 * } from '@/lib/hooks';
 * ```
 */

// ─── Main Controller ──────────────────────────────────────────────
export { useAIChatController } from './useAIChatController';

// ─── Core Chat Hooks ──────────────────────────────────────────────
export { useChatEffects } from './useChatEffects';
export { useChatLifecycle } from './useChatLifecycle';
export { useChatStorage } from './useChatStorage';

// ─── Message Handling ─────────────────────────────────────────────
export { useMessageActions } from './useMessageActions';
export { useMessageProcessing } from './useMessageProcessing';
export { useQueryManagement } from './useQueryManagement';

// ─── UI State & Interactions ──────────────────────────────────────
export { useUIState } from './useUIState';
export { useInputHandlers } from './useInputHandlers';
export { useScrollManagement } from './useScrollManagement';
export { useTouchGestures } from './useTouchGestures';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';

// ─── Computed Values & Analytics ──────────────────────────────────
export { useComputedValues } from './useComputedValues';
export { useConversationAnalytics } from './useConversationAnalytics';

// ─── Real-time Features ───────────────────────────────────────────
export { useConversationWebSocket } from './useConversationWebSocket';
export { useVoiceRecognition } from './useVoiceRecognition';

// ─── Utilities ────────────────────────────────────────────────────
export { useCopyFeedback } from './useCopyFeedback';

// ─── DOM & Browser Utilities ──────────────────────────────────────
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  usePrefersReducedMotion,
  usePrefersDarkMode,
} from './useMediaQuery';
export { useOnClickOutside } from './useOnClickOutside';
export {
  useScrollPosition,
  useHasScrolled,
  type ScrollPosition,
  type ScrollDirection,
  type UseScrollPositionOptions,
} from './useScrollPosition';
export {
  useIntersectionObserver,
  useIsVisible,
  useLazyLoad,
  type UseIntersectionObserverOptions,
} from './useIntersectionObserver';
