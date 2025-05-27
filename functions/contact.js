// Cloudflare Pages Function: /functions/contact.js
// Receives POST from contact form and sends email via Resend API

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    const website = formData.get('website'); // honeypot
    const turnstileToken = formData.get('cf-turnstile-response');
    // Honeypot: block bots
    if (website) {
      return new Response('Spam detected', { status: 200 });
    }
    // Basic validation
    if (!name || !email || !message) {
      return new Response('Missing required fields', { status: 400 });
    }
    if (!turnstileToken) {
      return new Response('CAPTCHA required', { status: 400 });
    }
    // Verify Turnstile
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    const turnstileVerifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: turnstileToken,
        remoteip: context.request.headers.get('CF-Connecting-IP') || ''
      })
    });
    const turnstileVerify = await turnstileVerifyRes.json();
    if (!turnstileVerify.success) {
      return new Response('CAPTCHA failed', { status: 400 });
    }
    // Rate limiting (simple in-memory, resets on cold start)
    globalThis._contactRateLimit = globalThis._contactRateLimit || {};
    const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxPerWindow = 5;
    globalThis._contactRateLimit[ip] = (globalThis._contactRateLimit[ip] || []).filter(ts => now - ts < windowMs);
    if (globalThis._contactRateLimit[ip].length >= maxPerWindow) {
      return new Response('Rate limit exceeded. Try again later.', { status: 429 });
    }
    globalThis._contactRateLimit[ip].push(now);

    // Prepare email content
    const subject = `New Contact Form Submission from ${name}`;
    const body = `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`;

    // Send email using Resend API
    // Set RESEND_API_KEY and RESEND_FROM_EMAIL as Cloudflare secrets
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;
    const resendToEmail = process.env.RESEND_TO_EMAIL || resendFromEmail;
    if (!resendApiKey || !resendFromEmail) {
      return new Response('Email service not configured', { status: 500 });
    }
    // Logging (console, can be extended to KV)
    console.log(`[Contact] ${now} from ${ip}:`, { name, email, message });
    // Send main email to site owner
    const mailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: resendToEmail,
        subject,
        text: body
      })
    });
    if (!mailRes.ok) {
      const error = await mailRes.text();
      console.error('Resend API error (site owner):', error);
      return Response.redirect('/contact?error=1', 303);
    }
    // Send confirmation email to user
    const confirmRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: email,
        subject: 'Thank you for contacting Blake Oxford',
        text: `Hi ${name},\n\nThank you for reaching out! I have received your message and will get back to you soon.\n\nYour message:\n${message}\n\nBest,\nBlake Oxford`
      })
    });
    if (!confirmRes.ok) {
      const error = await confirmRes.text();
      console.error('Resend API error (confirmation):', error);
      return Response.redirect('/contact?error=1', 303);
    }
    // Redirect to /contact?success=true (no trailing slash)
    return Response.redirect('/contact?success=true', 303);
  } catch (err) {
    return new Response('Server error: ' + err, { status: 500 });
  }
}

// Cloudflare Environment Variables (Secrets)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const RESEND_TO_EMAIL = process.env.RESEND_TO_EMAIL;
