# Design Best Practices

Opinionated, performance-focused guidance for evolving the visual & interaction layer of `blakeoxford.com` while honoring project constraints (Astro SSG, Tailwind v4, no ad‑hoc CSS bloat, accessibility + speed first).

---

## 1. Core Principles

- Ship intent, not pixels: favor semantic tokens (spacing, color, typography) over hard values.
- Zero-layout shift: avoid late-loading fonts, images without dimensions, or DOM reflows caused by JS.
- Progressive enhancement: core content & navigation usable with CSS off / JS off.
- Accessibility is non‑negotiable: color contrast, focus visibility, reduced motion, keyboard reach.
- Minimize client JS: prefer static/SSR HTML + CSS; hydrate only interactive islands.
- Consistency via tokens + utilities; avoid bespoke component CSS unless reusable.

## 2. Design Tokens (Source of Truth)

**Single source:** `src/styles/theme.css`

| Step | Where | What |
|------|--------|------|
| 1. Values | `:root` custom properties | OKLCH colors, radius, shadows, motion, fonts, z-index, layout chrome |
| 2. Dark remap | `&[data-theme='dark']`, `&.dark` | Semantic tokens flip (`--color-background`, `--color-foreground`, emphasis, glass, etc.) |
| 3. Tailwind bridge | `@theme inline` | Exposes utilities (`bg-surface`, `text-accent-emphasis`, `shadow-overlay`, `duration-normal`, `z-nav`) |
| 4. Build | `@tailwindcss/vite` in `astro.config.mjs` | Resolves `@import "tailwindcss"` from `global.css` |

`tailwind.config.ts` is **not** the color map. It only keeps plugins (`typography`, `container-queries`), container padding, and a few custom screens.

### Architecture features in use

- **CSS-first Tailwind v4** — tokens in CSS, not a large JS theme object
- **Semantic dark remapping** — prefer `bg-surface` over `dark:bg-*` pairs
- **OKLCH + `color-mix()`** — perceptual brand colors and theme-aware subtles (`--color-accent-subtle`)
- **Always-dark helpers** — `overlay-scrim`, `code-surface` / `code-foreground` for scrims and code samples (not remapped)
- **Cascade layers** — base styles in `@layer base`; shared chrome in `@layer components`

### Token categories (actual)

| Category | Examples | Utilities |
|----------|----------|-----------|
| Color | `--color-accent`, `--color-surface`, `--color-muted-foreground` | `bg-accent`, `text-muted-foreground` |
| Emphasis | `--color-accent-emphasis`, `--color-error-emphasis` | `text-accent-emphasis` |
| Subtle washes | `--color-accent-subtle` via `color-mix` | `bg-accent-subtle` |
| Overlay / code | `--color-overlay-scrim`, `--color-code-surface` | `bg-overlay-scrim`, `bg-code-surface` |
| Typography | `--font-sans`, `--font-heading`, `--text-xxs`, `--tracking-label` | `font-heading`, `text-xxs` |
| Radius | `--radius` … `--radius-2xl` | `rounded`, `rounded-xl` |
| Shadows | `--shadow-sm` … `--shadow-2xl`, `--shadow-overlay` | `shadow-md`, `shadow-overlay` |
| Motion | `--duration-fast` … `--duration-slow` | `duration-fast`, `duration-moderate` |
| Z-index | `--z-nav`, `--z-chat`, `--z-search` | `z-nav`, `z-chat` |
| Layout | `--container-padding*`, `--layout-max-2xl`, `--nav-height` | `container`, `max-w-container-2xl` |

There is **no** `--fs-*` / `--space-*` / `--fw-*` custom scale — use Tailwind’s type and spacing scales plus the tokens above.

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

## 3. Responsive Design Strategy

### 3.1 Modern Container Queries (2026)

**Component-based responsive design** - Components adapt to their container width, not the viewport.

#### Plugin Support
- `@tailwindcss/container-queries` (already installed)
- Excellent browser support: Chrome 106+, Safari 16+, Firefox 110+

