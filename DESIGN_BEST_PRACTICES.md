# Design Best Practices

Opinionated, performance-focused guidance for evolving the visual & interaction layer of `blakeoxford.com` while honoring project constraints (Astro SSG, Tailwind v4, no ad‑hoc CSS bloat, accessibility + speed first).

---

## Core Principles

- Ship intent, not pixels: favor semantic tokens (spacing, color, typography) over hard values.
- Minimize measured layout shift: reserve image dimensions, load fonts deliberately, and avoid unnecessary DOM reflows.
- Progressive enhancement: core content & navigation usable with CSS off / JS off.
- Accessibility is non‑negotiable: color contrast, focus visibility, reduced motion, keyboard reach.
- Minimize client JS: prefer static/SSR HTML + CSS; hydrate only interactive islands.
- Consistency via tokens + utilities; avoid bespoke component CSS unless reusable.

## Design Tokens (Source of Truth)

**Single source:** `src/styles/theme.css`

| Step               | Where                                     | What                                                                                                                                                                                                                         |
| ------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Values          | `:root` custom properties                 | OKLCH colors, radius, shadows, motion, fonts, z-index, layout chrome                                                                                                                                                         |
| 2. Dark remap      | `&[data-theme='dark']`, `&.dark`          | Semantic tokens flip (`--color-background`, `--color-foreground`, emphasis, glass, etc.)                                                                                                                                     |
| 3. Tailwind bridge | `@theme inline`                           | Exposes utilities (`bg-surface`, `text-accent-emphasis`, `shadow-overlay`, `duration-normal`, `z-nav`). Z-index tokens use the `--z-index-*` namespace so utilities become `z-nav`, `z-chat`, `z-chat-launcher`, `z-search`. |
| 4. Build           | `@tailwindcss/vite` in `astro.config.mjs` | Resolves `@import "tailwindcss"` from `global.css`                                                                                                                                                                           |

`global.css` loads Tailwind and `@plugin "@tailwindcss/typography"`. There is no JS `tailwind.config` — tokens, variants, and utilities are CSS-first.

### Architecture features in use

- **CSS-first Tailwind v4** — tokens in CSS, not a large JS theme object
- **Semantic dark remapping** — prefer `bg-surface` over `dark:bg-*` pairs
- **OKLCH + `color-mix()`** — perceptual brand colors and theme-aware subtles (`--color-accent-subtle`)
- **Always-dark helpers** — `overlay-scrim`, `code-surface` / `code-foreground` for scrims and code samples (not remapped)
- **Cascade layers** — base styles in `@layer base`; shared chrome in `@layer components`
- **Class composer** — `cn()` in `src/utils/cn.ts` for primitives (no `tailwind-merge`; keep variants controlled — do not add merge without an ADR)

### Token categories (actual)

| Category       | Examples                                                          | Utilities                                                |
| -------------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| Color          | `--color-accent`, `--color-surface`, `--color-muted-foreground`   | `bg-accent`, `text-muted-foreground`                     |
| Emphasis       | `--color-accent-emphasis`, `--color-error-emphasis`               | `text-accent-emphasis`                                   |
| Subtle washes  | `--color-accent-subtle` via `color-mix`                           | `bg-accent-subtle` (prefer over `bg-accent/10`)          |
| Overlay / code | `--color-overlay-scrim`, `--color-code-surface`                   | `bg-overlay-scrim`, `bg-code-surface`                    |
| Typography     | `--font-sans`, `--font-heading`, `--text-xxs`, `--tracking-label` | `font-heading`, `text-xxs`                               |
| Heading ladder | `src/lib/typeScale.ts` (identity → subtitle)                      | Used by `IntroCopy` / `SectionHeading`                   |
| Section rhythm | `--space-section-sm` … `--space-section-2xl`                      | `py-section-sm` … `py-section-2xl` via `Section`         |
| Radius         | `--radius` … `--radius-2xl`                                       | `rounded`, `rounded-xl`                                  |
| Shadows        | `--shadow-sm` … `--shadow-2xl`, `--shadow-overlay`                | `shadow-md`, `shadow-overlay`                            |
| Motion         | `--duration-instant` … `--duration-slow`                          | `duration-normal`, `duration-moderate`                   |
| Z-index        | `--z-nav`, `--z-chat`, `--z-chat-launcher`, `--z-search`          | `z-nav`, `z-chat`, `z-chat-launcher`, `z-search`         |
| Layout         | `--container-padding*`, `--layout-max-2xl`, `--nav-height`        | `layout-gutter` (via `Container`), `max-w-container-2xl` |

