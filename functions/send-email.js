import { Resend } from 'resend';

const WINDOW_SECONDS = 60;   // 1 minute
const MAX_PER_WINDOW = 1;

export async function onRequestPost(context) {
  try {
    /* ────── Parse body (JSON or formData) ────── */
    let name, email, message, token, botField;
    if (context.request.headers.get('content-type')?.includes('application/json')) {
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

    /* ────── Honeypot ────── */
    if (botField) return okResponse();

    /* ────── Validate fields ────── */
    if (!name || !email || !message || !token)
      return errorResponse(400, 'Missing required fields or Turnstile token.');

    /* ────── Simple rate‑limit via KV ────── */
    try {
      const key   = `ip:${ip}`;
      const hits  = await context.env.RATE_LIMIT_KV.get(key);
      if (hits && parseInt(hits) >= MAX_PER_WINDOW)
        return errorResponse(429, 'Too many requests. Please wait a minute.');

      await context.env.RATE_LIMIT_KV.put(
        key,
        hits ? (parseInt(hits) + 1).toString() : '1',
        { expirationTtl: WINDOW_SECONDS }
      );
    } catch (err) {
      console.warn('Rate‑limit KV issue (continuing):', err);
    }

    /* ────── Verify Turnstile ────── */
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: context.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip
      })
    }).then(r => r.json());

    if (!verify.success)
      return errorResponse(403, 'Bot verification failed.');

    /* ────── Send email via Resend ────── */
    const resend = new Resend(context.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'Contact Form <noreply@blakeoxford.com>',
      to:   ['blakepoxford@outlook.com'],
      subject: `New Message from ${name}`,
      reply_to: email,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<h2>New Message from ${name}</h2>
             <p><strong>Email:</strong> ${email}</p>
             <p>${message.replace(/\n/g,'<br>')}</p>`
    });

    if (error) return errorResponse(500, 'Failed to send email.');

    /* ────── Store message in KV ────── */
    try {
      const id = `${Date.now()}_${crypto.randomUUID()}`;
      await context.env.CONTACT_MESSAGES.put(
        `msg:${id}`,
        JSON.stringify({ id, now, ip, name, email, message }),
        { expirationTtl: 60 * 60 * 24 * 365 }   // 1 year
      );
    } catch (err) {
      console.warn('Could not write to CONTACT_MESSAGES KV:', err);
    }

    return okResponse();

  } catch (err) {
    console.error('Unhandled error in send-email:', err);
    return errorResponse(500, 'Internal server error.');
  }
}

/* ───────── helper responses ───────── */
function okResponse() {
  const body = JSON.stringify({ success: true });
  // 303 so plain form‑POST redirects to thank‑you banner
  return new Response(body, {
    status: 303,
    headers: {
      'Content-Type': 'application/json',
      'Location': '/contact/?success=true'
    }
  });
}

function errorResponse(status, msg) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}