import { afterEach, describe, expect, it, vi } from 'vitest';
import { getChatFallbackSuggestions } from '@/lib/chat/fallback-search';
import { ConversationWebSocket } from '@/lib/chat/conversation-ws';
import { submitAIFeedback } from '@/services/AIFeedbackService';

describe('ConversationWebSocket readiness', () => {
  it('treats sends before connection as a quiet no-op', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const client = new ConversationWebSocket();

    expect(client.send({ type: 'typing', isTyping: true })).toBe(false);
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

describe('getChatFallbackSuggestions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns [] for blank queries without fetching', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(getChatFallbackSuggestions('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps and filters semantic hits by score floor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            { id: 'a', title: 'Alpha', url: '/a', description: 'one', score: 0.9 },
            { id: 'b', title: 'Beta', url: '/b', description: 'two', score: 0.4 },
            { id: 'c', title: 'Gamma', url: '/c', description: 'three', score: 0.7 },
          ],
        }),
      })
    );

    await expect(getChatFallbackSuggestions('cloud')).resolves.toEqual([
      { title: 'Alpha', url: '/a', excerpt: 'one', score: 0.9 },
      { title: 'Gamma', url: '/c', excerpt: 'three', score: 0.7 },
    ]);
  });

  it('returns [] when the upstream response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      })
    );
    await expect(getChatFallbackSuggestions('cloud')).resolves.toEqual([]);
  });
});

describe('submitAIFeedback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('posts keepalive feedback payloads', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await submitAIFeedback({
      messageId: 'msg-1',
      sentiment: 'positive',
      query: 'hello',
      metadata: { conversationLength: 2 },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai-feedback',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messageId: 'msg-1',
          sentiment: 'positive',
          query: 'hello',
          metadata: { conversationLength: 2 },
        }),
      })
    );
  });

  it('swallows network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(
      submitAIFeedback({ messageId: 'msg-1', sentiment: 'negative' })
    ).resolves.toBeNull();
  });
});
