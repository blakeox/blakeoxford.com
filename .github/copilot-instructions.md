<!--
	Copilot/AI Agent Instructions for blakeoxford.com
	Last updated: 2025-08-07
-->

# AI Agent Coding Guide for blakeoxford.com

This project is a **performance-obsessed Astro SSG** for Cloudflare Pages, with strict conventions and advanced optimization. Follow these rules to be productive and avoid common pitfalls:

## 1. Architecture & Structure
- **Astro SSG** (`output: 'static'`), minimal client JS, all routing in `src/pages/` (Astro file-based, kebab-case).
- **Components**: `src/components/` (PascalCase, .astro/.tsx), only use React for interactivity.
- **Content**: Type-safe collections in `src/content/` (see Zod schemas in `config.ts`).
- **Styling**: Tailwind CSS v4, no custom CSS—extend via Tailwind or CSS variables in `src/styles/global.css`.
- **Edge/Server**: Cloudflare Workers in `functions/` (e.g., `edge-computing.js`, `send-email.js`).
- **Testing**: Vitest (unit, `tests/vitest/`), Playwright (e2e, `tests/playwright/`), accessibility via axe-core.
- **Scripts**: All build/optimization in `scripts/` (see `optimization/`, `build/`, `content/`).

## 2. Developer Workflows
- **Build**: `pnpm build` (auto-generates search index, runs all optimizations).
- **Dev**: `pnpm dev` (local server), `pnpm preview` (preview build).
- **Test**: `pnpm test` (unit), `pnpm test:e2e` (e2e), `pnpm test:ci` (all tests, CI).
- **Lint**: `pnpm lint` (ESLint for .js/.ts/.astro/.mdx).
- **Performance**: `pnpm optimize:advanced`, `pnpm perf:test`, `pnpm critical:css`, `pnpm optimize:images`, `pnpm analyze:bundle`.
- **Edge Deploy**: `pnpm edge:deploy` (Cloudflare Workers), `wrangler pages deploy dist` (manual Pages deploy).
- **Always** run `pnpm generate:search-index` before build (auto-run by build script).

## 3. Project-Specific Patterns
- **No custom CSS**—all styling via Tailwind or CSS variables.
- **Content schemas**: Use Zod schemas in `src/content/config.ts` for blog/projects.
- **Dynamic imports**: Use lazy loading for non-critical components (see `component-code-splitter.js`).
- **Error handling**: Use structured error objects (see `BUNDLE_OPTIMIZATION_SUMMARY.md`).
- **Accessibility**: All UI must be keyboard navigable, screen reader friendly, and pass axe-core tests.
- **Performance**: Inline critical CSS, optimize images, and split bundles (see `scripts/optimization/`).
- **Testing**: All new features require unit and e2e tests; accessibility is mandatory.
- **No new dependencies** without explicit approval—stack is intentionally minimal.

## 4. Integration & Data Flows
- **Cloudflare KV**: Used for forms/rate limiting (see `functions/`).
- **External APIs**: Resend (email), Fuse.js (search), Lighthouse CI (perf).
- **Content**: API endpoints in `src/pages/api/`, static data in `public/api/`.
- **Optimization**: Scripts in `scripts/optimization/` automate code splitting, bundle analysis, and performance reporting.

## 5. Examples & References
- **Component code splitting**: `scripts/optimization/component-code-splitter.js`
- **Error handling**: See before/after in `BUNDLE_OPTIMIZATION_SUMMARY.md`
- **Content schemas**: `src/content/config.ts`
- **Edge/server**: `functions/edge-computing.js`, `functions/send-email.js`
- **Testing**: `tests/playwright/`, `tests/vitest/`

---
**Summary:**
Ship minimal JS, optimize everything, enforce accessibility, and follow strict content/type/test conventions. Reference this file and the README for all project-specific rules.
