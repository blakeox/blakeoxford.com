/**
 * Shared React hooks (DOM / browser utilities).
 *
 * Chat orchestration hooks live under `@/features/chat/hooks`.
 * This barrel re-exports them for backward compatibility.
 *
 * @example
 * ```ts
 * import { useMediaQuery, useOverlayScrollLock } from '@/lib/hooks';
 * import { useAIChatController } from '@/features/chat/hooks';
 * ```
 */

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
export { useOverlayScrollLock } from './useOverlayScrollLock';
export { useTouchGestures } from './useTouchGestures';

// ─── Chat hooks (compat re-exports) ───────────────────────────────
export {
  useAIChatController,
  useChatEffects,
  useChatLifecycle,
  useChatStorage,
  useMessageActions,
  useMessageProcessing,
  useQueryManagement,
  useUIState,
  useInputHandlers,
  useScrollManagement,
  useKeyboardShortcuts,
  useComputedValues,
  useConversationAnalytics,
  useConversationWebSocket,
  useVoiceRecognition,
  useCopyFeedback,
  useAiChatBridge,
} from '@/features/chat/hooks';
