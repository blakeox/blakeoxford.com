import { Resend } from 'resend';

const WINDOW_SECONDS = 30;    // logical window
const MAX_PER_WINDOW  = 2;    // max msgs per window
const KV_TTL          = 60;   // must be ≥60 for Cloudflare KV

export async function onRequestPost(context) {
  const ct      = context.request.headers.get('content-type') || '';
  const isJson  = ct.includes('application/json');

  try {
    // ─── Parse payload ───────────────────────
    let name, email, message, token, botField;
    if (isJson) {
      ({ name, email, message, token } = await context.request.json());
    } else {
      const fd = await context.request.formData();
      name     = fd.get('name');
      email    = fd.get('email');
      message  = fd.get('message');
      token    = fd.get('cf-turnstile-response');
      botField = fd.get('bot-field');
    }

    const ip  = context.request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const now = new Date().toISOString();

    // ─── Honeypot ────────────────────────────
    if (botField) {
      return jsonOrRedirect({ success: true }, isJson);
    }

    // ─── Validation ──────────────────────────
    if (!name || !email || !message || !token) {
      return errorResponse(400, 'Missing required fields or Turnstile token.', isJson);
    }

    // ─── Rate-limit via KV ────────────────────
    try {
      const key  = `ip:${ip}`;
      const hits = await context.env.RATE_LIMIT_KV.get(key);
      if (hits && parseInt(hits) >= MAX_PER_WINDOW) {
        return errorResponse(429, 'Too many requests. Please wait a bit.', isJson);
      }
      await context.env.RATE_LIMIT_KV.put(
        key,
        hits ? (parseInt(hits) + 1).toString() : '1',
        { expirationTtl: KV_TTL }
      );
    } catch (e) {
      console.warn('⚠️ Rate-limit KV error (continuing):', e);
    }

    // ─── Turnstile verify ─────────────────────
    const verify = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret:   context.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: ip,
        }),
      }
    ).then(r => r.json());

    if (!verify.success) {
      return errorResponse(403, 'Bot verification failed.', isJson);
    }

    // ─── Send email via Resend ───────────────
    const resend = new Resend(context.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from:     'Contact Form <noreply@blakeoxford.com>',
      to:       ['blakepoxford@outlook.com'],
      subject:  `New Message from ${name}`,
      reply_to: email,
      text:     `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<h2>New Message from ${name}</h2>
             <p><strong>Email:</strong> ${email}</p>
             <p>${message.replace(/\n/g,'<br>')}</p>`
    });
    if (error) {
      return errorResponse(500, 'Failed to send email.', isJson);
    }

    // ─── Log to KV ───────────────────────────
    try {
      const id = `${Date.now()}_${crypto.randomUUID()}`;
      await context.env.CONTACT_MESSAGES.put(
        `msg:${id}`,
        JSON.stringify({ id, now, ip, name, email, message }),
        { expirationTtl: 60 * 60 * 24 * 365 }
      );
    } catch (e) {
      console.warn('⚠️ Submission KV write failed:', e);
    }

    // ─── Success ─────────────────────────────
    return jsonOrRedirect({ success: true }, isJson);

  } catch (err) {
    console.error('💥 send-email error:', err);
    return errorResponse(500, 'Internal server error.', isJson);
  }
}

/* ─── Helpers ─────────────────────────────────── */

// Return JSON 200 for AJAX, or 303 redirect for classic form-POST
function jsonOrRedirect(body, isJson) {
  if (isJson) {
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    return Response.redirect('/contact/?success=true', 303);
  }
}

// Return JSON error + optional Retry-After header
function errorResponse(status, msg, isJson) {
  if (!isJson) {
    // non-JS fallback, just redirect back with error query
    return Response.redirect(`/contact/?error=${encodeURIComponent(msg)}`, 303);
  }
  const headers = { 'Content-Type': 'application/json' };
  if (status === 429) headers['Retry-After'] = WINDOW_SECONDS.toString();
  return new Response(JSON.stringify({ error: msg }), { status, headers });
}