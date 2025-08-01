import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  // Skip middleware for API routes and static assets to prevent interference
  if (context.url.pathname.startsWith('/api/') || context.url.pathname.includes('.')) {
    return next();
  }

  const abTestGroup = context.cookies.get('ab-test-group')?.value;

  if (!abTestGroup) {
    // Assign user to a group
    const group = Math.random() < 0.5 ? 'A' : 'B';
    context.cookies.set('ab-test-group', group, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: import.meta.env.PROD, // Only send cookie over HTTPS in production
      sameSite: 'lax',
    });
    context.locals.abTestGroup = group;
  } else {
    context.locals.abTestGroup = abTestGroup as 'A' | 'B';
  }

  return next();
});
