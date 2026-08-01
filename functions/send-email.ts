import type { Env, ContactFormData } from './types';
import { initEdgeSentry, addEdgeBreadcrumb } from '../sentry.edge.config.js';

// ─── Configuration ──────────────────────────────────────────────
const CONFIG = {
  rateLimit: {
    windowSeconds: 30,
    maxPerWindow: 2,
    kvTtl: 60,
  },
  email: {
    from: { email: 'noreply@blakeoxford.com', name: 'Blake Oxford Contact Form' },
    to: 'blakepoxford@outlook.com',
  },
  storage: {
    messageTtl: 60 * 60 * 24 * 90, // 90 days
  },
  turnstile: {
    verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  },
} as const;

const ERROR_MESSAGES = {
  missingFields: 'Missing required fields or Turnstile token.',
  rateLimited: 'Too many requests. Please wait a bit.',
  botVerificationFailed: 'Bot verification failed.',
} as const;

// ─── Helper Functions ───────────────────────────────────────────

/**
 * Check rate limit for IP address
 * @returns true if rate limit exceeded
 */
type RateLimitResult = 'allowed' | 'limited' | 'unavailable';

async function checkRateLimit(env: Env, ip: string): Promise<RateLimitResult> {
  try {
    const key = `ip:${ip}`;
    const hits = await env.RATE_LIMIT_KV.get(key);
    if (hits && parseInt(hits, 10) >= CONFIG.rateLimit.maxPerWindow) {
      return 'limited';
    }
    await env.RATE_LIMIT_KV.put(key, hits ? (parseInt(hits, 10) + 1).toString() : '1', {
      expirationTtl: CONFIG.rateLimit.kvTtl,
    });
    return 'allowed';
  } catch (e) {
    console.error('Rate-limit KV unavailable:', e);
    return 'unavailable';
  }
}

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify Turnstile token
 */
