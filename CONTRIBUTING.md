# Contributing Guide

Thank you for investing time in improving this project. This guide covers workflow, quality gates, deterministic test practices, and design governance.

## Branch & Commit Hygiene

- Branching model (long-lived):
  - `development` → integration from feature/sprint branches
  - `testing` → pre-release verification and cross-browser checks
  - `main` → production
  - Hotfixes: `hotfix/*` → PR to `main`, then back-merge to `development` and `testing`

- Use feature branches; prefix with area if helpful (e.g. `feat/search-index`, `quality/flakiness-metrics`). Create from `development` unless it is a hotfix.
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `ci:`, `refactor:`, `chore:`.
- Keep commits atomic; separate logic, tests, and large refactors where possible.

## Scripts & Tooling

Core commands:

| Intent                                  | Command                 |
| --------------------------------------- | ----------------------- |
| Dev server                              | `pnpm dev`              |
| Build static site                       | `pnpm build`            |
| Unit tests (Vitest)                     | `pnpm test`             |
| E2E tests (Playwright)                  | `pnpm test:e2e`         |
| Comprehensive quality (CI parity)       | `pnpm test:ci`          |
| Flakiness track                         | `pnpm flakiness:track`  |
| Flakiness gate                          | `pnpm flakiness:check`  |
| Generate quality summary                | `pnpm quality:summary`  |
| Snapshot current quality                | `pnpm quality:snapshot` |
| Generate quality badges                 | `pnpm quality:badges`   |
| Design lint                             | `pnpm design:lint`      |
| Format check (Prettier + Tailwind sort) | `pnpm format:check`     |
| Format write                            | `pnpm format`           |

## Deterministic Testing Guidelines

Avoid brittle timeouts. Prefer utility waits:

| Use Case                                | Utility                               |
| --------------------------------------- | ------------------------------------- |
| Wait after theme toggle                 | `waitForThemeReady`                   |
| Wait after network-triggering action    | `waitForNetworkIdleAfterAction`       |
| Ensure layout settled before screenshot | `waitForLayoutStability`              |
| Scroll-driven lazy load complete        | `waitForScrollSettle`                 |
| Dynamic list population                 | `waitForDynamicList`                  |
| Focus transition in accessibility flows | `waitForFocusChange` (if implemented) |

Principles:

- Never `page.waitForTimeout()` for stabilization.
- Keep retries low; fix root cause not symptoms.
- Add assertions during waits to fail fast on terminal states.
- Tag future visual smoke tests with `@visual-smoke` for optional runs.

## Flakiness & Reliability

Environment variables (CI set):

- `FLAKINESS_MAX_CURRENT_FLAKY` – Hard cap on flaky tests.
- `FLAKINESS_MAX_RETRY_INTENSITY` – Average retries/test-run ceiling.
- `FLAKINESS_STRICT` – Fail if history absent.
- `FLAKINESS_MIN_PASS_RATE` – Minimum acceptable latest run pass rate (0-1 float) enabling reliability gating.

Artifacts & Scripts:

- Run-level history: `flakiness-history.json` (mirrored to `.cache/quality/flakiness-history.json` for continuity across clean operations).
- Per-test flake history (opt-in): enable with `FLAKY_HISTORY=1 node scripts/quality/report-flaky-tests.js` → persists to `.cache/quality/flaky-tests-history.json`.
- Flaky test inspection: `node scripts/quality/report-flaky-tests.js` lists retry-assisted passes and current failures.
- Threshold gate: `pnpm flakiness:check` now also supports reliability via `FLAKINESS_MIN_PASS_RATE`.
- Badges: `pnpm quality:badges` generates `badges/reliability.svg` (pass rate) & `badges/flakiness.svg` (retry intensity).

Guidance:

- Keep `retry: 1` (Vitest) — raise only with justification; excessive retries mask instability.
- Treat any non-zero retry-assisted pass as a candidate for root cause investigation before growing test surface.
- When pruning history (automatic for zero-test placeholders), do not manually edit history files—allow scripts to manage integrity.

