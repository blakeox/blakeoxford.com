import { Resend } from 'resend';

export async function onRequestPost(context) {
  try {
    const { name, email, message } = await context.request.json();
    console.log('📩 Parsed input:', { name, email, message });

    const apiKey = context.env.RESEND_API_KEY;
    console.log('🔐 API key present?', !!apiKey);

    if (!name || !email || !message) {
      console.warn('⚠️ Missing fields:', { name, email, message });
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!apiKey) {
      console.error('❌ API key is missing in env.');
      return new Response(JSON.stringify({ error: 'Missing API key.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resend = new Resend(apiKey);
    console.log('📤 About to send email...');

    const { error, data } = await resend.emails.send({
      from: 'Contact Form <onboarding@resend.dev>', // TEMP fallback
      to: ['blakepoxford@outlook.com'],
      subject: `New Contact Form Submission from ${name}`,
      reply_to: email,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    });

    if (error) {
      console.error('📛 Resend error:', error);
      return new Response(JSON.stringify({ error: 'Failed to send email.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Email sent successfully:', data);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('💥 Crash in send-email function:', err);
    return new Response(JSON.stringify({ error: 'Server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}