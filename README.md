# 🌐 Personal Portfolio Site

A blazing-fast, modern portfolio site built with [Astro](https://astro.build), deployed on [Cloudflare Workers](https://developers.cloudflare.com/workers/). This project emphasizes performance, clean design, edge delivery, privacy, and minimal client-side JavaScript.

---

## 🎯 Project Goals

- Showcase personal projects and achievements

- Include an About page and optionally a Blog

- Support Markdown + MDX content formats

- Achieve excellent Lighthouse scores (performance, SEO, a11y)

- Deploy using Cloudflare Workers for edge-speed delivery

- Keep it free, fast, privacy-friendly, and beautiful

---

## 🧱 Technology Stack

### Core Framework

- [Astro](https://astro.build) (Static Site Generator)
  - Output mode: `static` (default), optional `hybrid` for edge SSR

### Styling

- [Tailwind CSS](https://tailwindcss.com/)

- SCSS (optional for custom overrides or animations)

- [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin)

### Content

- Markdown (`.md`) for general content

- MDX (`.mdx`) for embedding components in markdown

- [Content Collections](https://docs.astro.build/en/guides/content-collections/) for type-safe content

### Components & Interactivity

- Native `.astro` components

- Optional: [React](https://reactjs.org/), [Svelte](https://svelte.dev), [Vue](https://vuejs.org) components

- [Lucide](https://lucide.dev) or [Iconify](https://iconify.design) for icons

- [Fuse.js](https://fusejs.io/) for fuzzy search (optional)

- [Framer Motion](https://www.framer.com/motion/) for animations (if using React)

### Hosting & CDN

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
  - Custom domain with free SSL
  - Deploy previews for every pull request
  - Global edge delivery
  - Built-in CI/CD pipeline via GitHub integration

### Cloudflare-Specific Enhancements

- Edge Functions for form handling, SSR, A/B testing *(optional)*

- [Cloudflare KV](https://developers.cloudflare.com/kv/) or Durable Objects for edge-side state *(optional)*

- [Cloudflare Turnstile CAPTCHA](https://developers.cloudflare.com/turnstile/) for secure form submissions

- [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/)

### SEO, Accessibility, and Optimization

- `@astrojs/sitemap` for automatic sitemap generation

- `astro-meta` or `astro-seo` for Open Graph, Twitter Cards, etc.

- `_headers` file for security & caching:
  - `Content-Security-Policy`
  - `Cache-Control`
  - `X-Content-Type-Options`

- [`astro-compress`](https://github.com/achary/astro-compress) for Gzip/Brotli output

---

## 🚀 Getting Started (using pnpm)

### Prerequisites

- Node.js v22+

- Corepack enabled: `corepack enable`

- A GitHub account

- A Cloudflare account (for Pages deployment)

### Setup

```bash
git clone https://github.com/blakeox/blakeoxford.com.git
cd blakeoxford.com
pnpm install
pnpm dev
```

### Build

```bash
pnpm build
```

### Preview Locally

The Cloudflare adapter doesn’t support `astro preview`. For local development with HMR:

```bash
pnpm dev
```

To preview a production build locally, install a static server and serve the `dist/` folder:

```bash
pnpm build
npx serve dist/
```

---

## 🛰️ Deployment (Cloudflare Workers)

1. Build: `pnpm build`
2. Deploy the Worker: `pnpm deploy:worker` (or `pnpm edge:deploy`)
3. Verify: static assets via ASSETS binding, CSP/headers, and edge routes

---

## 🧠 Future Enhancements

- Add project filtering or tagging system

- Integrate a headless CMS (e.g., Sanity, Notion API)

- Add blog with MDX + RSS feed (`@astrojs/rss`)

- Light/Dark theme toggle with Tailwind

- Offline support via Service Workers (e.g., Workbox)

- Webhook or GitHub Action to re-deploy on CMS updates

---

## 🧪 Test Architecture (Phase 6 Overview)

![Mutation Score Badge showing current mutation test coverage level](badges/mutation.svg) ![Reliability Badge showing latest pass rate](badges/reliability.svg) ![Flakiness Badge showing average retry intensity health](badges/flakiness.svg) ![Accessibility Badge showing latest total a11y violations](badges/a11y.svg) ![Contrast Badge showing sampled text contrast trend](badges/contrast.svg)

See the Phase 2 completion summary in `PHASE2_COMPLETION.md` for delivered reliability & governance foundations. New contributors: consult `CONTRIBUTING.md` for deterministic test & design token rules.

Progressive multi-phase modernization delivers layered quality gates:


Environment Flags (runtime gates & quality controls):

| Variable | Purpose | Notes |
|----------|---------|-------|
| `MIN_TOPN_PASS_RATE` | Minimum acceptable top-N search relevance pass rate (percent) | Gate fails if `topNPassRate < value` |
| `SEARCH_TOP_N` | N for top-N acceptance in relevance tests | Default 3 |
| `A11Y_FAIL` | Fail if any violations (fallback) | Used only when no caps configured |
| `A11Y_MAX_PER_ROUTE` | Uniform per-route violation cap | Evaluated after per-route map |
| `A11Y_MAX_TOTAL` | Global total violations cap | Applies after per-route checks |
| `A11Y_MAX_BY_ROUTE` | JSON map route->cap overriding uniform cap | Highest precedence among per-route thresholds |
| `A11Y_BLOCK_IMPACTS` | Comma list of Axe impact levels to block immediately | E.g. `serious,critical` |
| `A11Y_HISTORY_MAX` | Max entries retained in `accessibility-history.json` | Default 50 (rotation) |
| `A11Y_ROUTES` | Explicit comma/JSON list of routes to scan | Otherwise auto-discovered from build |
| `DEADLINK_FAIL` | Fail if any dead (404/0) internal/external (if enabled) links | Works with enhanced checker |
| `DEADLINK_EXTERNAL` | Include external links in dead link scan | Default false |
| `DEADLINK_ALLOWLIST` | Regex (comma-separated) allowlist to skip links | Tested against full or path value |
| `DEADLINK_MAX_CONCURRENCY` | Parallel HTTP validation limit | Default 10 |
| `FLAKINESS_MAX_CURRENT_FLAKY` | Max flaky tests allowed | Optional gate |
| `FLAKINESS_MAX_RETRY_INTENSITY` | Max average retries per run | Optional gate |
| `FLAKINESS_STRICT` | Fail if flakiness history missing | Bootstrapping risk |

Gating Precedence (accessibility):

1. Block impacts (`A11Y_BLOCK_IMPACTS`)
2. Per-route map (`A11Y_MAX_BY_ROUTE`)
3. Uniform per-route cap (`A11Y_MAX_PER_ROUTE`)
4. Global total (`A11Y_MAX_TOTAL`)
5. Fallback boolean (`A11Y_FAIL`)

### Dead Link Checker Notes

- Only internal links by default; enable external scanning with `DEADLINK_EXTERNAL=true`.
- Allowlist accepts multiple comma-separated regex patterns; matched links are treated as OK and excluded from dead counts.
- Concurrency tuned via `DEADLINK_MAX_CONCURRENCY`; keep conservative (<=10) to avoid rate limiting.

Local run with gates (example):

```bash
MIN_TOPN_PASS_RATE=80 SEARCH_TOP_N=3 A11Y_MAX_PER_ROUTE=2 A11Y_BLOCK_IMPACTS=serious,critical DEADLINK_FAIL=true DEADLINK_MAX_CONCURRENCY=8 pnpm quality:runtime
```


These layers create early, low-noise detection for regressions across functionality, performance, accessibility, and UI fidelity while keeping runtime lean.

Contrast Oversight:

- Nightly job randomly samples additional project & blog routes (via `contrast-route-rotator.js`) and injects them using `CONTRAST_EXTRA_ROUTES`.
- A configurable near-threshold sentinel (band = `CONTRAST_SENTINEL_BAND`, default `0.10`) logs potential drift without failing the build; data lands in `contrast-history.json`.
- Rolling 7‑day borderline average & localized 7‑point slope recorded (`metrics.rolling7Borderline`, `metrics.slope7Borderline`) to detect directional change early.
- Optional slope alert (`CONTRAST_SLOPE_ALERT`) triggers governance if slope7 > threshold (indicates accelerating regression risk).
- Badge (`badges/contrast.svg`) now overlays: sampled (green), borderline (red), rolling7 (dashed blue) + slope arrow (▲ worsening / ▼ improving / ⭮ flat).
- Local inspection helper: `pnpm contrast:report` (use `-- --limit 5` to restrict rows or append `-- --json` for machine-readable output) prints recent borderline trend with rolling & slope metrics.
- Add `-- --markdown` to emit a PR-ready table (CI stores `contrast-report.md` artifact nightly).
- Pull Request visibility: a lightweight `Contrast PR Summary` workflow runs on each PR, executes the contrast sampler with alerts disabled (high threshold), and posts/updates a single comment (marker `<!-- contrast-pr-summary-marker -->`) containing a 7-day markdown table so reviewers see drift early. Add a `skip-contrast` label to a PR to suppress this comment.
  - The PR comment also surfaces a qualitative trend classification (improving / worsening / flat) with an arrow derived from the latest 7-point slope.
  - Auto-close policy: a `Contrast Maintenance` workflow runs daily after the nightly sampler; if the last `CONTRAST_AUTO_CLOSE_DAYS` (default 3) days show zero borderline counts it automatically closes any open contrast alert issues with a resolution note.
- Nightly workflow captures history + alert logs; on alert it auto-appends a 3‑day markdown trend table into the created issue.

### 🔁 Flakiness Metrics & Reliability (Phase 2 Add-on)

The test system now tracks run-level reliability metrics (aggregate view) and can evolve to per-test granularity later.

- History File: `flakiness-history.json` (structure: `{ version, maxEntries, runs:[{ timestamp, totalTests, failedTests, flakyTests, retryIntensity, passRate }] }`)
- Updater Script: `node scripts/quality/update-flakiness-history.js` (auto-invoked in deployment quality gate before thresholds)
- Threshold Gate: `pnpm flakiness:check` (optional; enforces flaky count & retry intensity) – currently expects legacy per-test format but remains backward compatible (will skip gracefully until migrated)
- Vitest Reporter: `./tests/reporters/flakinessReporter.ts` auto-writes `test-results.json` (run with `pnpm test`) feeding the updater real totals instead of placeholders.

Environment Variables:

| Variable | Purpose |
|----------|---------|
| `FLAKINESS_MAX_CURRENT_FLAKY` | Hard cap on number of currently flaky tests (default 0 in gate) |
| `FLAKINESS_MAX_RETRY_INTENSITY` | Max proportion of flaky vs total tests in latest run (default 0.05) |
| `FLAKINESS_STRICT` | Fail if history file missing (default: skip gracefully) |

Usage Patterns:

```bash
# Manual update after a local test run
node scripts/quality/update-flakiness-history.js

# Run gate with stricter thresholds
FLAKINESS_MAX_CURRENT_FLAKY=0 FLAKINESS_MAX_RETRY_INTENSITY=0.02 pnpm flakiness:check
```

Planned Enhancements (non-breaking roadmap):

- Per-test consolidation & retry tracking integration.
- Automatic detection of newly flaky tests.
- Trend slope & volatility classification over last N runs.
- Badge generation (`scripts/quality/generate-badges.js`) extension for reliability.

---

## 🎨 Design System & Best Practices

A consolidated guide covering spacing scale, typography ramp, color token governance, contrast enforcement, motion/interaction principles, component composition, and future opportunities lives in `DESIGN_BEST_PRACTICES.md`.

Key expectations:

- No ad-hoc hex colors; extend tokens in Tailwind config.
- Leverage deterministic wait utilities for any interactive test flows.
- Maintain accessible contrast in both light and dark themes (see guide audit section).
- Prefer compositional variants over multiple boolean props in components.

---

## 📡 RSS Feed

Your blog RSS feed is available at `/rss.xml`. Subscribe here:

```text
https://blakeoxford.com/rss.xml
```

---

## ⚙️ Troubleshooting

- **Sessions KV binding**: If you see warnings about `Invalid binding "SESSION"`, create a Cloudflare KV namespace and add a `SESSION` binding in your `wrangler.toml`.

- **Sitemap integration**: The `@astrojs/sitemap` plugin requires a `site` field in `astro.config.mjs`. For example:

```js
export default defineConfig({
  site: 'https://blakeoxford.com',
  // ...other config
});
```

---

## 🛡 Security & Performance


### Performance budgets and image pipeline

- The performance budget script validates bundle sizes and computes totals from referenced assets only. It scans built HTML/JS/CSS for references to /_astro and /assets files, then sums sizes for those exact files plus HTML. This avoids counting unreferenced hashed artifacts.
- Images are optimized prebuild. Scripts generate AVIF/WebP for carousel, proficiencies, projects, and public images. Runtime components prefer AVIF > WebP > JPEG/PNG, with PNG originals excluded from imports where possible.
- The budget warns on PNG/JPG without modern siblings, ignoring favicons/app icons and allowlisting optimized PNG derivatives under public/assets/images/optimized.
- CSP, X-Frame-Options, and other headers enforced

- Optional rate limiting and Turnstile CAPTCHA on sensitive endpoints

### Caching Policy

Runtime caching headers are enforced by the Cloudflare Worker; local preview may differ. See `docs/caching.md` for the full policy and environment nuances. To run the targeted caching tests locally:

```bash
pnpm -s test:e2e -- tests/playwright/performance/caching-strategy.spec.ts
```

---

## 🧑‍💻 Author

Blake Oxford
Built with ❤️ using Astro, pnpm, and Cloudflare.

---

## 📄 License

[MIT](LICENSE)