Quality summary + badges surface trends early; address red metrics before adding new surface area.

## Design Governance

Refer to `DESIGN_BEST_PRACTICES.md` for:

- Token extension process (no ad-hoc hex values in components).
- Spacing scale usage & rationale.
- Typography ramp + responsive strategy.
- Contrast & dark mode expectations (WCAG AA minimums, avoid borderline ratios).
- Motion & reduced-motion behavior.
- Component API design (composition > boolean prop explosion).

Design lint (`pnpm design:lint`) flags raw hex & suspicious spacing to prevent drift.
Format check (`pnpm format:check`) enforces Prettier + Tailwind class sorting on `src`, Vitest, and design docs — run `pnpm format` before opening a PR.

## Component Development

### Creating New Components

Follow the documented standards in `docs/COMPONENT_DOCUMENTATION_GUIDE.md`:

1. **Choose the Right Category**:
   - **Primitives** (`src/components/primitives/`): Low-level building blocks (Button, Badge, Flex, Grid)
   - **Composites** (`src/components/composites/`): Mid-level composed components (PageHero, FeatureCard, SectionHeader)
   - **Features** (`src/components/features/`): Domain-specific components (BlogPostRow, ProjectCard, SearchOverlay)
   - **Islands** (`src/components/islands/`): React hydrated interactive components (AIChatIsland, ContactFormIsland)

2. **Component Structure**:

   ```astro
   ---
   /**
    * ComponentName - One-line description
    *
    * Detailed description with usage notes.
    *
    * @example
    * <ComponentName variant="primary" size="md">
    *   Content
    * </ComponentName>
    *
    * @accessibility
    * - Keyboard navigation support
    * - Screen reader compatible
    * - Focus management included
    */

   export interface Props {
     /** Prop description with type and default */
     variant?: 'default' | 'primary' | 'secondary';
     size?: 'sm' | 'md' | 'lg';
   }

   const { variant = 'default', size = 'md' } = Astro.props;
   ---

   <!-- Component implementation -->
   ```

3. **Documentation Requirements**:
   - [ ] JSDoc header comment with description and examples
   - [ ] TypeScript Props interface with JSDoc for each prop
   - [ ] Accessibility notes documenting keyboard, screen reader, focus
   - [ ] At least 2 usage examples (basic + advanced)
   - [ ] Related components linked

4. **Testing Requirements**:
   - [ ] Create test file in `tests/vitest/ComponentName.test.ts`
   - [ ] Test structure, props, accessibility, styling
   - [ ] Verify TypeScript types and interfaces
   - [ ] Document interactive behavior
   - [ ] 100% pass rate before committing

### Type System

Prefer collection types from Astro and shared prop interfaces from `src/types/`:

```typescript
import type { CollectionEntry } from 'astro:content';
import type { BlogPostRowProps, ProjectCardProps } from '@/types/components';
```

**Available Type Modules**:

- `@/types/components` - Shared component prop interfaces (`BlogPostRowProps`, `ProjectCardProps`)
- `@/types/api` - API responses, forms, validation, email

### Component Best Practices

1. **Props Design**:
   - Use TypeScript interfaces with JSDoc comments
   - Provide sensible defaults
   - Use union types for variants (`'default' | 'primary'`)
   - Avoid boolean prop explosion (use variants instead)

2. **Composition Over Complexity**:
   - Build composites from primitives
   - Use slots for flexible content
   - Keep components focused (single responsibility)
   - Extract shared patterns into reusable primitives

3. **Styling**:
   - Use Tailwind utilities only (no custom CSS)
   - Follow design token system (`src/styles/global.css`)
   - Support dark mode with `dark:` variants
   - Include responsive breakpoints (`sm:`, `md:`, `lg:`)
   - Add focus-visible styles for accessibility

4. **Accessibility**:
   - Use semantic HTML elements
   - Include ARIA attributes when needed
   - Support keyboard navigation (Tab, Enter, Escape)
   - Provide focus-visible styles
   - Test with screen readers and axe DevTools

