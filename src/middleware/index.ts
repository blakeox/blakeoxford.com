/// <reference types="../global.d.ts" />
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  // Skip all middleware logic during static prerender to avoid accessing request headers/cookies
  if (import.meta.env.PRERENDER) {
    return next();
  }

  // Skip middleware for API routes and static assets to prevent interference
  if (context.url.pathname.startsWith('/api/') || context.url.pathname.includes('.')) {
    return next();
  }

  const abTestGroup = context.cookies.get('ab-test-group')?.value;

  if (!abTestGroup) {
    // Randomly assign user to group A or B (50/50 split)
    const group = Math.random() < 0.5 ? 'A' : 'B';
    context.cookies.set('ab-test-group', group, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: import.meta.env.PROD, // Only send cookie over HTTPS in production
      sameSite: 'lax',
    });
    // Type assertion to work around TypeScript issue
    (context.locals as any).abTestGroup = group;
  } else {
    // Type assertion to work around TypeScript issue  
    (context.locals as any).abTestGroup = abTestGroup as 'A' | 'B';
  }

  return next();
});
