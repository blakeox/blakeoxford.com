import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost } from '../../../functions/send-email.ts';

// Mock Sentry before imports
vi.mock('../../../sentry.edge.config.js', () => ({
	initEdgeSentry: vi.fn(() => ({
		captureException: vi.fn(),
		captureMessage: vi.fn(),
		flush: vi.fn(async () => true),
	})),
	addEdgeBreadcrumb: vi.fn(),
}));

vi.mock('resend', () => {
	return {
		Resend: class {
			constructor() {
				return (global as any).__resendInst;
			}
		}
	};
});

// Mock crypto.randomUUID before the test runs
vi.stubGlobal('crypto', {
	...crypto,
	randomUUID: vi.fn(() => 'test-uuid-12345'),
});

interface MockOpts { json?: boolean; body?: any; turnstileOk?: boolean; existingHits?: number; resendError?: boolean; }

function mockContext({ json = true, body, turnstileOk = true, existingHits, resendError }: MockOpts = {}) {
  const headers = new Headers({ 'content-type': json ? 'application/json' : 'application/x-www-form-urlencoded', 'CF-Connecting-IP': '1.2.3.4' });
  const request = new Request('https://example.com/functions/send-email', {
    method: 'POST',
    headers,
    body: json ? JSON.stringify(body) : body,
  });
  const env = {
    RATE_LIMIT_KV: {
      store: existingHits ? { 'ip:1.2.3.4': existingHits.toString() } : {},
      async get(k: string) { return (this as any).store[k] || null; },
      async put(k: string, v: string) { (this as any).store[k] = v; }
    },
    CONTACT_MESSAGES: { async put() {} },
    TURNSTILE_SECRET_KEY: 'secret',
    RESEND_API_KEY: 'apikey',
		SENTRY_DSN_EDGE: 'https://test@test.ingest.sentry.io/test'
  };
  global.fetch = vi.fn(async (url) => {
    if ((url as string).includes('turnstile')) {
      return { json: async () => ({ success: turnstileOk }) } as any;
    }
    throw new Error('Unexpected fetch ' + url);
  });
  const resendInst = { 
		emails: { 
			send: vi.fn(async () => {
				if (resendError) {
					return { error: { message: 'err' }, data: null };
				}
				return { data: { id: '123' }, error: null };
			}) 
		} 
	};
  (global as any).__resendInst = resendInst;
  return { request, env, waitUntil: vi.fn(), next: vi.fn(), params: {}, data: {} } as any;
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('send-email edge function', () => {
  it('rejects missing fields', async () => {
    const ctx = mockContext({ body: { name: 'A' } });
    const res = await onRequestPost(ctx);
    expect(res.status).toBe(400);
  });
  it('enforces rate limit', async () => {
    const ctx = mockContext({ body: { name: 'A', email: 'a@b.com', message: 'Hi', 'cf-turnstile-response': 't' }, existingHits: 2 });
    const res = await onRequestPost(ctx);
    expect(res.status).toBe(429);
  });
  it('blocks failed turnstile', async () => {
    const ctx = mockContext({ body: { name: 'A', email: 'a@b.com', message: 'Hi', 'cf-turnstile-response': 't' }, turnstileOk: false });
    const res = await onRequestPost(ctx);
    expect(res.status).toBe(403);
  });
  it('handles resend error', async () => {
    const ctx = mockContext({ body: { name: 'A', email: 'a@b.com', message: 'Hi', 'cf-turnstile-response': 't' }, resendError: true });
    const res = await onRequestPost(ctx);
    expect(res.status).toBe(500);
  });
  it('succeeds happy path', async () => {
    const ctx = mockContext({ body: { name: 'A', email: 'a@b.com', message: 'Hi', 'cf-turnstile-response': 't' } });
    const res = await onRequestPost(ctx);
    expect(res.status).toBe(200);
  });
});