#### Usage Patterns

**Container Wrapper**:
```astro
<div class="@container">
  <Card>
    <!-- Card adapts to container width -->
  </Card>
</div>
```

**Container Query Modifiers**:
- `@sm:` - 384px container width
- `@md:` - 448px container width
- `@lg:` - 512px container width
- `@xl:` - 576px container width
- `@2xl:` - 672px container width
- `@3xl:` - 768px container width

**Practical Examples**:
```astro
<!-- Responsive spacing -->
<div class="@container p-4 @sm:p-6 @md:p-8">

<!-- Responsive layout -->
<div class="@container flex flex-col @md:flex-row @lg:gap-8">

<!-- Responsive typography -->
<h2 class="@container text-xl @sm:text-2xl @md:text-3xl">

<!-- Responsive visibility -->
<div class="@container hidden @md:block">
```

**Component Integration**:
- **Card**: Supports `containerQuery` prop for opt-in container support
- **FeatureCard**: Built-in container query responsive padding/typography
- **ProjectCard**: Automatic container query spacing adjustments
- **BlogPostCard**: Container-aware typography and spacing

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

### 3.2 Viewport-Based Breakpoints (For Page Layouts)

For page-level layouts that should respond to viewport:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

Use for:
- Global navigation changes
- Page layout shifts
- Footer reorganization
- Header transformations

---

## 4. Color & Contrast

- Maintain WCAG AA contrast for text (≥4.5:1 body, 3:1 large headings). Use existing contrast audit script.
- Avoid using opacity to “disable” elements; prefer semantic state colors.
- Gradients: store as CSS var if reused (`--gradient-primary`), apply with `bg-gradient-to-*` utilities.
- Reserve high-chroma accent sparingly (CTAs, interactive focus) to reinforce visual hierarchy.

### 3.1 Semantic Color Tokens (Policy)

To ensure global theming agility and hardened accessibility, direct Tailwind grayscale utilities for body or heading text (e.g., `text-gray-600/700/800/900` and dark variants) are deprecated. Always express textual color via semantic tokens:

| Intent | Utility Pattern | Backed Token |
|--------|-----------------|--------------|
| Primary text | `text-foreground` | `--color-foreground` |
| Muted / secondary | `text-foreground/80` (or /70) | same + opacity layer |
| Strong emphasis | `text-foreground` with font-weight change | `--color-foreground` |
| Inverse (on dark surface) | `text-foreground` on dark surfaces | `--color-foreground` |
| Surface background | `bg-surface` (theme-aware) | `--color-surface` |
| Accent text | `text-accent-emphasis` (theme-aware) | `--color-accent-emphasis` |
| Page background | `bg-background` (theme-aware) | `--color-background` |
| Border | `border-border` (theme-aware) | `--color-border` |

Rules:

- Never reintroduce raw `text-gray-*` for prose or headings. Exception: temporary experimental component prototypes (remove before merge).
- Prefer opacity suffixes (`/90`, `/80`, `/70`) over inventing new near-identical tokens for hierarchy.
- If a new semantic meaning (e.g., `success`, `warning`) emerges, add a token + Tailwind mapping; do not approximate with a random green/yellow hex.
- Background layers should use `background` (page), `surface` (cards/sections), and `surface-subtle` instead of arbitrary gray steps.
- Contrast drift monitoring is enforced via the Playwright contrast spec with a non-failing sentinel (see `tests/playwright/accessibility/contrast-ratio.spec.ts`).

Migration Guidance:

1. Replace `text-gray-*` with `text-foreground` plus optional opacity.
2. Replace `dark:text-gray-*` with `text-muted-foreground` or `text-subtle-foreground`.
3. Replace gray backgrounds (`bg-gray-50`, `dark:bg-gray-800`) with `bg-surface` or `bg-background` (theme-aware — no `dark:` pair needed).
4. Adjust perceived hierarchy with weight/size/spacing first; only then apply an opacity tweak if required.

Review Process:

- PRs adding prohibited utilities should fail design lint once a rule is added (planned enhancement).
- During code review, flag any raw hex / gray utilities touching text contexts.

Rationale:

- Centralized control allows global color palette evolution (e.g., shifting hue or luminance) without multi-file refactors.
- Reduces risk of subtle contrast regressions when balancing light/dark palettes.
- Enables future algorithmic theme adjustments (e.g., adaptive contrast in high-ambient-light conditions) by editing tokens only.

### 3.2 Dynamic Contrast Monitoring

Nightly CI randomly augments the fixed contrast audit route set with sampled project & blog pages (script: `scripts/quality/contrast-route-rotator.js`). These are injected through the `CONTRAST_EXTRA_ROUTES` env var consumed by the Playwright contrast spec. A sentinel captures “near miss” ratios within a configurable band (`CONTRAST_SENTINEL_BAND`, default +0.10 over the WCAG AA threshold) to flag drift early without red builds. Trend data accumulates in `contrast-history.json` (with 7‑day rolling average + slope fields) and is visualized via `badges/contrast.svg` (now includes rolling overlay + slope arrow). Optional slope gating via `CONTRAST_SLOPE_ALERT` can escalate accelerating regression before counts breach absolute threshold.

Designer / reviewer action: If sentinel counts rise or badge slope trends upward for borderline elements, prefer adjusting token luminance (single-point change) over ad-hoc per-component overrides.

## 4. Typography

- Pair semantic HTML with Tailwind type utilities (`text-sm` … `text-5xl`) plus `font-heading` / `font-sans`
- Use `text-xxs`, `tracking-label`, and `tracking-smallcaps` for labels/meta
- Limit heading weight variance (h1–h2 bold, h3–h4 semibold, body normal/medium)
- Constrain prose width (~60–75ch) using container / max-width utilities
- Prevent FOIT/FOUT: self-host via `@fontsource` in `BaseLayout.astro` with `font-display: swap`
- Test typography at mobile (375px) and desktop (1440px)

## 5. Spacing & Layout Rhythm

- Use a 4/8-based scale; avoid one-off pixel values.
- Apply consistent section padding wrappers; keep vertical rhythm multiples aligned.
- Choose appropriate max width by context (marketing vs. reading).
- Use grid utilities & gap tokens; avoid manual percentage widths.

## 6. Component Composition

- Favor headless structure + Tailwind utilities.
- Promote repeated patterns (buttons, badges) into variants/components after 3+ uses.
- Migrate legacy global blocks into component scope incrementally.
- Avoid deep descendant selectors; keep specificity flat.

## 7. Interaction & Motion

- Respect `prefers-reduced-motion` (no essential information conveyed only via motion)
- Use semantic duration tokens: `duration-fast` (100ms), `duration-normal` (200ms), `duration-moderate` (300ms), `duration-slow` (500ms)
- Use semantic easing: `ease-standard`, `ease-emphasized`, `ease-decelerate`
- Prefer transform/opacity for performance; avoid layout-affecting animations
- Always provide a visible focus ring (never remove outline without replacement)
- Use `--focus-ring-width` and `--focus-ring-offset` tokens for consistency
- Prefer `.focus-ring-interactive` for shared chrome controls
- Prefer `shadow-overlay` for modal panels instead of arbitrary `shadow-[…]` rgba values
- Apply interactive state overlays using `--hover-overlay` and `--active-overlay` tokens

### 7.1 View Transitions (Astro)

Native smooth page transitions using Astro's built-in View Transitions API:

- **Implementation**: `<ViewTransitions />` in BaseLayout.astro
- **Persistence**: Use `transition:persist` for elements that stay across pages (nav, footer, chat)
- **Animation**: Use `transition:animate="slide|fade"` for content areas
- **Benefits**: Premium SPA-like UX without JavaScript bundle cost
- **Browser Support**: Chrome 111+, Safari 18+, Firefox (in development)

**Guidelines**:
- Persist shared UI elements (navigation, footer, widgets)
- Animate main content areas for smooth transitions
- Test across different page types (blog, projects, contact)
- Respect `prefers-reduced-motion` (Astro handles automatically)