async function verifyTurnstile(secret: string, token: string, ip: string): Promise<boolean> {
  const response = await fetch(CONFIG.turnstile.verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const result = (await response.json()) as TurnstileResponse;
  return result.success;
}

/**
 * Format email HTML
 */
function formatEmailHtml(name: string, email: string, message: string): string {
  return `<h2>New contact form message</h2>
             <p><strong>Name:</strong> ${escapeHtml(name)}</p>
             <p><strong>Email:</strong> ${escapeHtml(email)}</p>
             <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character
  );
}

/**
 * Format email text
 */
function formatEmailText(name: string, email: string, message: string): string {
  return `Name: ${name}\nEmail: ${email}\n\n${message}`;
}

interface MessageData {
  name: string;
  email: string;
  message: string;
}

/**
 * Store message in KV for audit trail
 */
async function storeMessage(env: Env, { name, email, message }: MessageData): Promise<void> {
  try {
    const id = `${Date.now()}_${crypto.randomUUID()}`;
    await env.CONTACT_MESSAGES.put(
      `msg:${id}`,
      JSON.stringify({ id, timestamp: new Date().toISOString(), name, email, message }),
      { expirationTtl: CONFIG.storage.messageTtl }
    );
  } catch (e) {
    console.warn('⚠️ Submission KV write failed:', e);
  }
}

// ─── Error Response Helpers ─────────────────────────────────────

function errorResponse(status: number, message: string, isJson: boolean): Response {
  if (isJson) {
    return new Response(JSON.stringify({ success: false, error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain' } });
}

function jsonOrRedirect(data: { success: boolean }, isJson: boolean): Response {
  if (isJson) {
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(null, {
    status: 303,
    headers: { Location: '/contact/?success=true' },
  });
}

// ─── Main Handler ───────────────────────────────────────────────

export interface EventContext<Env, P extends string, Data> {
  request: Request;
  env: Env;
  params: Record<P, string>;
  data: Data;
  waitUntil: (promise: Promise<unknown>) => void;
  next: () => Promise<Response>;
}

export async function onRequestPost(
  context: EventContext<Env, string, unknown>
): Promise<Response> {
  // Initialize Sentry for error tracking in edge function
  const Sentry = initEdgeSentry(context.env);

  const ct = context.request.headers.get('content-type') || '';
  const hasJsonBody = ct.includes('application/json');
  const wantsJsonResponse =
    hasJsonBody || (context.request.headers.get('accept') || '').includes('application/json');

  // Add breadcrumb to track email processing
  addEdgeBreadcrumb({
    category: 'email',
    message: 'Processing contact form submission',
    level: 'info',
    data: { contentType: ct, hasJsonBody, wantsJsonResponse },
  });

  try {
    const contentLength = Number(context.request.headers.get('content-length') || 0);
    if (contentLength > 16 * 1024) {
      return errorResponse(413, 'Request is too large.', wantsJsonResponse);
    }

    // ─── Parse incoming data ─────────────────────────
    let name: string | undefined;
    let email: string | undefined;
    let message: string | undefined;
    let token: string | undefined;
    let botField: string | null = null;

    if (hasJsonBody) {
      const body = (await context.request.json()) as Partial<ContactFormData>;
      name = typeof body.name === 'string' ? body.name.trim() : undefined;
      email = typeof body.email === 'string' ? body.email.trim() : undefined;
      message = typeof body.message === 'string' ? body.message.trim() : undefined;
      token =
        typeof body['cf-turnstile-response'] === 'string'
          ? body['cf-turnstile-response'].trim()
          : undefined;
    } else {
      const fd = await context.request.formData();
      name = fd.get('name')?.toString().trim();
      email = fd.get('email')?.toString().trim();
      message = fd.get('message')?.toString().trim();
      token = fd.get('cf-turnstile-response')?.toString().trim();
      botField = fd.get('bot-field')?.toString() ?? null;
    }

    const ip = context.request.headers.get('CF-Connecting-IP') ?? 'unknown';

    // ─── Honeypot: silently succeed ───────────────────
    if (botField) {
      return jsonOrRedirect({ success: true }, wantsJsonResponse);
    }

    // ─── Validate required fields & token ────────────
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !name ||
      !email ||
      !message ||
      !token ||
      name.length > 120 ||
      email.length > 254 ||
      !emailPattern.test(email) ||
      message.length > 5000 ||
      token.length > 4096
    ) {
      return errorResponse(400, ERROR_MESSAGES.missingFields, wantsJsonResponse);
    }
    if (!context.env.TURNSTILE_SECRET_KEY) {
      console.error('TURNSTILE_SECRET_KEY is not configured');
      return errorResponse(503, 'Contact service unavailable.', wantsJsonResponse);
    }

    // ─── Rate‐limit per IP via KV ────────────────────
    const rateLimit = await checkRateLimit(context.env, ip);
    if (rateLimit === 'limited') {
      return errorResponse(429, ERROR_MESSAGES.rateLimited, wantsJsonResponse);
    }
    if (rateLimit === 'unavailable') {
      return errorResponse(503, 'Contact service unavailable.', wantsJsonResponse);
    }

    // ─── Verify Turnstile ────────────────────────────
    const isVerified = await verifyTurnstile(context.env.TURNSTILE_SECRET_KEY, token, ip);
    if (!isVerified) {
      return errorResponse(403, ERROR_MESSAGES.botVerificationFailed, wantsJsonResponse);
    }

    // ─── Send email via Cloudflare Email Service ─────
    await context.env.CONTACT_EMAIL.send({
      from: CONFIG.email.from,
      to: CONFIG.email.to,
      subject: `New contact form message from ${name.replace(/[\r\n]/g, ' ')}`,
      replyTo: email,
      text: formatEmailText(name, email, message),
      html: formatEmailHtml(name, email, message),
    });

    // ─── Log submission in KV ────────────────────────
    await storeMessage(context.env, { name, email, message });

    // ─── Success response ────────────────────────────
    return jsonOrRedirect({ success: true }, wantsJsonResponse);
  } catch (err) {
    // Capture error to Sentry with context
    Sentry.captureException(err, {
      tags: {
        function: 'send-email',
        contentType: ct,
      },
      extra: {
        hasBody: !!context.request.body,
        hasJsonBody,
        wantsJsonResponse,
      },
    });

    // Keep existing console.error for Cloudflare logs
    console.error('💥 send-email error:', err);
    return errorResponse(500, 'Internal server error.', wantsJsonResponse);
  }
}
