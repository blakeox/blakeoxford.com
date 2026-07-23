# agent.md

Last updated: 2026-07-23

Changelog:

- 2026-07-23: Phase 0–4 complete for A+ — RATE_LIMIT KV physically split; AI Gateway `default` on Workers AI; Ask client contract; HomeHero split; search loader → `/search/*`; public scripts ≤40 via quality CLI.
- 2026-07-22: Mandate `@/` path aliases for `src/` imports (codemod ~342); prefer deep `@/utils/<module>` over the utils barrel. Aggressive structural refactor — modular Worker (`functions/index.ts` + routes), domain unification (AI search service, CollectionEntry page types, features/contact), chat hooks under `features/chat/hooks`, component-docs split, README/hygiene pass.
- 2026-07-21: Pinned Node.js 24 LTS (engines + CI); carousel masters moved to local path; ESLint Tailwind unknown-class noise silenced; Vitest Playwright import leak fixed.
- 2026-07-20: Refreshed directory map (features/, services/, middleware/); chat UI consolidated under `src/features/chat/`; carousel originals gitignored; design-lint duplicate `* 2.*` gate documented.
- 2025-09-11: Initial version created for Phase 2 hardening baseline.
- 2025-09-11: Added environment variable matrix, gate escalation rules, testing & performance guidance, markdown lint fixes.
- 2025-09-11: Added mini-app / MCP integration guidelines (lease analysis, debt payoff, on-site agent patterns).

---

## 1. Project Overview

You are assisting with `blakeoxford.com`, a performance-obsessed, accessibility-first personal / professional site built with Astro and deployed via Cloudflare Workers. It serves as a portfolio, blog, and platform for experimentation in automation, quality governance, and edge-first delivery.

Core goals:

- Near-zero client JS unless required for interactivity.
- Deterministic build outputs and reproducible performance.
- Automated quality gates: search relevance, accessibility, dead links, long tasks.
- Content integrity, type safety, and minimal dependencies.

Primary audience: recruiters, collaborators, and technical peers evaluating architectural skill, code quality discipline, and optimization practices.

## 2. Architecture & Technology

- **Build system**: Astro SSG (`output: static`).
- **Deployment**: Cloudflare Workers / static assets (Pages deprecated for this project).
- **Routing**: File-based under `src/pages/` (kebab-case). Edge/API handlers live in `functions/` (Workers).
- **Components**: Astro UI layers in `src/components/` (PascalCase). Product React features (Ask, Find, overlay, contact form) live under `src/features/`.
- **Content**: Zod-driven schemas in `src/content.config.ts`; static JSON in `public/api/`.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` (CSS-first). Tokens live in `src/styles/theme.css` (`@theme inline`); prefer utilities over bespoke CSS. Shared chrome belongs in `components.css`.
- **Optimization scripts**: `scripts/optimization/` (image optimization, bundle analysis, critical CSS inlining, code splitting guidance). Carousel masters live outside git at `~/Documents/blakeoxford-local/carousel-originals` (or `CAROUSEL_ORIGINALS_DIR`); commit only webp/avif outputs under `src/assets/images/carousel/`.
- **Quality tooling**: `scripts/quality/` orchestrates runtime checks (search relevance, accessibility via axe-core, dead link crawl, long-task probe) + summary. `design:lint` also fails on Finder-style `* 2.*` duplicate artifacts.
- **Testing**: Vitest (`tests/vitest/`), Playwright (`tests/playwright/`), plus performance & accessibility logs.
- **Search**: Client-side index auto-generated on build (`localSearch`).
- **Edge functions**: `functions/` (e.g., `send-email.ts`, `functions/index.ts`).
- **Config conventions**: Minimal global state; prefer pure functions; ESM modules.
- **Import paths**: Use `@/` aliases for anything under `src/` (e.g. `@/features/chat/...`, `@/utils/errors`). Avoid deep relative `../../../` imports.

Directory highlights:

```text
src/
  pages/             # File-based routes (kebab-case)
  layouts/           # BaseLayout, ProjectDetailLayout
  content/           # MDX collections + page JSON getters
  components/        # Astro UI: primitives → composites → features → layout/head
  features/          # Product React modules: chat, command-center, overlay, contact
  lib/               # Shared domain modules + hooks used by ≥2 features
  utils/             # Pure helpers (cn, scrollLock, …)
  services/          # I/O-facing clients (contact, AI search)
  config/            # Site constants, nav, schemas
  integrations/      # Dev-only Astro integrations (proxies)
  styles/            # theme.css + global chrome
  scripts/           # Progressive-enhancement client controllers
