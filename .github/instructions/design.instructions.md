---
description: Design system and visual standards for Blake Oxford's Portfolio
applyTo: '**/*.{astro,tsx,css}'
---

# Design System Instructions

These guidelines apply when creating or modifying visual components, styles, and design patterns.

---

## 1. Design Token System

### Source of truth

All design tokens live in `src/styles/theme.css`:

1. Define values on `:root` (OKLCH colors, radius, shadows, motion, fonts, z-index).
2. Remap semantic tokens under `&[data-theme='dark']` / `&.dark`.
3. Bridge to Tailwind with `@theme inline` in the same file.

Plugins and variants are CSS-first in `src/styles/global.css` (`@plugin "@tailwindcss/typography"`, `@custom-variant`). There is no JS `tailwind.config`.
Tailwind is applied via `@tailwindcss/vite` in `astro.config.mjs` and `@import "tailwindcss"` in `global.css`.
Prefer `bg-accent-subtle` / `text-accent-emphasis` over ad-hoc `bg-accent/10` opacity suffixes when a semantic wash exists.
Compose class lists with `cn()` from `src/utils/cn.ts` in primitives.

### Color tokens

- Brand / semantic: `primary`, `accent`, `success`, `warning`, `error`, `info` (+ light/dark/emphasis/subtle where needed)
- Surfaces: `background`, `surface`, `surface-subtle`, `surface-elevated`, `glass`, `glass-xl`
- Text: `foreground`, `foreground-strong`, `muted-foreground`, `subtle-foreground`
- Always-dark helpers (not remapped): `overlay-scrim`, `code-surface`, `code-foreground`
- **Never** use parallel utilities like `bg-background-dark` or `text-foreground-light` in markup
- Dark mode: prefer remapped semantic utilities — avoid spraying `dark:` color pairs

### Typography

- Fonts: `--font-sans` (Source Sans 3), `--font-heading` (Space Grotesk), `--font-mono`
- Utilities: `font-sans`, `font-heading`, `text-xxs`, `tracking-label`, `tracking-smallcaps`
- Otherwise use Tailwind type scale (`text-sm` … `text-5xl`) — there is no custom `--fs-*` scale

### Spacing, radius, shadows, motion

- Spacing: Tailwind default scale (prefer rem utilities; avoid one-off `px` arbitrary values)
- Radius: `rounded-sm` … `rounded-2xl` from `--radius-*`
- Shadows: `shadow-sm` … `shadow-2xl`, plus `shadow-overlay` for modal panels
- Motion: `duration-fast` (100ms), `duration-normal` (200ms), `duration-moderate` (300ms), `duration-slow` (500ms)
- Easing: `ease-standard`, `ease-emphasized`, `ease-decelerate`

### Token creation policy

- Create a new token only if used ≥3 times or it expresses semantic meaning
- Expose it via `@theme inline` in `theme.css` (not a JS Tailwind config)
- Document purpose on `/design/tokens`

---

## 2. Accessibility Standards

### WCAG AA (non-negotiable)

- Contrast: ≥4.5:1 body text, ≥3:1 large headings
- Run `pnpm audit:contrast` before committing visual changes
- Use dedicated state tokens instead of opacity alone for disabled UI

### Interactive elements

- Visible `:focus-visible` rings (see base styles + `.focus-ring-interactive`)
- Keyboard navigation and proper ARIA on overlays
- Touch targets: `.touch-target` / min 44×44 on coarse pointers

### Motion

- Respect `prefers-reduced-motion` (token durations collapse; chrome animations are gated)
- Prefer transform/opacity; avoid layout-affecting animation for essential info

---

## 3. Component styling

- Prefer composing primitives (`Container`, `Section`, `Button`, `BaseCard`, `Prose`) over bespoke layouts
- Shared multi-selector chrome belongs in `src/styles/components.css`
- Page/feature markup should stay on Tailwind semantic utilities
- Page gutters: `Container` or `.layout-gutter` — not hard-coded `px-4 sm:px-6 lg:px-8`
- Blog/MDX body: wrap with `Prose` — do not scatter long `prose-*:` class strings in pages
- Card grids: prefer `@container` + `@sm:` / `@md:` over viewport `sm:` when the card already sits in a variable-width column
- Run `pnpm design:lint` — bans raw palette, white/black, parallel `*-dark` surface utilities, and hard-coded gutters; also validates `@theme inline` token docs sync

### Tailwind usage

- Map intent to semantic tokens, not gray scales
- Blog/prose: wrap MDX with the `Prose` primitive (typography plugin + semantic token remaps)
- Dark mode strategy is class + `data-theme` with semantic remaps; do not default to `dark:bg-*` pairs
- Reusable cards in grids: `@container` + `@sm:` / `@md:` (see BlogPostCard, EducationCard, ProjectCard)

---

## 4. Responsive design

- Page layouts: viewport breakpoints (`sm` 640 → `2xl` 1440 in this project’s container screens)
- Reusable cards/widgets: prefer `@container` + `@sm:` / `@md:` where already used
- Mobile-first; touch targets ≥44×44px

---

## 5. Testing visual changes

- Contrast: `pnpm audit:contrast`
- Design lint: `pnpm design:lint`
- CSS lint: `pnpm lint:css`
- Accessibility e2e with `@axe-core/playwright`
- Check both light and dark themes

---

## Reference

- `src/styles/theme.css` — tokens + `@theme inline`
- `src/lib/designTokens.ts` — parses public tokens for `/design/tokens` + sync gate
- `src/components/primitives/Prose.astro` — article/MDX typography shell
- `src/styles/components.css` — nav/overlay/hero chrome
- `src/styles/global.css` — entry (`@import "tailwindcss"`, `@plugin`, variants)
- `DESIGN_BEST_PRACTICES.md` — detailed philosophy
- `/design/tokens` — live token reference (auto-lists `@theme inline`)
