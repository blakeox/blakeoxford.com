/// <reference types="../global.d.ts" />
/// <reference types="../global.d.ts" />
// src/middleware/personalization.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  // Skip all middleware logic during static prerender
  if (import.meta.env.PRERENDER) {
    return next();
  }

  // Skip middleware for API routes
  if (context.url.pathname.startsWith('/api/')) {
    return next();
  }

  const abTestGroup = context.cookies.get('ab-test-group')?.value;

  if (!abTestGroup) {
    // Randomly assign user to group A or B
    const group = Math.random() < 0.5 ? 'A' : 'B';
    context.cookies.set('ab-test-group', group, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    // Type assertion to work around TypeScript issue
    (context.locals as any).abTestGroup = group;
  } else {
    // Type assertion to work around TypeScript issue
    (context.locals as any).abTestGroup = abTestGroup as 'A' | 'B';
  }

  return next();
});
