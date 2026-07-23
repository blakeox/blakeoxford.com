/**
 * Chat feature hooks — orchestration for the Ask companion.
 *
 * Public surface (only these five):
 *   useAIChatController, useChatInteraction, useChatPersistence,
 *   useChatStreaming, useChatSession
 *
 * Leaf implementations live under `./internal/` and are not part of the
 * supported import surface. Prefer `@/features/chat/hooks`.
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