Page gutters: prefer `Container` or the `.layout-gutter` class. Do not hard-code responsive padding ladders (`px-4 sm:px-6 lg:px-8`, `px-4 md:px-6 lg:px-12`, etc.) — `design:lint` rejects those patterns on app surfaces.

Article/MDX body: wrap with `Prose` (`src/components/primitives/Prose.astro`). Token remaps for typography live in `@utility prose` in `global.css`. Do not nest extra `prose` shells inside MDX.

**MDX elevation policy:** `design:lint` bans `shadow-xl` / `shadow-2xl`, arbitrary `shadow-[…]` / `rounded-[…]`, and raw white/black utilities in `src/content/blog`. Prefer ≤ `shadow-lg`, token radii, and semantic surfaces (`bg-on-dark/20`, `FeatureCard`, etc.).

Live token docs at `/design/tokens` auto-list public utilities by parsing `@theme inline` via `src/lib/designTokens.ts`, and show browser-resolved values plus live WCAG contrast pairs.

Heading sizes: use the shared ladder in `src/lib/typeScale.ts` (`identity` → `hero` → `display` → `section` → `title` → `subtitle`) via `IntroCopy` / `SectionHeading` / `headingSizeClass()`. Section vertical padding uses `--space-section-*` / `py-section-*`. Prefer Tailwind’s default spacing scale for local gaps and padding.

`design:lint` also enforces: no decorative blur orbs outside `PageHero`’s opt-in; no `BadgePill` imports (use `Badge variant="pill"`; the wrapper file is removed); no DIY elevated card shells when `BaseCard` is available; no ad-hoc `font-heading` + `text-2xl+` ladders outside the typeScale allowlist.

### Guidelines

- Introduce a new token only if used ≥3 times or it carries semantic meaning
- Never hardcode hex in components; edit `theme.css` and bridge with `@theme inline`
- Do not export parallel `*-dark` surface utilities for markup — keep those values private for remapping
- Prefer logical properties (`border-inline-start`) where directionality matters
- Always verify light and dark themes

### Color system benefits

**OKLCH**: perceptually uniform adjustments, predictable lightness, wide-gamut ready.

**`color-mix()`**: theme-aware subtle washes without `dark:` overrides.

**Remap-first dark mode**: one utility, two themes.

## Responsive Design Strategy

### Modern Container Queries (2026)

**Component-based responsive design** - Components adapt to their container width, not the viewport.

#### Built-in Tailwind v4 support

- Container queries ship with Tailwind v4 (`@container`, `@sm:` … `@7xl:`)
- Excellent browser support: Chrome 106+, Safari 16+, Firefox 110+

#### Usage Patterns

**Container Wrapper**:

```astro
<div class="@container">
  <Card><!-- Card adapts to container width --></Card>
</div>
```

**Container Query Modifiers** (from Tailwind `--container-*`):

- `@sm:` - 24rem (384px)
- `@md:` - 28rem (448px)
- `@lg:` - 32rem (512px)
- `@xl:` - 36rem (576px)
- `@2xl:` - 42rem (672px)
- `@3xl:` - 48rem (768px)

**Practical Examples**:

```astro
<!-- Responsive spacing -->
<div class="@container p-4 @sm:p-6 @md:p-8">
  <!-- Responsive layout -->
  <div class="@container flex flex-col @md:flex-row @lg:gap-8">
    <!-- Responsive typography -->
    <h2 class="@container text-xl @sm:text-2xl @md:text-3xl">
      <!-- Responsive visibility -->
      <div class="@container hidden @md:block"></div>
    </h2>
  </div>
</div>
```

**Component Integration**:

- **BaseCard**: Add `@container` on the card (or parent) when using `@sm:` / `@md:` inside
- **FeatureCard**: Built-in container query responsive padding/typography
- **ProjectCard**: Automatic container query spacing adjustments
- **BlogPostRow**: Container-aware typography and spacing for blog listings

**Best Practices**:

- Wrap card grids in `@container` for optimal responsiveness
- Use container queries for sidebar widgets
- Prefer container queries over viewport queries for reusable components
- Combine viewport and container queries for hybrid layouts

**Migration Strategy**:

```diff
<!-- Old: Viewport-based -->
- <div class="p-4 sm:p-6 md:p-8">

<!-- New: Container-based -->
+ <div class="@container p-4 @sm:p-6 @md:p-8">
```

