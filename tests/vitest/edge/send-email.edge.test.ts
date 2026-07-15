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

// Mock crypto.randomUUID before the test runs
vi.stubGlobal('crypto', {
	...crypto,
	randomUUID: vi.fn(() => 'test-uuid-12345'),
});

interface MockOpts { json?: boolean; body?: any; turnstileOk?: boolean; existingHits?: number; emailSendError?: boolean; acceptJson?: boolean; }

function mockContext({ json = true, body, turnstileOk = true, existingHits, emailSendError, acceptJson = false }: MockOpts = {}) {
  const headers = new Headers({ 'content-type': json ? 'application/json' : 'application/x-www-form-urlencoded', 'CF-Connecting-IP': '1.2.3.4' });
	if (acceptJson) headers.set('accept', 'application/json');
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
		CONTACT_EMAIL: {
			send: vi.fn(async () => {
				if (emailSendError) throw new Error('Cloudflare email send failed');
				return { messageId: 'test-message-id' };
			}),
		},
		SENTRY_DSN_EDGE: 'https://test@test.ingest.sentry.io/test'
  };
  global.fetch = vi.fn(async (url) => {
    if ((url as string).includes('turnstile')) {
      return { json: async () => ({ success: turnstileOk }) } as any;
    }
    throw new Error('Unexpected fetch ' + url);
  });
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
  it('handles Cloudflare email send errors', async () => {
		const ctx = mockContext({ body: { name: 'A', email: 'a@b.com', message: 'Hi', 'cf-turnstile-response': 't' }, emailSendError: true });
    const res = await onRequestPost(ctx);
    expect(res.status).toBe(500);
  });
  it('succeeds happy path', async () => {
    const ctx = mockContext({ body: { name: 'A', email: 'a@b.com', message: 'Hi', 'cf-turnstile-response': 't' } });
    const res = await onRequestPost(ctx);
    expect(res.status).toBe(200);
		expect(ctx.env.CONTACT_EMAIL.send).toHaveBeenCalledWith(expect.objectContaining({
			to: 'blakepoxford@outlook.com',
			from: { email: 'noreply@blakeoxford.com', name: 'Blake Oxford Contact Form' },
			replyTo: 'a@b.com',
		}));
  });
	it('escapes user content in the HTML email', async () => {
		const ctx = mockContext({ body: { name: '<Blake>', email: 'a@b.com', message: '<script>alert(1)</script>', 'cf-turnstile-response': 't' } });
		await onRequestPost(ctx);
		const message = ctx.env.CONTACT_EMAIL.send.mock.calls[0][0];
		expect(message.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
		expect(message.html).not.toContain('<script>');
	});
	it('returns JSON to FormData clients that request it', async () => {
		const body = new URLSearchParams({
			name: 'A User',
			email: 'a@b.com',
			message: 'A sufficiently long message',
			'cf-turnstile-response': 't',
		});
		const ctx = mockContext({ json: false, body, acceptJson: true });
		const res = await onRequestPost(ctx);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('application/json');
		expect(await res.json()).toEqual({ success: true });
	});
});
