// src/middleware/personalization.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  // Skip middleware for API routes
  if (context.url.pathname.startsWith('/api/')) {
    return next();
  }

  const abTestGroup = context.cookies.get('ab-test-group')?.value;

  if (!abTestGroup) {
    // Assign user to a group
    const group = Math.random() < 0.5 ? 'A' : 'B';
    context.cookies.set('ab-test-group', group, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    context.locals.abTestGroup = group;
  } else {
    context.locals.abTestGroup = abTestGroup as 'A' | 'B';
  }

  return next();
});
