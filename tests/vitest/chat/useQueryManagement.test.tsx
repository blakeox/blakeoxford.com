import { useRef, useState } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useQueryManagement } from '@/features/chat/hooks/internal/useQueryManagement';
import { searchWithAI } from '@/lib/ai-search';
import { AppError, ErrorCodes } from '@/utils/errors';
import type { ChatMessage, ChatState } from '@/lib/chat';

vi.mock('@/lib/ai-search', () => ({ searchWithAI: vi.fn() }));
vi.mock('@/lib/analytics', () => ({
  autoragEvents: { errorRetry: vi.fn(), error: vi.fn(), responseMeta: vi.fn() },
}));

function useHarness() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatState, setChatState] = useState<ChatState>('ready');
  const [retryCount, setRetryCount] = useState(0);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const hook = useQueryManagement({
    chatState,
    setChatState,
    setMessages,
    retryCount,
    setRetryCount,
    messagesRef,
    setLoadingPhase: vi.fn(),
    setError: vi.fn(),
    setFallbackResults: vi.fn(),
    setStreamingMessageId: vi.fn(),
    setLastFailedQuery: vi.fn(),
    useMemory: true,
    lastQueryRef: useRef<string | null>(null),
    activeRequestRef: useRef<AbortController | null>(null),
    scrollContainerRef: useRef<HTMLDivElement | null>(null),
    appendAssistantChunk: vi.fn(),
    assignAssistantSources: vi.fn(),
    assignAssistantProvenance: vi.fn(),
    finalizeAssistantMessage: vi.fn(async () => {}),
    buildHistoryForRequest: (entries) => entries.map(({ role, content }) => ({ role, content })),
    inputValue: '',
    setInputValue: vi.fn(),
    openChat: vi.fn(),
    focusInput: vi.fn(),
  });
  return { ...hook, messages, retryCount };
}
const timeout = () => new AppError('timeout', ErrorCodes.NETWORK_TIMEOUT, { isRetryable: true });

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(searchWithAI).mockReset();
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('Ask request retries', () => {
  it('stops after two retries and keeps one user question', async () => {
    vi.mocked(searchWithAI).mockRejectedValue(timeout());
    const { result } = renderHook(useHarness);
    await act(async () => {
      await result.current.sendQuery('What shipped?');
    });
    for (let i = 0; i < 6; i++)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
    expect(searchWithAI).toHaveBeenCalledTimes(3);
    expect(result.current.messages.filter((m) => m.role === 'user')).toHaveLength(1);
    expect(result.current.messages.filter((m) => m.role === 'assistant')).toHaveLength(0);
  });

  it('reuses the question on recovery without echoing it into history', async () => {
    vi.mocked(searchWithAI)
      .mockRejectedValueOnce(timeout())
      .mockResolvedValue({ message: 'Shipped automation.', sources: [] });
    const { result } = renderHook(useHarness);
    await act(async () => {
      await result.current.sendQuery('What shipped?');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(searchWithAI).toHaveBeenCalledTimes(2);
    expect(result.current.messages.filter((m) => m.role === 'user')).toHaveLength(1);
    expect(result.current.messages.filter((m) => m.role === 'assistant')).toHaveLength(1);
    expect(vi.mocked(searchWithAI).mock.calls[1][1]?.history).toEqual([]);
    expect(result.current.retryCount).toBe(0);
  });

  it('does not revive an old retry after a new submission of the same question', async () => {
    vi.mocked(searchWithAI)
      .mockRejectedValueOnce(timeout())
      .mockResolvedValue({ message: 'Done.', sources: [] });
    const { result } = renderHook(useHarness);
    await act(async () => {
      await result.current.sendQuery('What shipped?');
    });
    await act(async () => {
      await result.current.sendQuery('What shipped?');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(searchWithAI).toHaveBeenCalledTimes(2);
  });
});
