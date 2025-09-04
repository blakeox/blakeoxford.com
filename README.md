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

Progressive multi-phase modernization delivers layered quality gates:


Environment Flags:


These layers create early, low-noise detection for regressions across functionality, performance, accessibility, and UI fidelity while keeping runtime lean.

### 🔁 Flakiness Metrics & Reliability (Phase 2 Add-on)

The test system now tracks per-test flakiness to highlight unstable areas before they degrade confidence:

- History File: `flakiness-history.json` (per test: id, runs, totalRetries, failures, flaky flag, lastRun)
- Tracker: `pnpm flakiness:track` (auto in CI after Playwright JSON reporter output)
- Quality Summary: Adds a Flakiness section with retry intensity sparkline & classification
- Threshold Gate: `pnpm flakiness:check` (optional in quality gate scripts)

Environment Variables:

| Variable | Purpose |
|----------|---------|
| `FLAKINESS_MAX_CURRENT_FLAKY` | Hard cap on number of currently flaky tests (default unset = no cap) |
| `FLAKINESS_MAX_RETRY_INTENSITY` | Max average retries per test-run (totalRetries / totalRuns) |
| `FLAKINESS_STRICT` | Fail if history file missing (default: skip gracefully) |

Trend Classification (retry intensity slope vs mean, last 12 values):

- 5%–15% increase: mild (⚠️)
- 15%–25% increase: moderate (🚨)
- >25% increase: severe (🛑)
- Negative slope: improving (✅) / near-zero: stable or noise (➖)

Example enforcement snippet (CI env):

```bash
FLAKINESS_MAX_CURRENT_FLAKY=0 \
FLAKINESS_MAX_RETRY_INTENSITY=0.05 \
pnpm flakiness:check
```

Add these gates once the history has at least a few runs to avoid failing on cold start.

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

---

## 🧑‍💻 Author

Blake Oxford  
Built with ❤️ using Astro, pnpm, and Cloudflare.

---

## 📄 License

[MIT](LICENSE)
