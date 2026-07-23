# Ask chat hooks

Public surface (import from `@/features/chat/hooks`):

- `useAIChatController`
- `useChatInteraction`
- `useChatPersistence`
- `useChatStreaming`
- `useChatSession`

Everything under `internal/` is private to those composed surfaces. Do not import leaf hooks from outside this folder.