---

### Viewport-Based Breakpoints (For Page Layouts)

For page-level layouts that should respond to viewport:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px (Tailwind default; `max-w-container-2xl` is a separate 80rem width token).

Use for:

- Global navigation changes
- Page layout shifts
- Footer reorganization
- Header transformations

---

## Color & Contrast

- Maintain WCAG AA contrast for text (≥4.5:1 body, 3:1 large headings). Use existing contrast audit script.
- Avoid using opacity to “disable” elements; prefer semantic state colors.
- Prefer solid semantic surfaces for structure. Keep any necessary media veil local to its component; do not reference undeclared gradient tokens.
- Reserve high-chroma accent sparingly (CTAs, interactive focus) to reinforce visual hierarchy.

### Semantic Color Tokens (Policy)

To ensure global theming agility and hardened accessibility, direct Tailwind grayscale utilities for body or heading text (e.g., `text-gray-600/700/800/900` and dark variants) are deprecated. Always express textual color via semantic tokens:

| Intent                    | Utility Pattern                           | Backed Token                |
| ------------------------- | ----------------------------------------- | --------------------------- |
| Primary text              | `text-foreground`                         | `--color-foreground`        |
| Muted / secondary         | `text-muted-foreground`                   | `--color-muted-foreground`  |
| Captions / meta           | `text-subtle-foreground`                  | `--color-subtle-foreground` |
| Strong emphasis           | `text-foreground` with font-weight change | `--color-foreground`        |
| Inverse (on dark surface) | `text-foreground` on dark surfaces        | `--color-foreground`        |
| Surface background        | `bg-surface` (theme-aware)                | `--color-surface`           |
| Accent text               | `text-accent-emphasis` (theme-aware)      | `--color-accent-emphasis`   |
| Page background           | `bg-background` (theme-aware)             | `--color-background`        |
| Border                    | `border-border` (theme-aware)             | `--color-border`            |

Rules:

- Never reintroduce raw `text-gray-*` for prose or headings. Exception: temporary experimental component prototypes (remove before merge).
- Prefer `text-muted-foreground` and `text-subtle-foreground` over opacity suffixes (`/80`, `/70`) on `text-foreground`. Opacity-only hierarchy fails WCAG on dark surfaces.
- If a new semantic meaning (e.g., `success`, `warning`) emerges, add a token + Tailwind mapping; do not approximate with a random green/yellow hex.
- Background layers should use `background` (page), `surface` (cards/sections), and `surface-subtle` instead of arbitrary gray steps.
- Contrast drift monitoring is enforced via the Playwright contrast spec with a non-failing sentinel (see `tests/playwright/accessibility/contrast-ratio.spec.ts`).

Migration Guidance:

1. Replace `text-gray-*` with `text-foreground`, `text-muted-foreground`, or `text-subtle-foreground` according to meaning.
2. Replace `dark:text-gray-*` with `text-muted-foreground` or `text-subtle-foreground`.
3. Replace gray backgrounds (`bg-gray-50`, `dark:bg-gray-800`) with `bg-surface` or `bg-background` (theme-aware — no `dark:` pair needed).
4. Adjust perceived hierarchy with weight, size, spacing, and the appropriate semantic text token.

Review Process:

- The existing design lint rejects prohibited raw palettes and opacity-only text hierarchy.
- During code review, flag any raw hex / gray utilities touching text contexts.

Rationale:

- Centralized control allows global color palette evolution (e.g., shifting hue or luminance) without multi-file refactors.
- Reduces risk of subtle contrast regressions when balancing light/dark palettes.
- Keeps theme adjustments in one maintainable source; validate changes against actual rendered surfaces.

### Dynamic Contrast Monitoring

Nightly CI randomly augments the fixed contrast audit route set with sampled project & blog pages (script: `scripts/quality/contrast-route-rotator.js`). These are injected through the `CONTRAST_EXTRA_ROUTES` env var consumed by the Playwright contrast spec. A sentinel captures “near miss” ratios within a configurable band (`CONTRAST_SENTINEL_BAND`, default +0.10 over the WCAG AA threshold) to flag drift early without red builds. Trend data accumulates in `contrast-history.json` (with 7‑day rolling average + slope fields) and is visualized via `badges/contrast.svg` (now includes rolling overlay + slope arrow). Optional slope gating via `CONTRAST_SLOPE_ALERT` can escalate accelerating regression before counts breach absolute threshold.

