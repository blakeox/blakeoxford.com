# Tailwind CSS v4 Compatibility Plan

Goal: Maximize compatibility, consistency, and usage of Tailwind v4 across the site while keeping JS minimal, accessibility strong, and performance budgets green.

## Scope

- Audit: classes, plugins, content globs, and safelist usage.
- Config: converge on a single `tailwind.config.ts` with explicit content paths and tokens from CSS variables.
- Styles: remove legacy CSS utility files now replaced by Tailwind v4 features.
- Components: normalize class usage (prefer `gap-*`, `space-*`, logical properties, `container-queries`).
- Build: ensure PostCSS and Astro integrations use `@tailwindcss/postcss` and pass on CI.

## Checklist

- [ ] Confirm Tailwind v4 packages and versions
- [ ] Use `tailwind.config.ts` only (remove JS duplication)
- [ ] Ensure `postcss.config.cjs` includes `@tailwindcss/postcss`
- [ ] Confirm content globs cover `src/**/*.{astro,mdx,tsx,ts,jsx,js}`
- [ ] Audit safelist and prune to minimal required
- [ ] Replace any custom CSS util classes with Tailwind equivalents
- [ ] Validate typography/container-queries plugin usage
- [ ] Run `pnpm build` and axe + Lighthouse checks

## Risks

- Class purge regressions if content globs miss paths.
- Breaking changes in plugin APIs or theme keys.

## Validation

- Lint, typecheck, unit tests
- Playwright essential e2e (`@essential`)
- Perf budget script
