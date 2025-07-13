# Copilot Instructions for Blake Oxford's Portfolio

These guidelines apply to all Copilot Chat and code-generation prompts within this repository (`.github/copilot-instructions.md`). They describe our conventions for file structure, styling, naming, accessibility, component patterns, and critical developer workflows.

---

## 1. Architecture Overview

This is a **performance-first Astro SSG** built for Cloudflare Pages with comprehensive optimization tooling:

- **Framework**: Astro static site generator (`output: 'static'`)
- **Styling**: Tailwind CSS v4.1 with Typography plugin; CSS variables for theming (`src/styles/global.css`)
- **Content**: Type-safe content collections (`src/content/config.ts`) for blog posts and projects
- **Testing**: Vitest (unit/component) + Playwright (e2e) + accessibility testing with axe-core
- **Performance**: Custom optimization scripts, critical CSS inlining, image optimization, bundle analysis
- **Edge**: Cloudflare Workers/Pages with KV storage for forms and edge computing

**Key architectural principle**: Ship minimal JavaScript, optimize everything, maintain 100% accessibility.

---

## 2. Critical Developer Workflows

### Build & Development

```bash
pnpm dev                    # Development server
pnpm build                  # Full build with search index generation
pnpm preview                # Preview built site
pnpm lint                   # ESLint all files (.js,.ts,.astro,.mdx)
pnpm test                   # Vitest unit tests
pnpm test:e2e              # Playwright e2e tests
pnpm test:ci               # Run both test suites (CI)
```

### Performance & Optimization

```bash
pnpm optimize:advanced      # Run full optimization suite
pnpm perf:test             # Performance testing with Lighthouse
pnpm critical:css          # Generate critical CSS
pnpm optimize:images       # Advanced image optimization
pnpm analyze:bundle        # Bundle analysis and recommendations
```

### Cloudflare Edge

```bash
pnpm edge:deploy           # Deploy edge functions
wrangler pages deploy dist # Manual pages deployment
```

**Important**: Always run `pnpm generate:search-index` before build. The build script does this automatically.

---

## 3. File Structure & Naming Conventions

### Pages & Routing

- `src/pages/` - Astro file-based routing (kebab-case filenames)
- `src/pages/api/` - API endpoints for forms/contact
- Always include proper frontmatter with Layout, title, description, canonicalUrl

### Components & Assets

- `src/components/` - PascalCase component files (.astro or .tsx for React)
- `src/layouts/BaseLayout.astro` - Main layout with critical CSS inlining
- `src/content/` - Type-safe collections (blog/, projects/) with Zod schemas
- `src/styles/global.css` - Theme variables and Tailwind imports

### Testing & Scripts

- `tests/vitest/` - Component and unit tests
- `tests/playwright/` - E2E and accessibility tests  
- `scripts/` - Build optimization and performance tooling
- `functions/` - Cloudflare Workers (edge-computing.js, send-email.js)

---

## 4. Content & Styling Patterns

### Content Collections

Always use the defined Zod schemas in `src/content/config.ts`:

```typescript
// Blog posts: title, description, pubDate, author?, tags?, draft?
// Projects: title, description?, date, image?, tags?, link?, draft?
```

### Styling with Tailwind

- Use CSS variables mapped to Tailwind (see `tailwind.config.js` color extensions)
- Typography: Always wrap Markdown with `prose` classes
- Dark mode: `class` strategy with `dark:` variants
- Glass morphism: Pre-defined CSS variables for glass surfaces and borders
- **Never** write custom CSS - extend Tailwind or use CSS variables

### Component Patterns

- **OptimizedImage.astro**: Use for all images with automatic format conversion
- **CoinFlipImage.astro**: Interactive image flipper with proper accessibility
- **SearchOverlay.astro**: Client-side search with Fuse.js
- **ThemeToggle.jsx**: React component for dark/light mode switching

---

## 5. Accessibility & Performance Requirements

### Accessibility (WCAG AA)

- 4.5:1 color contrast minimum
- Full keyboard navigation (Tab, Enter, Esc, Arrows)
- Screen reader support with proper ARIA attributes
- Focus management in modals/overlays
- Skip links on every page
- **Test with**: `@axe-core/playwright` in e2e tests

### Performance Optimizations

- Critical CSS inlined in `BaseLayout.astro`
- Resource preloading for key assets
- Advanced image optimization with multiple formats (AVIF, WebP, JPEG)
- Bundle analysis and tree shaking
- Search index pre-generation
- **Target**: 95+ Lighthouse scores across all metrics

---

## 6. Linting & Code Quality

### ESLint Configuration

The project uses a complex ESLint setup with environment-specific rules:

- **Browser files**: `assets-source/`, `public/`, `src/assets/` - include DOM globals
- **Node files**: `scripts/`, `functions/`, config files - include Node globals  
- **Test files**: Vitest + DOM testing environment

### Common Patterns

- TypeScript for logic, JavaScript acceptable in Astro frontmatter
- React components only when client-side interactivity needed
- Comprehensive testing coverage with property-based testing
- Performance budgets enforced through automation

---

## 7. Integration Points & Dependencies

### Cloudflare Services

- **Pages**: Static hosting with preview deployments
- **KV**: Contact form storage and rate limiting
- **Workers**: Edge functions for form processing
- **Web Analytics**: Privacy-friendly analytics

### External APIs

- **Resend**: Email delivery service (contact forms)
- **Fuse.js**: Client-side fuzzy search
- **Lighthouse CI**: Automated performance testing

### Build Pipeline

- **Astro**: Static site generation with MDX support
- **Vite**: Build tool with React plugin for client components
- **Sharp**: Image optimization
- **PostCSS**: CSS processing with Tailwind

**Do not add new dependencies** without explicit discussion - the stack is intentionally minimal.