Designer / reviewer action: If sentinel counts rise or badge slope trends upward for borderline elements, prefer adjusting token luminance (single-point change) over ad-hoc per-component overrides.

## Typography

- Pair semantic HTML with Tailwind type utilities (`text-sm` … `text-5xl`) plus `font-heading` / `font-sans`
- Use `text-xxs`, `tracking-label`, and `tracking-smallcaps` for labels/meta
- Limit heading weight variance (h1–h2 bold, h3–h4 semibold, body normal/medium)
- Constrain prose width (~60–75ch) using container / max-width utilities
- Prevent FOIT/FOUT: self-host via `@fontsource` in `BaseLayout.astro` with `font-display: swap`
- Test typography at mobile (375px) and desktop (1440px)

## Spacing & Layout Rhythm

- Use a 4/8-based scale; avoid one-off pixel values.
- Apply consistent section padding wrappers; keep vertical rhythm multiples aligned.
- Choose appropriate max width by context (marketing vs. reading).
- Use grid utilities & gap tokens; avoid manual percentage widths.

### Site layout rules

- Shared navigation and wide sections use the 80rem `--layout-max-2xl` ceiling.
- `.layout-gutter` uses a fluid gutter from 1.25rem to 3rem; do not add breakpoint-specific page gutters.
- Split interior heroes use `.editorial-hero-grid` with a 36rem desktop minimum. Keep single-column introductions content-sized; reserve the larger identity treatment for home.
- Article bodies use the `md` container. Archive titles use the `title` type step; page introductions use `hero`.
- Project cards use one bordered surface with a quiet hover border. Results sit above a divider; avoid empty metric panels or lifting the entire card on hover.
- Use solid semantic surfaces for page and closing bands. Reserve shadows for elevated controls and overlays.

### Reading and photography

- The About introduction uses three static, captioned photographs with responsive image sources. Use the tower portrait as the full-pose anchor, with Detroit and speaking photographs as smaller supporting images. Preserve the tower photograph’s 3:4 frame; verify rendered crops after image processing.
- Case studies use section rails on wide screens and a single reading column on small screens. Do not repeat the hero summary immediately under Overview.
- A media-free article still uses the shared outer shell; give long titles enough measure to avoid a narrow tower of text.
- Writing leads with the newest published essay, whether it has an image or not. Show each essay once; omit an empty archive below a single lead essay.
- Author informative article photographs with `heroImageAlt`. Decorative linked previews use empty alternatives; avoid repeating a neighboring title as a photograph description.
- Prose colors are owned by typography variables, including contextual `text-on-accent` surfaces. Do not force foreground colors on every paragraph or strong element; that overrides the surrounding surface's readable text color.
- The phone Ask sheet is modal with focus containment and a scroll lock. The desktop companion remains nonmodal. Closing either must preserve keyboard continuity.
- A confirmed contact delivery replaces the editable form with a focused confirmation. A failed request preserves the draft and gives an actionable recovery path.
- Direct contact links name their action (email, call, or profile). Keep the visible text in the accessible name and associate longer context with `aria-describedby`.

## Component Composition

- Favor headless structure + Tailwind utilities.
- Promote repeated patterns (buttons, badges) into variants/components after 3+ uses.
- Prefer composing from `BaseCard` / `FeatureCard` over inline card markup.
- Prefer utilities & tokens; shared chrome in `components.css` over new scoped style islands.

## Interaction & Motion

- Respect `prefers-reduced-motion` (no essential information conveyed only via motion)
- Use semantic duration tokens: `duration-instant` (100ms), `duration-normal` (200ms; `--duration-fast` is the backing token), `duration-moderate` (300ms), `duration-slow` (500ms)
- Use semantic easing: `ease-standard`, `ease-emphasized`, `ease-decelerate`
- Prefer transform/opacity for performance; avoid layout-affecting animations
- Always provide a visible focus ring (never remove outline without replacement)
- Use `--focus-ring-width` and `--focus-ring-offset` tokens for consistency
- Prefer `.focus-ring-interactive` for shared chrome controls
- Prefer `shadow-overlay` for modal panels instead of arbitrary `shadow-[…]` rgba values
- Use the actual recipe hover/active states in `src/lib/design-system/recipes.ts`; do not reference undeclared overlay tokens.

### Document navigation and progressive enhancement

The current `BaseLayout.astro` uses normal document navigation. It contains transition attributes but does not mount an Astro client router, so do not assume SPA persistence or animated page transitions are active.

