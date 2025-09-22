/// <reference types="../global.d.ts" />
/// <reference types="../global.d.ts" />
// src/middleware/personalization.ts
import { defineMiddleware } from 'astro:middleware';

// Temporarily no-op middleware to isolate prerender header warnings
export const onRequest = defineMiddleware((_, next) => next());