## 8. Accessibility Integration

- Minimum interactive size ≥44x44px (mobile & touch contexts).
- Use semantic elements first; supplement with ARIA where needed.

### 8.1 Modern :has() Selector Patterns

Parent state styling based on child conditions eliminates JavaScript for common patterns:

**Form Validation**:
```css
.form-group:has(input:invalid:not(:placeholder-shown)) {
  border-inline-start: 3px solid var(--color-error);
}

.form-group:has(input:valid:not(:placeholder-shown)) {
  border-inline-start: 3px solid var(--color-success);
}
```

**Card Selection**:
```css
.card:has(input[type="checkbox"]:checked) {
  background: var(--color-primary-subtle);
  border-color: var(--color-primary);
}
```

**Navigation State**:
```css
nav:has(a[aria-current="page"]) {
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

## 9. Media & Imagery

- Include width/height (prevents CLS) and responsive sources (`<picture>` or `srcset`).
- Serve AVIF/WebP with fallbacks; rely on pipeline optimization scripts.
- Lazy-load non-critical images (`loading="lazy"`).
- Provide meaningful alt text or empty alt for decorative imagery.

## 10. Performance & Delivery

- Avoid global high-specificity selectors; maximize purge efficiency.
- Defer or hydrate only critical interactive islands.
- Keep critical CSS minimal (automation handles inlining).
- Limit custom classes; lean on utilities & tokens.

## 11. Theming & Mode Strategy

- Single `.dark` class toggle at root; no nested theme scopes.
- Derive user preference via `prefers-color-scheme`; persist after first paint.
- Let tokens drive differences—avoid duplicating structural markup/styles for dark mode.

## 12. Content Formatting

- Use `prose` for markdown; override only essential elements.
- Enforce line length restrictions for readability.
- Use spacing & weight for hierarchy (not color alone).

## 13. Iconography

- Standardize on one icon set; size consistently (`w-5 h-5`).
- Apply styling via utilities directly on the `<svg>`; avoid inline styles.

## 14. Audit & Maintenance

- Quarterly prune unused tokens; consolidate near-duplicates.
- Run contrast & performance audits after major UI changes.
- Watch bundle reports for emergent CSS bloat.

## 15. Extension Patterns

- Add token → map in Tailwind → use via utility (no raw values in components).
- Introduce semantic variants only after proven reuse.
- Build small recipes (utility clusters) before promoting to full components.

## 16. Anti‑Patterns to Avoid

- Deep descendant selectors or chaining.
- Excess `!important` usage (temporary TODOs only).
- Arbitrary pixel values where a token exists.
- Duplicated gradient/color hex values.
- Mixing inline styles with overlapping utility classes.

## 17. Quick Reference Checklist

- [ ] Semantic tokens used (no stray hex)
- [ ] Heading order logical
- [ ] Images dimensioned & lazy below fold
- [ ] Interactive targets ≥44x44
- [ ] Focus outline visible + high contrast
- [ ] Dark mode contrast verified
- [ ] No unnecessary custom CSS
- [ ] Performance budget unaffected

---

## 18. @property Custom Properties (2026)

### What They Are

CSS Houdini `@property` declarations enable **type-safe, animatable custom properties** with browser validation and better performance.

### Registered Properties

Defined at the top of `theme.css`:

```css
@property --color-primary {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(0.55 0.22 264);
}

@property --gradient-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@property --scale-factor {
  syntax: "<number>";
  inherits: false;
  initial-value: 1;
}
```

### Use Cases

#### 1. Smooth Color Transitions
```css
.button {
  background: var(--color-primary);
  transition: --color-primary 0.3s ease;
}
.button:hover {
  --color-primary: oklch(0.6 0.24 264);
  /* Smoothly animates the color change! */
}
```

#### 2. Rotating Gradients
```css
.gradient-card {
  background: linear-gradient(var(--gradient-angle), 
    var(--color-primary), 
    var(--color-accent));
  animation: rotate-gradient 3s linear infinite;
}

