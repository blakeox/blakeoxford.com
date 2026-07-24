/**
 * Chat feature hooks — orchestration for the Ask companion.
 *
 * Public surface: `useAIChatController` only.
 * Composed helpers (`useChatInteraction`, `useChatPersistence`,
 * `useChatStreaming`, `useChatSession`) and `./internal/*` leaves are
 * implementation details — import them only from within this folder.
 *
 * Shared DOM utilities remain under `@/lib/hooks`.
 */

export { useAIChatController } from './useAIChatController';
