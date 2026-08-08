import { describe, expect, it } from 'vitest';
import { ConversationDurableObject } from '../../../functions/ConversationDO';
import { handleConversation } from '../../../functions/routes/conversation';

function conversationRequest(
  origin: string,
  path = '/api/conversation/default/message',
  init?: RequestInit
): Request {
  const headers = new Headers(init?.headers);
  headers.set('origin', origin);
  const body = typeof init?.body === 'string' ? init.body : '{}';
  return {
    headers,
    method: init?.method || 'GET',
    url: `https://blakeoxford.com${path}`,
    json: async () => JSON.parse(body),
  } as unknown as Request;
}

function durableObjectState(): DurableObjectState {
  const alarms: number[] = [];
  return {
    storage: {
      get: async () => undefined,
      put: async () => undefined,
      setAlarm: async (timestamp: number) => {
        alarms.push(timestamp);
      },
    },
    blockConcurrencyWhile: (callback) => {
      void callback();
    },
    alarms,
  } as unknown as DurableObjectState;
}

describe('conversation route hardening', () => {
  it('fails closed while persistence has no authenticated capability contract', async () => {
    const response = await handleConversation({
      request: conversationRequest('https://blakeoxford.com'),
      env: {} as any,
      url: new URL('https://blakeoxford.com/api/conversation/default/state'),
    } as any);

    expect(response?.status).toBe(410);
  });

  it('rejects arbitrary origins before reaching the Durable Object', async () => {
    const response = await handleConversation({
      request: conversationRequest('https://evil.example'),
      env: {} as any,
      url: new URL('https://blakeoxford.com/api/conversation/default/message'),
    } as any);

    expect(response?.status).toBe(403);
    expect(response?.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('does not reflect arbitrary origins when the Durable Object is unavailable', async () => {
    const response = await handleConversation({
      request: conversationRequest('https://blakeoxford.com'),
      env: {
        CONVERSATION_PERSISTENCE_ENABLED: 'true',
        CONVERSATION_DO: {
          idFromName: () => {
            throw new Error('unavailable');
          },
        },
      } as any,
      url: new URL('https://blakeoxford.com/api/conversation/default/message'),
    } as any);

    expect(response?.status).toBe(503);
    expect(response?.headers.get('access-control-allow-origin')).toBe('https://blakeoxford.com');
  });

  it('uses the exact allowlist for Durable Object fallback endpoints', async () => {
    const object = new ConversationDurableObject(durableObjectState(), {
      CONVERSATION_PERSISTENCE_ENABLED: 'true',
    } as any);
    const allowed = await object.fetch(
      conversationRequest('https://www.blakeoxford.com', undefined, { method: 'OPTIONS' })
    );
    const blocked = await object.fetch(
      conversationRequest('https://evil.example', undefined, { method: 'OPTIONS' })
    );

    expect(allowed.status).toBe(204);
    expect(allowed.headers.get('access-control-allow-origin')).toBe('https://www.blakeoxford.com');
    expect(blocked.status).toBe(403);
    expect(blocked.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('rejects oversized Durable Object fallback requests', async () => {
    const object = new ConversationDurableObject(durableObjectState(), {
      CONVERSATION_PERSISTENCE_ENABLED: 'true',
    } as any);
    const response = await object.fetch(
      conversationRequest('https://blakeoxford.com', undefined, {
        method: 'POST',
        headers: { 'content-length': String(32 * 1024 + 1) },
        body: '{}',
      })
    );

    expect(response.status).toBe(413);
  });

  it('schedules cleanup when a Durable Object is constructed', async () => {
    const state = durableObjectState();
    new ConversationDurableObject(state, {
      CONVERSATION_PERSISTENCE_ENABLED: 'true',
    } as any);

    await Promise.resolve();
    expect((state as any).alarms).toHaveLength(1);
  });
});