- Keep navigation and contact markup usable before island hydration.
- Validate keyboard focus and theme preference across full navigations.
- Do not introduce a client router solely for visual polish; it adds lifecycle and focus-management work.
- Respect reduced-motion preferences in all actual component animation.

## Accessibility Integration

- Minimum interactive size ≥44x44px (mobile & touch contexts).
- Use semantic elements first; supplement with ARIA where needed.

### Modern :has() Selector Patterns

Parent state styling based on child conditions eliminates JavaScript for common patterns:

**Form validation**:

Drive visible validation from the field's explicit `aria-invalid` state and associated error text after blur or submission. Do not style a group from native `:invalid` while the user is still typing; it can contradict the announced state and shift the control geometry. Successful fields do not need a green border.

**Card Selection**:

```css
.card:has(input[type='checkbox']:checked) {
  background: var(--color-primary-subtle);
  border-color: var(--color-primary);
}
```

**Navigation State**:

```css
nav:has(a[aria-current='page']) {
  border-block-end: 2px solid var(--color-accent);
}
```

**Focus Within**:

```css
.container:has(:focus-visible) {
  outline: 2px solid var(--focus-ring-color);
  outline-offset: 2px;
}
```

**Error Indicators**:

```css
section:has(.error)::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  inline-size: 4px;
  background: var(--color-error);
}
```

**Benefits**:

- No JavaScript for parent state changes
- Better performance
- Cleaner code architecture
- Excellent browser support (Chrome 105+, Safari 15.4+, Firefox 121+)

**Guidelines**:

- Use for parent-child state relationships
- Combine with logical properties for i18n
- Test in all supported browsers
- Provide fallback styling if needed
- Maintain parity across light/dark themes—audit both backgrounds.
- Skip link + logical heading order (no level skipping for visual style).

## Media & Imagery

- Include width/height (prevents CLS) and responsive sources (`<picture>` or `srcset`).
- Serve AVIF/WebP with fallbacks; rely on pipeline optimization scripts.
- Lazy-load non-critical images (`loading="lazy"`).
- Provide meaningful alt text or empty alt for decorative imagery.

## Performance & Delivery

- Avoid global high-specificity selectors; maximize purge efficiency.
- Defer or hydrate only critical interactive islands.
- Keep critical CSS minimal (automation handles inlining).
- Limit custom classes; lean on utilities & tokens.

## Theming & Mode Strategy

- Derive user preference via `prefers-color-scheme`; persist after first paint.
- Let tokens drive differences—avoid duplicating structural markup/styles for dark mode.

### Dual signaling: `.dark` + `data-theme` (intentional)

`src/lib/theme.ts` writes **both** signals to `<html>` on every theme change, and each has a distinct job:

| Signal                           | Consumer                                                                                      | Why it exists                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `data-theme="dark"` \| `"light"` | CSS token remap in `theme.css` (`:root[data-theme='dark']`) and SSR/FOUC cookie               | Source of truth for semantic token flips; readable server-side   |
| `.dark` class                    | Tailwind's `dark:` variant (`@custom-variant dark (&:where(.dark, .dark *))` in `global.css`) | Lets the few unavoidable `dark:*` utilities resolve              |
| `data-theme-preference`          | Theme-toggle icon state (sun/moon/system)                                                     | Tracks the _preference_ (incl. `system`), not the resolved theme |

Rules:

- Prefer remapped semantic utilities (`bg-surface`, `text-foreground`) — they need neither signal in markup.
- If you must branch, rely on the token remap (driven by `data-theme`), not `dark:*` pairs.
- Never write only one of the two signals by hand; go through `applyTheme()` / `setThemePreference()` in `theme.ts` so both stay in sync.
- `color-scheme` is also set on the root element for native form/scrollbar theming.

### Overlay visibility contract

- Overlays (`OverlayShell` → `.overlay-root`, mobile menu, backdrop, `ChatDock`) toggle visibility via `data-state="open" | "closed"` and Tailwind display utilities (`flex`/`block` vs `hidden`), not inline `display`/`visibility` styles.
- Search/command center: `OverlayShell` owns the contract; Command Center only adds `command-center` chrome classes.
- Mobile menu: CSS keys off `[data-state='open']`. The burger still uses `.active` for the icon morph only.
- Ask companion: `ChatDock` uses the same `data-state` + `block`/`hidden` pattern; shared strings live in `src/features/chat/chatStyles.ts`.
- The only remaining `!important` in `components.css` lives in `prefers-reduced-motion` blocks, where forcibly killing motion is the intended, accessible behavior.

