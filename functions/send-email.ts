import { Resend } from 'resend';
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
		from: 'Contact Form <noreply@blakeoxford.com>',
		to: ['blakepoxford@outlook.com'],
	},
	storage: {
		messageTtl: 60 * 60 * 24 * 365, // 1 year
	},
	turnstile: {
		verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
	},
} as const;

const ERROR_MESSAGES = {
	missingFields: 'Missing required fields or Turnstile token.',
	rateLimited: 'Too many requests. Please wait a bit.',
	botVerificationFailed: 'Bot verification failed.',
	emailSendFailed: 'Failed to send email.',
} as const;

// ─── Helper Functions ───────────────────────────────────────────

/**
 * Check rate limit for IP address
 * @returns true if rate limit exceeded
 */
async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
	try {
		const key = `ip:${ip}`;
		const hits = await env.RATE_LIMIT_KV.get(key);
		if (hits && parseInt(hits, 10) >= CONFIG.rateLimit.maxPerWindow) {
			return true;
		}
		await env.RATE_LIMIT_KV.put(
			key,
			hits ? (parseInt(hits, 10) + 1).toString() : '1',
			{ expirationTtl: CONFIG.rateLimit.kvTtl }
		);
		return false;
	} catch (e) {
		console.warn('⚠️ Rate-limit KV error (continuing):', e);
		return false; // Fail open on KV errors
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
	const result = await response.json() as TurnstileResponse;
	return result.success;
}

/**
 * Format email HTML
 */
function formatEmailHtml(name: string, email: string, message: string): string {
	return `<h2>New Message from ${name}</h2>
             <p><strong>Email:</strong> ${email}</p>
             <p>${message.replace(/\n/g, '<br>')}</p>`;
}

/**
 * Format email text
 */
function formatEmailText(name: string, email: string, message: string): string {
	return `Name: ${name}\nEmail: ${email}\n\n${message}`;
}

interface MessageData {
	ip: string;
	name: string;
	email: string;
	message: string;
}

/**
 * Store message in KV for audit trail
 */
async function storeMessage(env: Env, { ip, name, email, message }: MessageData): Promise<void> {
	try {
		const id = `${Date.now()}_${crypto.randomUUID()}`;
		await env.CONTACT_FORM_KV.put(
			`msg:${id}`,
			JSON.stringify({ id, timestamp: new Date().toISOString(), ip, name, email, message }),
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

export async function onRequestPost(context: EventContext<Env, string, unknown>): Promise<Response> {
	// Initialize Sentry for error tracking in edge function
	const Sentry = initEdgeSentry(context.env);
	
	const ct = context.request.headers.get('content-type') || '';
	const isJson = ct.includes('application/json');

	// Add breadcrumb to track email processing
	addEdgeBreadcrumb({
		category: 'email',
		message: 'Processing contact form submission',
		level: 'info',
		data: { contentType: ct, isJson }
	});

	try {
		// ─── Parse incoming data ─────────────────────────
		let name: string | undefined;
		let email: string | undefined;
		let message: string | undefined;
		let token: string | undefined;
		let botField: string | null = null;

		if (isJson) {
			const body = await context.request.json() as Partial<ContactFormData>;
			name = body.name;
			email = body.email;
			message = body.message;
			token = body['cf-turnstile-response'];
		} else {
			const fd = await context.request.formData();
			name = fd.get('name')?.toString();
			email = fd.get('email')?.toString();
			message = fd.get('message')?.toString();
			token = fd.get('cf-turnstile-response')?.toString();
			botField = fd.get('bot-field')?.toString() ?? null;
		}

		const ip = context.request.headers.get('CF-Connecting-IP') ?? 'unknown';

		// ─── Honeypot: silently succeed ───────────────────
		if (botField) {
			return jsonOrRedirect({ success: true }, isJson);
		}

		// ─── Validate required fields & token ────────────
		if (!name || !email || !message || !token) {
			return errorResponse(400, ERROR_MESSAGES.missingFields, isJson);
		}

		// ─── Rate‐limit per IP via KV ────────────────────
		const isRateLimited = await checkRateLimit(context.env, ip);
		if (isRateLimited) {
			return errorResponse(429, ERROR_MESSAGES.rateLimited, isJson);
		}

		// ─── Verify Turnstile ────────────────────────────
		const isVerified = await verifyTurnstile(context.env.TURNSTILE_SECRET_KEY, token, ip);
		if (!isVerified) {
			return errorResponse(403, ERROR_MESSAGES.botVerificationFailed, isJson);
		}

		// ─── Send email via Resend ───────────────────────
		const resend = new Resend(context.env.RESEND_API_KEY);
		const { error } = await resend.emails.send({
			from: CONFIG.email.from,
			to: CONFIG.email.to,
			subject: `New Message from ${name}`,
			reply_to: email,
			text: formatEmailText(name, email, message),
			html: formatEmailHtml(name, email, message),
		});
		if (error) {
			return errorResponse(500, ERROR_MESSAGES.emailSendFailed, isJson);
		}

		// ─── Log submission in KV ────────────────────────
		await storeMessage(context.env, { ip, name, email, message });

		// ─── Success response ────────────────────────────
		return jsonOrRedirect({ success: true }, isJson);

	} catch (err) {
		// Capture error to Sentry with context
		Sentry.captureException(err, {
			tags: { 
				function: 'send-email',
				contentType: ct
			},
			extra: { 
				hasBody: !!context.request.body,
				isJson
			}
		});
		
		// Keep existing console.error for Cloudflare logs
		console.error('💥 send-email error:', err);
		return errorResponse(500, 'Internal server error.', isJson);
	}
}