scripts/
  optimization/      # Image optimize, favicons, quality gate helpers
  quality/           # Runtime metrics + gating scripts (incl. design-lint)
  content/           # Search index generation
  build/ · ci/ · setup/
public/              # Static assets, public/api JSON (search index generated)
functions/           # Cloudflare Worker entry (index.ts) + Durable Objects
tests/               # Vitest + Playwright + contracts
infra/               # Zaraz templates
```

### Environment Variables & Quality Gates

| Variable                   | Purpose                                                     | Typical Value                     | Gate Effect                  |
| -------------------------- | ----------------------------------------------------------- | --------------------------------- | ---------------------------- |
| `BASE_URL`                 | Canonical base for runtime checks/server                    | `http://localhost:xxxx` (dynamic) | All runtime fetches          |
| `MIN_TOPN_PASS_RATE`       | Required top-N search relevance percentage                  | `80`                              | Fails run if below           |
| `SEARCH_TOP_N`             | N for top-N acceptance window                               | `3`                               | Influences relevance scoring |
| `A11Y_FAIL`                | Boolean to fail on any accessibility issues if caps not set | `true/false`                      | Fallback gate if no caps     |
| `A11Y_MAX_PER_ROUTE`       | Per-route max violation count (total)                       | `2`                               | Fails if any route exceeds   |
| `A11Y_MAX_TOTAL`           | Global total violation cap                                  | e.g. `10`                         | Fails if exceeded            |
| `A11Y_MAX_BY_ROUTE`        | JSON map route→cap for granular overrides                   | `{"/projects":2}`                 | Per-route precedence         |
| `A11Y_ROUTES`              | Comma list to override autodiscovery (planned)              | `/,/about,/projects`              | Limits scan scope            |
| `A11Y_BLOCK_IMPACTS`       | CSV of Axe impacts to fail immediately                      | `serious,critical`                | Immediate failure on match   |
| `DEADLINK_FAIL`            | Fail build when dead links > 0                              | `true`                            | Immediate failure            |
| `DEADLINK_EXTERNAL`        | Also test external links                                    | `false`                           | Expands crawl set            |
| `DEADLINK_ALLOWLIST`       | Regex (\|) pattern of URLs to ignore                        | e.g. `^/api/legacy`               | Prevent false positives      |
| `DEADLINK_MAX_CONCURRENCY` | Parallel HTTP validation limit                              | `8`                               | Performance control          |
| `A11Y_HISTORY_MAX`         | Max retained entries in accessibility history log           | `50`                              | Rotates oldest beyond cap    |

Gate precedence (highest → lowest):

1. Block impacts (`A11Y_BLOCK_IMPACTS`) if any matching severity appears.
2. Per-route map (`A11Y_MAX_BY_ROUTE`).
3. Per-route generic cap (`A11Y_MAX_PER_ROUTE`).
4. Global total (`A11Y_MAX_TOTAL`).
5. Fallback boolean gate (`A11Y_FAIL`).

Escalate before changing any numeric threshold; never silently relax.

## 3. Agent’s Role & Principles

You:

- Extend features (new pages, components, quality checks) while preserving performance & accessibility budgets.
- Maintain and expand tests (unit, e2e) whenever behavior changes or new features land.
- Update docs and generated badges/summary artifacts when workflows change.
- Improve internal tooling (quality gates, scripts) incrementally.

Guiding principles:

- **Performance first**: Avoid unnecessary client JS; prefer static precomputation.
- **Accessibility**: No regressions; honor caps & treat new violations as defects; semantic HTML always.
- **Security & Privacy**: No secrets in repo; sanitize inputs on API routes; enforce strict headers (see `_headers`).
- **Clarity & Maintainability**: Small modules, pure functions, typed data flows.
- **Determinism**: Scripts must be idempotent and stable under repeated CI runs.
- **Minimal dependencies**: Do not add new packages without explicit approval.