## Content Formatting

- Use `prose` for markdown; override only essential elements.
- Enforce line length restrictions for readability.
- Use spacing & weight for hierarchy (not color alone).

## Iconography

- Standardize on one icon set; size consistently (`w-5 h-5`).
- Apply styling via utilities directly on the `<svg>`; avoid inline styles.

## Audit & Maintenance

- Quarterly prune unused tokens; consolidate near-duplicates.
- Run contrast & performance audits after major UI changes.
- Watch bundle reports for emergent CSS bloat.

## Extension Patterns

- Add token → map in Tailwind → use via utility (no raw values in components).
- Introduce semantic variants only after proven reuse.
- Build small recipes (utility clusters) before promoting to full components.

## Anti‑Patterns to Avoid

- Deep descendant selectors or chaining.
- Excess `!important` usage (temporary TODOs only).
- Arbitrary pixel values where a token exists.
- Duplicated gradient/color hex values.
- Mixing inline styles with overlapping utility classes.

## Quick Reference Checklist

- [ ] Semantic tokens used (no stray hex)
- [ ] Heading order logical
- [ ] Images dimensioned & lazy below fold
- [ ] Interactive targets ≥44x44
- [ ] Focus outline visible + high contrast
- [ ] Dark mode contrast verified
- [ ] No unnecessary custom CSS
- [ ] Performance budget unaffected

---

## @property Custom Properties (optional)

CSS Houdini `@property` can register typed, animatable custom properties. **Not used in `theme.css` today** — tokens rely on normal custom properties + Tailwind utilities. Prefer that path unless you need interpolating a custom property (e.g. animated gradient angle).

If you introduce `@property`, keep it next to the consuming animation in `components.css`, set a strict `syntax`, and always provide `initial-value`.

---

## Focus indicators and verification

The implementation uses `--focus-ring-width`, `--focus-ring-offset`, and `--focus-ring-color` in `theme.css`. Shared chrome uses `.focus-ring-interactive`; fields and buttons use explicit recipe states. Preserve visible outlines or rings when overriding browser defaults.

- Check focus against the actual surrounding surface in both themes. Under forced colors, use the utility-layer system `Highlight` outline in `components.css`; box shadows alone disappear.
- Keep focused targets clear of the sticky navigation and floating assistant.
- Search results use listbox options for navigation. Keep topic filters, Copy, and Ask in a labeled action group outside the listbox so their button semantics remain available to assistive technology. Preserve native modified-click behavior on result links and ordinary text-copy behavior when text is selected. See the [W3C listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).
- Search is modal. Ask is modal below 640px and nonmodal on desktop; test each behavior rather than applying one keyboard expectation everywhere.
- Modal Tab traversal must exclude hidden, inert, and negative-tabindex controls. Let inner controls handle Tab completion first, then cycle eligible controls explicitly; verify Chromium and WebKit.
- Escape must close overlays, restore a usable focus position, and release scroll locks.
- Skip links target the main content, footer, and top; verify the resulting focus and scroll position.
- A ring class, an outline width, or a screenshot alone does not establish WCAG conformance. Record measured contrast, keyboard behavior, assistive-technology coverage, and remaining gaps in the living plan.

## Keyboard Navigation & Documentation

### Keyboard Shortcuts Page

Created comprehensive guide at `/accessibility/keyboard-shortcuts/`:

**Features**:

- All keyboard shortcuts documented by category
- Visual `<kbd>` elements for key representation
- Accessibility features list
- Screen reader landmark documentation
- Contact link for feedback

### Shortcut Categories

1. **Navigation**: Tab, Shift+Tab, Enter, Space, Escape
2. **Skip Links**: Quick jumps to main/footer/top
3. **Search**: Cmd/Ctrl+K to open, arrow keys to navigate
4. **Theme**: Toggle light/dark mode
5. **Chat Widget**: Open/close, send messages
6. **Landmarks**: Screen reader navigation points

### Implementation

Link from footer or about page:

```astro
<a href="/accessibility/keyboard-shortcuts/">Keyboard Shortcuts</a>
```

---

## Continuous improvement

Use [the living design plan](docs/design-improvement-plan.md) for current findings, quality gates, and validation evidence. Existing design lint, visual regression, contrast, and accessibility tests are already present; extend their meaningful coverage instead of listing them as hypothetical future tooling. Add dependencies or animations only when they solve an evidenced problem and their maintenance cost is justified.
