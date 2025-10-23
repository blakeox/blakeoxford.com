---
description: Design system and visual standards for Blake Oxford's Portfolio
applyTo: '**/*.{astro,tsx,css}'
---

# Design System Instructions

These guidelines apply when creating or modifying visual components, styles, and design patterns.

---

## 1. Design Token System

### CSS Variables (Source of Truth)

All design tokens are defined in `src/styles/global.css` and mapped to Tailwind in `tailwind.config.ts`.

**Required Practice**: Always use semantic tokens instead of hardcoded values.

#### Color Tokens
- Use `--color-*` variables: primary, accent, surface, background, foreground, semantic states
- Dark mode: Parallel `--color-*-dark` tokens toggled via `.dark` class
- Text colors: Use semantic tokens (`text-foreground`, `text-foreground/80`) instead of raw Tailwind gray scales
- **Never** hardcode hex colors in components

#### Typography Tokens
- Sizes: `--fs-*` (functional) or `--fs-h1` through `--fs-h6` (semantic)
- Weights: `--fw-*` (normal, medium, semibold, bold)
- Line heights: `--lh-*` (tight, normal, relaxed)
- Letter spacing: `--ls-*`

#### Spacing & Layout
- Spacing scale: `--space-*` mapped to Tailwind spacing extension
- Container widths: `--container-*` for max-widths
- Radius: `--radius-*` for consistent border-radius values

#### Shadows & Effects
- Elevations: `--shadow-*` tokens for depth
- Glass morphism: Pre-defined `--glass-*` variables for surfaces and borders

### Token Creation Policy

- Create new tokens only if used ≥3 times or expressing semantic meaning
- Extend `tailwind.config.ts` to expose tokens to utilities
- Document new tokens with purpose and usage examples

---

## 2. Accessibility Standards

### WCAG AA Compliance (Non-Negotiable)

- **Color Contrast**: Minimum 4.5:1 for body text, 3:1 for large headings
- **Audit Tools**: Run `pnpm audit:contrast` before committing visual changes
- **Semantic State Colors**: Use dedicated state tokens instead of opacity for disabled elements

### Interactive Elements

- All focusable elements require visible focus states
- Keyboard navigation: Tab, Enter, Esc, Arrow keys
- Screen reader support: Proper ARIA attributes and semantic HTML
- Focus management in modals/overlays

### Motion & Animation

- Respect `prefers-reduced-motion` for all animations
- Avoid layout shift: specify dimensions for late-loading content
- Progressive enhancement: ensure core functionality without JavaScript

---

## 3. Component Styling

### Composition Over Configuration

- Prefer composing primitives (`Container`, `Stack`, `Section`) over bespoke layouts
- Avoid boolean prop explosion; use variant patterns instead
- Keep component CSS minimal and reusable

### Tailwind Usage

- Use utility classes mapped to design tokens
- Typography: Wrap Markdown with `prose` classes
- Dark mode: Use `dark:` variants with `class` strategy
- **Avoid**: Custom CSS unless creating reusable tokens

### Design Lint

Run `pnpm design:lint` to catch:
- Raw hex values in components
- Suspicious spacing patterns
- Token drift from standards

---

## 4. Visual Hierarchy

### Layout Principles

- Zero-layout-shift: Specify image dimensions, avoid DOM reflows
- Consistent spacing: Use token scale for margins/padding
- Semantic HTML: `<main>`, `<section>`, `<article>` for structure

### Color & Emphasis

- High-chroma accents: Reserve for CTAs and interactive focus only
- Gradients: Store as CSS variables if reused (`--gradient-primary`)
- Visual weight: Typography weight changes over opacity manipulation

---

## 5. Responsive Design

### Mobile-First Approach

- Base styles for mobile, enhance with breakpoint modifiers
- Test all breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch targets: Minimum 44×44px for interactive elements

### Performance Considerations

- Ship minimal CSS: Remove unused utilities in production
- Critical CSS: Inlined in `BaseLayout.astro`
- Font loading: System fonts first, web fonts with `font-display: swap`

---

## 6. Documentation Requirements

When adding new visual patterns:

1. Document in `DESIGN_BEST_PRACTICES.md` if establishing precedent
2. Add JSDoc comments for component props with visual impact
3. Include accessibility notes for interactive elements
4. Link to related components in composite patterns

---

## 7. Testing Visual Changes

### Required Checks

- Contrast audit: `pnpm audit:contrast`
- Design lint: `pnpm design:lint`
- Cross-browser e2e: `pnpm test:e2e`
- Accessibility: Tests with `@axe-core/playwright`

### Visual Regression

- Essential tests tagged with `@essential`
- Screenshot comparisons in critical user paths
- Test in both light and dark modes

---

## Reference Documents

- `DESIGN_BEST_PRACTICES.md` - Detailed design philosophy and patterns
- `docs/COMPONENT_DOCUMENTATION_GUIDE.md` - Component documentation standards
- `src/styles/global.css` - Design token definitions
- `tailwind.config.ts` - Tailwind integration and extensions
