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

Use CSS variables defined in `theme.css` and mapped through Tailwind in `tailwind.config.ts`:

- Color: `--color-*` groups (primary, accent, surface, background, foreground, semantic states).
- Typography: size (`--fs-*` / semantic `--fs-h1`…), weight (`--fw-*`), line-height (`--lh-*`), letter-spacing (`--ls-*`).
- Spacing: `--space-*` scales mapped to `spacing` extension (e.g., `18`, `22`).
- Radius: `--radius-*` -> borderRadius extension for consistent corners.
- Shadows: `--shadow-*` -> boxShadow tokens.
- Containers: `--container-*` for layout max-widths.

Guidelines:

- Introduce a new token only if used ≥3 times or communicates semantic meaning (e.g., `--color-positive`).
- Never hardcode hex/size in components when a token exists; extend Tailwind config instead.
- Dark mode: define parallel `--color-*-dark` tokens; toggle via `.dark` class.

## 3. Color & Contrast

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
| Inverse (on dark surface) | `.dark:text-foreground` | dark token variant |
| Surface background | `bg-surface` / `dark:bg-surface-dark` | `--color-surface*` |
| Page background | `bg-background` / `dark:bg-background` | `--color-background*` |
| Border | `border-border` / `dark:border-border-dark` | `--color-border*` |

Rules:

- Never reintroduce raw `text-gray-*` for prose or headings. Exception: temporary experimental component prototypes (remove before merge).
- Prefer opacity suffixes (`/90`, `/80`, `/70`) over inventing new near-identical tokens for hierarchy.
- If a new semantic meaning (e.g., `success`, `warning`) emerges, add a token + Tailwind mapping; do not approximate with a random green/yellow hex.
- Background layers should use `background` (page), `surface` (cards/sections), and `surface-alt` (if introduced) instead of arbitrary gray steps.
- Contrast drift monitoring is enforced via the Playwright contrast spec with a non-failing sentinel (see `tests/playwright/accessibility/contrast-ratio.spec.ts`).

Migration Guidance:

1. Replace `text-gray-*` with `text-foreground` plus optional opacity.
2. Replace `dark:text-gray-*` with `.dark:text-foreground` (or opacity variant if muted).
3. Replace gray backgrounds (`bg-gray-50`, `dark:bg-gray-800`) with `bg-surface` / `dark:bg-surface-dark` (or `bg-background` variants when representing the base page layer).
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

- Pair semantic HTML with semantic size tokens rather than arbitrary utility jumps (`text-4xl`).
- Limit heading weight variance (h1–h2 bold, h3–h4 semibold, body normal/medium).
- Constrain prose width (~60–75ch) using container utilities.
- Prevent FOIT/FOUT: use `font-display: swap` and preload critical fonts when self-hosted.

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

- Respect `prefers-reduced-motion` (no essential information conveyed only via motion).
- Keep transitions 150–300ms with standard easing.
- Prefer transform/opacity for performance; avoid layout-affecting animations.
- Always provide a visible focus ring (never remove outline without replacement).

## 8. Accessibility Integration

- Minimum interactive size ≥44x44px (mobile & touch contexts).
- Use semantic elements first; supplement with ARIA where needed.
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

## 18. Future Opportunities

- Automated lint for raw hex & arbitrary spacing.
- Visual regression gating on critical components.
- System font stack fallback automation.

Align design changes with these practices to keep the interface cohesive, fast, and maintainable.