Do NOT (without human approval):

- Introduce new runtime frameworks or state managers.
- Replace Tailwind with custom CSS frameworks or add global CSS files.
- Add large dependencies for minor tasks (e.g., lodash for one-liners).
- Loosen quality gates or disable tests.
- Change deployment targets or CI workflow names.

## 4. Workflow & Operations

Local setup:

1. Install dependencies: `pnpm install --frozen-lockfile`
2. Dev server: `pnpm dev`
3. Build: `pnpm build` (runs search index + optimization)
4. Preview build: `pnpm preview`

Key scripts (confirm in `package.json`):

- `pnpm build`: Clean, generate search index, run Astro build.
- `pnpm test`: Run vitest suite.
- `pnpm test:e2e`: Run Playwright tests.
- `pnpm quality:runtime`: Orchestrated runtime metrics & gating.
- `pnpm quality:badges`: Generate badges (flakiness, a11y, reliability).
- `pnpm optimize:*`: Performance utilities (images, bundle analysis, critical CSS).

CI/CD:

- Lint → runtime quality gate (fail-fast) → E2E → aggregation → PR comment.
- Artifacts: search relevance results, accessibility history, dead link report, long-task report, badges, quality summary, snapshots.
- Gates: configured solely by env vars (never hardcode thresholds in code without documenting here).

Branching & commits:

- Feature branches: `feature-*` or domain-specific (e.g., `test-architecture-phase2`).
- Conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `perf:`, `docs:`.
- PRs must list rationale, test coverage, gate impact (if thresholds changed), risk notes.

### Testing Strategy

- **Unit (Vitest)**: Test pure functions in `utils/` + any logic modules. Name: `<file>.test.ts` alongside or in `tests/vitest/`.
- **E2E (Playwright)**: Core navigation, accessibility regression surfaces, search overlay behavior.
- **Runtime quality**: Treated as gating integration tests (search relevance, a11y, dead links).
- **When adding code**: Add at least one unit test per new utility + adapt existing E2E if user journeys change.
- **Snapshots**: Keep minimal; prefer semantic assertions.

### Performance Budgeting

- Lighthouse baselines: `lighthouse-reports/` summary; do not regress LCP / CLS / TTI without justification.
- Long tasks: Keep report empty / minimal; investigate if > 50ms tasks appear.
- Bundle: Use `pnpm analyze:bundle` before introducing new dependency weight.
- Images: Leverage existing optimization pipeline; no raw large images in `public/`—place source in assets so pipeline can process.

### Security Headers & CSP

- Refer to `_headers` for enforced security directives.
- Adding new external asset domains requires updating CSP and documenting in PR.
- Avoid inline scripts; if needed, ensure nonce or hash strategy alignment.

### Escalation Triggers

Escalate (open issue / PR note) if any of:

- Gate failures reproducible locally after a change you authored.
- Need to raise a threshold (temporary or permanent).
- Proposal to add dependency > 20kB min+gzip.
- API route persisting user data or integrating third-party services.

## 5. Collaboration Guidelines

Coding style:

- Use existing patterns; Tailwind utilities and semantic tokens over one-off CSS.
- Keep components focused; move reusable logic to `utils`.
- Add JSDoc/TSDoc for nontrivial functions (inputs, outputs, error cases).

Documentation:

- Update `README.md` and this `agent.md` for new env flags or workflow changes.
- Provide short usage notes for new scripts.

PR Expectations:

- All tests & gates pass (or explicit justification for temporary threshold changes).
- Include before/after metrics for performance-sensitive changes.
- Highlight new environment variables & defaults.

Escalate to human when:

- Relaxing security headers / CSP / gating thresholds.
- Adding an external dependency or service integration.
- Modifying deployment targets or build output structure.
- Introducing experimental AI/LLM features or data collection changes.

## 6. Recipes & Guardrails

Common tasks:

### Add a new page

