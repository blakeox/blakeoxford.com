import { describe, expect, it } from 'vitest';
import {
  captureException,
  CloudflareClient,
  requestDataIntegration,
  withSentry,
} from '@sentry/cloudflare';
import { createSentrySampler } from '../../src/lib/sentry-options';
import { getEdgeSentryOptions } from '../../sentry.edge.config.js';

describe('Sentry 11 privacy and sampling', () => {
  it('delivers an error through the Worker wrapper without private request data', async () => {
    const envelopes: unknown[] = [];
    const pending: Promise<unknown>[] = [];
    const worker = withSentry(
      () => ({
        ...getEdgeSentryOptions({ SENTRY_DSN_EDGE: 'https://public@example.test/1' }),
        cacheClient: false,
        transport: () => ({
          send: async (envelope: unknown) => {
            envelopes.push(envelope);
            return { statusCode: 200 };
          },
          flush: async () => true,
        }),
      }),
      {
        async fetch() {
          captureException(new Error('fixture diagnostic'));
          return new Response(null, { status: 204 });
        },
      }
    );
    const response = await worker.fetch(
      new Request('https://example.test/contact?email=private-query', {
        method: 'POST',
        headers: { cookie: 'session=private-cookie', authorization: 'Bearer private-token' },
        body: 'private-body',
      }),
      {},
      {
        waitUntil: (promise: Promise<unknown>) => pending.push(promise),
        passThroughOnException() {},
      }
    );
    await Promise.all(pending);
    expect(response.status).toBe(204);
    const payload = JSON.stringify(envelopes);
    expect(payload).toContain('fixture diagnostic');
    for (const secret of ['private-query', 'private-cookie', 'private-token', 'private-body']) {
      expect(payload).not.toContain(secret);
    }
  });

  it('filters request identifiers through the real SDK request processor', async () => {
    const client = new CloudflareClient({
      ...getEdgeSentryOptions({}),
      integrations: [],
      transport: () => ({ send: async () => ({}), flush: async () => true }),
    });
    const event = await requestDataIntegration().processEvent!(
      {
        message: 'diagnostic error',
        sdkProcessingMetadata: {
          normalizedRequest: {
            url: 'https://example.test/contact?email=private-query',
            method: 'POST',
            headers: {
              cookie: 'session=private-cookie',
              authorization: 'Bearer private-authorization',
              'cf-connecting-ip': '192.0.2.1',
            },
            cookies: { session: 'private-cookie' },
          },
          ipAddress: '192.0.2.1',
        },
      },
      {},
      client
    );
    expect(event?.message).toBe('diagnostic error');
    expect(event?.request?.method).toBe('POST');
    expect(event?.request?.url).toBe('https://example.test/contact');
    expect(event?.request?.headers).toBeUndefined();
    expect(event?.request?.cookies).toBeUndefined();
    expect(event?.user?.ip_address).toBeUndefined();
    const collection = client.getDataCollectionOptions();
    expect(collection.httpBodies).toEqual([]);
    expect(collection.genAI).toEqual({ inputs: false, outputs: false });
    expect(collection.databaseQueryData).toBe(false);
    expect(collection.queues).toBe(false);
    expect(collection.graphQL).toEqual({ document: false, variables: false });
    await client.close();
  });

  it.each(['Googlebot', 'HeadlessChrome', 'Lighthouse', 'UptimeRobot'])(
    'drops %s before tracing starts, even with a sampled parent',
    (userAgent) => {
      expect(
        createSentrySampler(0.05)({
          attributes: { 'user_agent.original': userAgent },
          inheritOrSampleWith: () => 1,
        })
      ).toBe(0);
    }
  );

  it('uses the browser user agent when no request metadata exists', () => {
    expect(
      createSentrySampler(
        0.1,
        () => 'HeadlessChrome'
      )({
        inheritOrSampleWith: () => 1,
      })
    ).toBe(0);
  });

  it('preserves parent sampling and the existing human traffic rate', () => {
    const sampler = createSentrySampler(0.05);
    expect(sampler({ inheritOrSampleWith: (rate) => rate })).toBe(0.05);
    expect(sampler({ inheritOrSampleWith: () => 0.25 })).toBe(0.25);
  });
});
