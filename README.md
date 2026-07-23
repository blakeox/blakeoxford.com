# blakeoxford.com

Performance-obsessed, accessibility-first personal site built with [Astro](https://astro.build) and deployed on [Cloudflare Workers](https://developers.cloudflare.com/workers/). Portfolio, blog, and edge experiments (Ask AI chat, Find command palette, Vectorize search).

For architecture, quality gates, and agent conventions see [`agent.md`](agent.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Stack

| Layer     | Choice                                                                               |
| --------- | ------------------------------------------------------------------------------------ |
| Framework | Astro 7 SSG (`output: 'static'`)                                                     |
| Islands   | React 19 (`chat`, `command-center`, `contact`, `overlay`)                            |
| Styling   | Tailwind CSS v4 + tokens in `src/styles/theme.css`                                   |
| Content   | Astro Content Collections + MDX / JSON (Zod in `src/content.config.ts`)              |
| Edge      | Cloudflare Worker (`functions/index.ts`) — assets, AI search, email, Durable Objects |
| Quality   | Vitest, Playwright, design-lint, Lighthouse CI, Sentry                               |

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build
pnpm check        # typecheck + design-lint + lint + format + unit tests
pnpm test:e2e     # Playwright
pnpm deploy       # Wrangler → Workers
```

Primary npm scripts: `dev`, `build`, `check`, `test`, `test:e2e`, `deploy`, `quality`. Additional gates live under `quality:*`, `test:e2e:*`, `ci:*`, and `scripts/`.

## Layout

```text
src/
  pages/ layouts/ content/ components/ features/
  lib/ services/ utils/ config/ styles/
functions/          # Worker entry + routes + Durable Object
scripts/            # build, content, optimization, quality
tests/              # Vitest + Playwright
```

Product React features live under `src/features/` (Ask, Find, contact form, overlay). Astro UI layers stay in `src/components/`.

## Edge APIs

Routed by `functions/index.ts`:

- `POST /api/ai-search` — Ask companion (Workers AI / AutoRAG)
- `POST /api/semantic-search` — Vectorize Find
- `/api/conversation-ws` — Durable Object chat state
- `POST /send-email` — contact form
- `POST /api/set-theme`, `/api/ai-feedback`, `/_healthz`

## Content & search

- Blog / projects: MDX in `src/content/`
- Page copy: JSON collections (`home`, `about`, `contact`)
- Search index: generated on `prebuild` into `public/search/` (canonical); legacy `/api/{blog,projects}.json` redirect to `/search/*`

## Docs

- [`agent.md`](agent.md) — architecture map for agents
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — branching, component layers, tests
- [`DESIGN_BEST_PRACTICES.md`](DESIGN_BEST_PRACTICES.md) — design system rules
- In-app: `/design/*`, `/docs/components`

## License

See [LICENSE](LICENSE).