- Create `src/pages/new-page.astro` (kebab-case).
- Add structured data / meta tags for SEO.
- If interactive: isolate into a small React island component loaded conditionally.
- Run `pnpm build` + `pnpm quality:runtime` to ensure no gate regressions.

### Extend a component

- Modify in `src/components/ComponentName.astro`.
- Export only needed props, type them.
- Add/adjust vitest snapshot or behavioral tests if logic changes.

### Add an API route

- Add a Worker route in `functions/index.ts` (preferred) or a static JSON under `public/`.
- Export HTTP verb handlers (e.g., POST); validate inputs (Zod preferred).
- Ensure no secret leakage; log minimal metadata.

### Add a search golden query

- Update golden queries JSON (in `scripts/quality` or tests folder as configured).
- Run `pnpm quality:runtime` to recalc relevance & confirm gates.

### Tighten accessibility cap

- Set `A11Y_MAX_PER_ROUTE`, `A11Y_MAX_TOTAL`, or per-route map env in CI.
- Ensure local run is under new cap before pushing.

### Fix dead link

- Update or remove broken href/src.
- Re-run `pnpm quality:runtime`; confirm `dead-links-report.json` has zero failures.

### Build a mini analytical application (e.g., lease analyzer, debt payoff modeler)

Principles:

- Stay within static-first constraints: prefer pure client-side computation with no backend round trips unless sensitive data requires isolation.
- No PII persistence: all user-entered financial or contractual data processed in-memory; offer optional download (JSON) rather than server storage.
- Minimal JS footprint: lazy-load the interactive component only when user opens the tool.
- Deterministic calculations: isolate core math in a pure TypeScript module under `src/utils/finance/` with unit tests.

Steps:

1. Create a utility module (`src/utils/finance/lease.ts`, `debt.ts`) exporting pure functions (e.g., `amortizationSchedule`, `effectiveRent`, `snowballPlan`).
2. Add unit tests in `tests/vitest/finance/` covering edge cases (zero interest, irregular payment intervals, leap year handling if relevant).
3. Create an Astro page in `src/pages/tools/<tool-name>.astro` describing the tool (SEO metadata, accessible form regions).
4. Implement a small React island component in `src/components/tools/<ToolName>App.tsx` for interactive input + results, code-split via dynamic import triggered by user action (e.g., "Launch Calculator").
5. Validate accessibility: proper labels, ARIA live region for recalculated outputs, keyboard-only operation.
6. Run `pnpm quality:runtime` to ensure no regressions (a11y, dead links).
7. Update `README.md` Tools section and add a short usage example.

Performance considerations:

- Keep bundle < 10kB gzip per tool (excluding shared runtime). Use tree-shakable utilities; avoid large charting libs—prefer semantic tables + small inline SVG for visual cues.
- Precompute amortization arrays only once per input change; memoize if necessary.

Security considerations:

- Do not send user inputs to third-party APIs unless explicitly disclosed and documented.
- No storage in localStorage by default; provide explicit opt-in toggle if persistence is valuable.

### Integrating an MCP server powered agent on-site

Objective: Provide an on-site assistant that can leverage curated internal APIs (content search, project metadata) without introducing privacy or performance regressions.

Pattern:

1. Prefer a Worker route in `functions/index.ts`, or static JSON under `public/`, exposing a manifest of available tools (search index query wrapper, project metadata fetch, calculator invocation).
2. Run the MCP server off-repo or as a dev-only module; never bundle server logic into client runtime.
3. The client-side agent UI is a lazy-loaded React island (`AgentConsole.tsx`) rendering only on explicit user interaction (button click) to avoid layout shift.
4. Communications: Use fetch calls to internal API endpoints; avoid WebSocket unless justified—prefer stateless requests for determinism.
5. Rate limiting: If interactivity escalates, add a lightweight edge check (KV-based token bucket) before forwarding queries.

Safeguards:

- No free-form arbitrary external fetch from the browser agent runtime; keep tool list whitelisted.
- Sanitize user prompts—strip HTML, limit length.
- Provide a clear disclosure (“All processing occurs locally / with site APIs only”).

Testing:

