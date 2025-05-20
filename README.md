# 🌐 Personal Portfolio Site

A blazing-fast, modern portfolio site built with [Astro](https://astro.build), designed to be deployed on [Cloudflare Pages](https://pages.cloudflare.com/). This project emphasizes performance, clean design, edge delivery, privacy, and minimal client-side JavaScript.

---

## 🎯 Project Goals

- Showcase personal projects and achievements
- Include an About page and optionally a Blog
- Support Markdown + MDX content formats
- Achieve excellent Lighthouse scores (performance, SEO, a11y)
- Deploy using Cloudflare Pages for edge-speed delivery
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
- [Cloudflare Pages](https://pages.cloudflare.com/)
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

- Node.js v18+
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

## 🛰️ Deployment (Cloudflare Pages)

1. Push this repo to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Connect your repo
4. Use these build settings:
   - **Framework preset**: None
   - **Build command**: `pnpm build`
   - **Output directory**: `dist`

---

## 🧠 Future Enhancements

- Add project filtering or tagging system
- Integrate a headless CMS (e.g., Sanity, Notion API)
- Add blog with MDX + RSS feed (`@astrojs/rss`)
- Light/Dark theme toggle with Tailwind
- Offline support via Service Workers (e.g., Workbox)
- Webhook or GitHub Action to re-deploy on CMS updates

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

- All requests served via Cloudflare's global CDN
- Zero JS by default unless needed
- CSP, X-Frame-Options, and other headers enforced
- Optional rate limiting and Turnstile CAPTCHA on sensitive endpoints

---

## 🧑‍💻 Author

Blake Oxford  
Built with ❤️ using Astro, pnpm, and Cloudflare.

---

## 📄 License

[MIT](LICENSE)
