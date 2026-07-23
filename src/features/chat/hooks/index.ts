/**
 * Chat feature hooks — orchestration for the Ask companion.
 *
 * Prefer importing from `@/features/chat/hooks` (or the feature barrel).
 * Shared DOM utilities remain under `@/lib/hooks`.
 */

// ─── Main Controller ──────────────────────────────────────────────
export { useAIChatController } from './useAIChatController';

// ─── Consolidated surfaces ────────────────────────────────────────
export { useQueryManagement, useMessageProcessing } from './useChatStreaming';
export { useChatStorage, useChatLifecycle } from './useChatPersistence';

// ─── Supporting chat hooks ────────────────────────────────────────
export { useChatEffects } from './useChatEffects';
export { useMessageActions } from './useMessageActions';
export { useUIState } from './useUIState';
export { useInputHandlers } from './useInputHandlers';
export { useScrollManagement } from './useScrollManagement';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useComputedValues } from './useComputedValues';
export { useConversationAnalytics } from './useConversationAnalytics';
export { useConversationWebSocket } from './useConversationWebSocket';
export { useVoiceRecognition } from './useVoiceRecognition';
export { useCopyFeedback } from './useCopyFeedback';
export { useAiChatBridge } from './useAiChatBridge';