5. **Performance**:
   - Prefer static Astro components
   - Use client-side JavaScript only when necessary
   - Optimize images with OptimizedImage component
   - Minimize bundle size (tree-shakeable exports)

### Component Barrel Exports

Add new components to appropriate index files:

```typescript
// src/components/primitives/index.ts
export { default as NewPrimitive } from './NewPrimitive.astro';

// src/components/composites/index.ts
export { default as NewComposite } from './NewComposite.astro';
```

### Component Documentation

After creating a component:

1. Ensure JSDoc comments are complete
2. Add usage examples to component header
3. Document in `docs/COMPONENT_DOCUMENTATION_GUIDE.md` if it's a commonly used pattern
4. Create tests validating documented behavior

### Component Checklist

Before committing a new component:

- [ ] Component placed in correct directory (primitives/composites/features/ui)
- [ ] JSDoc header with description and examples
- [ ] TypeScript Props interface fully documented
- [ ] Accessibility section complete
- [ ] Tests created with 100% pass rate
- [ ] Added to appropriate index.ts barrel export
- [ ] Uses centralized types from `@/types`
- [ ] Follows design token system
- [ ] No ESLint errors
- [ ] Build succeeds (`pnpm build`)
- [ ] Documentation reviewed

## Performance & Budgets

- Budgets enforced during build; investigate increases immediately.
- Prefer AVIF/WebP; ensure fallback logic maintains parity.
- Defer non-critical JS; use Astro islands sparingly.

## Accessibility

- All interactive elements keyboard reachable.
- Provide visible focus states (token-driven, high contrast).
- Use semantic landmarks (header, main, nav, footer, aside) for structure.
- Add `aria-live` only when necessary; avoid noisy regions.

## Pull Request Checklist

Before requesting review:

- [ ] Unit & E2E tests added/updated.
- [ ] No raw hex or suspicious spacing (run design lint).
- [ ] Flakiness gating passes locally if modified test flows.
- [ ] No new large dependencies without discussion.
- [ ] README or relevant docs updated if behavior or architecture changed.
- [ ] Source/target branches follow the required flow:
  - feature/* or sprint/* → development
  - development → testing
  - testing → main
  - hotfix/* → main (then back-merge to development/testing)

## Issue Labels (Suggested)

| Label           | Purpose                    |
| --------------- | -------------------------- |
| `type:bug`      | Defect or regression       |
| `type:feature`  | New capability             |
| `quality:flaky` | Flaky test tracking        |
| `quality:perf`  | Performance task           |
| `a11y`          | Accessibility-related work |
| `docs`          | Documentation only         |

## Security Considerations

- Treat environment variables as sensitive (no logging secrets).
- Validate user input in edge functions (anti-abuse, rate limit, Turnstile if sensitive).

## Production deploy (Cloudflare Workers)

Pushes to `main` trigger `.github/workflows/deploy-worker.yml`, which runs `pnpm build` and `wrangler deploy`.

If **Deploy Worker** fails with `Invalid access token [code: 9109]` or `Authentication error [code: 10000]`, rotate GitHub credentials:

```bash
# Preferred: dedicated API token (Cloudflare dashboard → Edit Cloudflare Workers)
CLOUDFLARE_API_TOKEN='your-token' ./scripts/setup/github-cloudflare-deploy.sh

# Quick bootstrap from local wrangler login (rotate to a dedicated token later)
./scripts/setup/github-cloudflare-deploy.sh --from-wrangler
```

Then re-run deploy:

```bash
gh workflow run deploy-worker.yml
```

Cloudflare Git integration may also build on push; the GitHub Action is the explicit Wrangler deploy path when `CLOUDFLARE_API_TOKEN` is configured. See `.github/instructions/cloudflare.instructions.md` for Worker bindings and secrets.

## Release Cadence

- Tag stable architecture milestones (e.g., `v2-quality-foundation`).
- Use changelog summaries in PR descriptions for multi-commit feature branches.

---

Questions? Open a discussion or draft PR for early feedback.
