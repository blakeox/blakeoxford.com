/**
 * Chat feature hooks — orchestration for the Ask companion.
 *
 * Prefer importing from `@/features/chat/hooks` (or the feature barrel).
 * Shared DOM utilities remain under `@/lib/hooks`.
 */

// ─── Main Controller ──────────────────────────────────────────────
export { useAIChatController } from './useAIChatController';

// ─── Consolidated surfaces ────────────────────────────────────────
export { useChatStreaming } from './useChatStreaming';
export type { UseChatStreamingOptions, UseChatStreamingReturn } from './useChatStreaming';
export { useChatPersistence } from './useChatPersistence';
export type { UseChatPersistenceOptions, UseChatPersistenceReturn } from './useChatPersistence';
export { useChatInteraction } from './useChatInteraction';
export type { UseChatInteractionOptions, UseChatInteractionReturn } from './useChatInteraction';
export { useChatSession } from './useChatSession';
export type { UseChatSessionOptions, UseChatSessionReturn } from './useChatSession';
