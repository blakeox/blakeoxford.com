# Ask chat hooks

Public surface (import from `@/features/chat/hooks` or `@/features/chat`):

- `useAIChatController`

Composed surfaces (`useChatInteraction`, `useChatPersistence`, `useChatStreaming`,
`useChatSession`) live beside this barrel for the controller only — do not import
them from outside `hooks/`. Leaf implementations are under `internal/`.