@keyframes rotate-gradient {
  to { --gradient-angle: 360deg; }
}
```

#### 3. Interactive Transforms
```css
.scale-card {
  transform: scale(var(--scale-factor));
  transition: --scale-factor 0.2s ease-out;
}
.scale-card:hover {
  --scale-factor: 1.05;
}
```

### Browser Support
- Chrome 85+ ✅
- Safari 16.4+ ✅
- Firefox 128+ ✅
- ~92% global coverage

### Guidelines
- Use for **animated** properties only (color, angle, number, length)
- Set `inherits: true` for theme tokens, `false` for component-specific
- Always provide `initial-value` for fallback
- Keep syntax type strict (`<color>`, `<angle>`, not `*`)

---

## 19. Enhanced Focus Indicators (WCAG AAA)

### Philosophy

Focus indicators must be **immediately visible** to keyboard users with:
- High contrast against all backgrounds
- Sufficient size (3px minimum)
- Clear offset from element
- Shadow for depth perception

### Default Enhanced Focus

```css
:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 3px;
  box-shadow: 0 0 0 6px color-mix(in oklch, var(--color-primary) 15%, transparent);
  border-radius: var(--radius-sm, 0.25rem);
}
```

**Features**:
- 3px solid outline (WCAG AAA)
- 3px offset for breathing room
- 6px shadow for visibility on any background
- Rounded corners for visual polish

### Dark Mode Adaptation

```css
:root.dark :focus-visible {
  outline-color: var(--color-accent);
  box-shadow: 0 0 0 6px color-mix(in oklch, var(--color-accent) 20%, transparent);
}
```

Uses accent color (cyan) for better contrast in dark mode.

### Element-Specific Patterns

#### Buttons
```css
button:focus-visible {
  outline-width: 3px;
  outline-offset: 2px;
  /* Tighter offset for compact elements */
}
```

#### Links
```css
a:focus-visible {
  outline-width: 2px;
  outline-offset: 3px;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}
```

#### Form Inputs
```css
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline-width: 2px;
  outline-offset: 0;
  box-shadow: 0 0 0 4px color-mix(in oklch, var(--color-primary) 20%, transparent);
}
```

### Skip Links

**Multiple skip links** for comprehensive navigation:

```astro
<SkipLink href="#main-content" text="Skip to main content" />
<SkipLink href="#footer" text="Skip to footer" />
<a href="#top">Back to top</a>
```

**Visual on Focus**:
- Position: absolute, top-left
- Z-index: 50 (above all content)
- High contrast background (accent color)
- Large padding (px-4 py-2)
- Clear shadow and ring

### Testing Focus Indicators

**Manual Test**:
1. Press Tab repeatedly from page top
2. Verify focus visible on every interactive element
3. Check contrast in both light/dark modes
4. Test on complex backgrounds (images, gradients)

**Automated Test**:
```typescript
test('focus indicators visible', async ({ page }) => {
  await page.goto('/');
  
  // Tab through elements
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus-visible');
    await expect(focused).toBeVisible();
    
    // Verify outline exists
    const outline = await focused.evaluate(el => 
      getComputedStyle(el).outlineWidth
    );
    expect(parseInt(outline)).toBeGreaterThan(0);
  }
});
```

### Accessibility Compliance

✅ **WCAG 2.4.7 Focus Visible (Level AA)**: All interactive elements have visible focus  
✅ **WCAG 2.4.11 Focus Not Obscured (Level AAA)**: Focus indicators not hidden by other content  
✅ **WCAG 1.4.11 Non-text Contrast (Level AA)**: 3:1 contrast ratio for UI components  

---

## 20. Keyboard Navigation & Documentation

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

## 21. Future Opportunities

- Automated lint for raw hex & arbitrary spacing.
- Visual regression gating on critical components.
- System font stack fallback automation.
- ARIA audit tooling integration
- Advanced @property animations (theme transitions)

Align design changes with these practices to keep the interface cohesive, fast, and maintainable.
