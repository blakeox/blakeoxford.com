import { Resend } from 'resend';

export async function onRequestPost(context) {
  try {
    // Parse formData (includes cf-turnstile-response)
    const formData = await context.request.formData();
    const name    = formData.get('name');
    const email   = formData.get('email');
    const message = formData.get('message');
    const token   = formData.get('cf-turnstile-response');
    const ip      = context.request.headers.get('CF-Connecting-IP');

    console.log('📩 Parsed input:', { name, email, message });

    // Validate required fields + Turnstile token
    if (!name || !email || !message || !token) {
      console.warn('⚠️ Missing fields or token:', { name, email, message, token });
      return new Response(
        JSON.stringify({ error: 'Missing required fields or Turnstile token.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify Turnstile
    const turnRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: context.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: ip,
        }),
      }
    );
    const turnData = await turnRes.json();
    if (!turnData.success) {
      console.warn('🚫 Turnstile failed:', turnData);
      return new Response(
        JSON.stringify({ error: 'Bot verification failed.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check Resend API key
    const apiKey = context.env.RESEND_API_KEY;
    console.log('🔐 API key present?', !!apiKey);
    if (!apiKey) {
      console.error('❌ Missing RESEND_API_KEY in function env');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend
    const resend = new Resend(apiKey);
    console.log('📤 Sending email…');
    const { error } = await resend.emails.send({
      from: 'Contact Form <noreply@blakeoxford.com>',
      to: ['blakepoxford@outlook.com'],
      subject: `New Message from ${name}`,
      reply_to: email,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    if (error) {
      console.error('📛 Resend error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Email sent successfully');
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('💥 Crash in send-email function:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}