- Unit test each tool adapter (mock data sets, deterministic responses).
- E2E: Open agent console, run a sample query, assert accessibility (focus trap, escape to close) + response rendering.

Metrics & Quality:

- Exclude agent UI from critical path metrics (defer loading until after TTI / user action).
- Track size via bundle analysis; ensure agent-related chunks remain isolated.

Documentation:

- Add a subsection to `README.md` describing available tools & privacy model.
- Update this file when adding new agent capabilities or external integrations.

Guardrails (avoid):

- Blocking network calls in build steps.
- Long-running synchronous loops in Cloudflare functions.
- Inline large JSON blobs in Astro pages (prefer external static JSON in `public/api/`).
- Unbounded history/log growth (rotate / cap arrays).

Security & Data Handling:

- Sanitize user inputs (escaping, validation). No eval or dynamic code injection.
- Respect CSP; only allow whitelisted domains for scripts/assets.
- Do not commit secrets or API keys; use environment variables.

Performance Anti-patterns:

- Shipping large global client bundles for one small feature.
- Duplicated utility code (prefer central `utils`).
- Over-fetching or redundant API endpoints.

Accessibility Pitfalls:

- Interactive elements lacking roles, labels, or keyboard support.
- Color contrast regressions (favor semantic classes / tokens).
- Using divs where semantic tags (nav, header, main, button) apply.

## 7. External References

- `README.md`: Setup, scripts, stack overview.
- `agent.md` (this file): Operational guidance for agents.
- `CONTRIBUTING.md`: Branching, component layers, tests, deploy.
- `DESIGN_BEST_PRACTICES.md`: Design system rules.
- `tests/playwright/README.md`: Browser E2E conventions (canonical suite under `tests/playwright/`).
- `lighthouserc.json` / Lighthouse CI: Performance budgets.
- Cloudflare Workers: `functions/` + `wrangler.toml` (Pages adapter removed; Workers + ASSETS only).
- Search index generation: `scripts/content/generate-search-index.js`.
- Performance scripts: `scripts/optimization/*`.
- Quality orchestrator: `scripts/quality/run-runtime-metrics.js`.

### Edge Env (must match wrangler)

| Binding / secret                                          | Role                                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `RATE_LIMIT_KV`                                           | Dedicated physical NS `blakeoxford-rate-limit` (`28bd2025…`)                        |
| `CONTACT_MESSAGES`, `AI_RESPONSE_CACHE`, `AI_FEEDBACK_KV` | Shared portfolio KV (prefix-disjoint; further split optional)                       |
| `CONVERSATION_DO`                                         | Durable Object for live conversation                                                |
| `AI`, `VECTORIZE`, `AI_ANALYTICS`                         | Workers AI, Vectorize, Analytics Engine                                             |
| `CONTACT_EMAIL`                                           | Email Workers binding                                                               |
| `ASSETS`                                                  | Static `./dist`                                                                     |
| `TURNSTILE_SECRET_KEY`                                    | Contact / abuse gate                                                                |
| `AI_SEARCH_API_TOKEN`, `AI_SEARCH_API_ENDPOINT`           | AutoRAG upstream                                                                    |
| `AI_GATEWAY_ID`, `AI_GATEWAY_ACCOUNT_ID`                  | Workers AI Gateway on `env.AI.run` (`AI_GATEWAY_ID=default`); AutoRAG stays ungated |
| `SENTRY_DSN_EDGE`, `ENVIRONMENT`, `GIT_COMMIT`            | Edge Sentry context                                                                 |

Do not declare unbound KV names on `Env` (e.g. retired `CONVERSATION_CACHE_KV`).

## 8. Maintenance & Evolution

Updating this file:

- Revise when adding/removing gates, env variables, or structural conventions.
- Keep Changelog entries small & dated.
- Remove deprecated guidance promptly.

Future agents should:

- Propose pruning stale artifacts and rotating historical logs to prevent repo bloat.
- Periodically re-validate performance budgets against real Lighthouse trends.

Template for Changelog entry:

```text
- YYYY-MM-DD: <short description of change>
```

---

Questions or edge cases? Escalate early rather than silently adjusting gates.
