# Copilot Instructions for Blake Oxford's Portfolio

## About This Project

You are assisting with a **production-grade, performance-first portfolio** built with modern web technologies and deployed globally on Cloudflare's edge network. This is a sophisticated application featuring:

- Static site generation with Astro
- AI-powered chat with RAG (Retrieval-Augmented Generation)
- Real-time WebSocket communication via Durable Objects
- Edge computing for optimal performance
- Comprehensive testing and quality assurance
- Enterprise-grade accessibility (WCAG AA)

## Guiding Principles

When working on this project, always:

1. **Performance First**: Every decision should optimize for speed and minimal JavaScript
2. **Accessibility is Non-Negotiable**: WCAG AA compliance is a requirement, not a goal
3. **Type Safety**: Use TypeScript for all logic; leverage Zod schemas for runtime validation
4. **Test-Driven Quality**: Write tests before or alongside code; maintain quality gates
5. **Edge-Native**: Leverage Cloudflare's edge platform for all dynamic features
6. **Design System Adherence**: Use design tokens exclusively; never hardcode values
7. **Intentional Dependencies**: The stack is minimal by design; justify any additions

## How to Use These Instructions

**Primary Instructions** (this file): High-level architecture, common workflows, and quick reference

**Specialized Instructions** (`.github/instructions/`):
- `design.instructions.md` - Design system, tokens, and visual standards
- `components.instructions.md` - Component architecture, patterns, and organization
- `testing.instructions.md` - Testing practices (Vitest, Playwright, quality gates)
- `playwright.instructions.md` - Playwright-specific test guidelines
- `cloudflare.instructions.md` - Edge computing, Workers, and Durable Objects
- `ai-features.instructions.md` - AI chat widget, RAG, and semantic search

**When to consult specialized instructions**:
- Creating/modifying components → `components.instructions.md`
- Styling or design changes → `design.instructions.md`
- Writing tests → `testing.instructions.md` or `playwright.instructions.md`
- Edge/Worker changes → `cloudflare.instructions.md`
- AI features → `ai-features.instructions.md`

## Recognition Patterns

**Identifying Task Types**:

| User Request Contains | Task Type | Required Context | Specialized File |
|----------------------|-----------|------------------|------------------|
| "add", "create", "new" + "component" | Component creation | Read similar components, check design tokens | `components.instructions.md` |
| "style", "color", "spacing", "looks" | Styling change | Check design tokens, dark mode | `design.instructions.md` |
| "test", "failing", "flaky" | Testing issue | Read test file, check utilities | `testing.instructions.md` |
| "deploy", "worker", "edge", "cloudflare" | Edge/deployment | Check wrangler.toml, environment vars | `cloudflare.instructions.md` |
| "chat", "AI", "search", "vectorize" | AI features | Check AI lib files, Durable Object | `ai-features.instructions.md` |
| "slow", "performance", "lighthouse" | Performance | Run perf tests, check budgets | Section 5 + scripts |
| "accessibility", "a11y", "ARIA", "keyboard" | Accessibility | Run axe tests, check WCAG | `design.instructions.md` + Section 5 |
| "bug", "error", "broken" | Bug fix | Gather context first (tests, logs, files) | Relevant specialized file |

**Before Acting - Always Gather Context**:

1. **For bugs/errors**: Read error messages, check related test files, examine similar working code
2. **For new features**: Search for similar implementations, check existing patterns, read relevant instruction files
3. **For styling**: Check design tokens (`src/styles/theme.css`), find similar components, verify dark mode support
4. **For tests**: Read test utilities, check for similar test patterns, verify test environment setup
5. **For edge/Worker changes**: Check `functions/` directory, review environment bindings, read error logs

---

## 1. Architecture Overview

This is a **performance-first Astro SSG** deployed on Cloudflare Workers with comprehensive optimization tooling and AI-powered features:

- **Framework**: Astro static site generator (`output: 'static'`)
- **Styling**: Tailwind CSS v4 (CSS-first via `@tailwindcss/vite` + Typography plugin); tokens in `src/styles/theme.css` bridged with `@theme inline`
- **Content**: Type-safe content collections (`src/content/config.ts`) for blog posts and projects
- **Testing**: Vitest (unit/component) + Playwright (e2e) + accessibility testing with axe-core
- **Performance**: Custom optimization scripts, critical CSS inlining, image optimization, bundle analysis
- **Edge**: Cloudflare Workers with KV storage, Durable Objects, Workers AI, and Vectorize
- **AI Features**: AI-powered chat widget with RAG (Retrieval-Augmented Generation), semantic search via Vectorize
- **Monitoring**: Sentry error tracking, Analytics Engine, comprehensive quality gates and performance budgets

**Key architectural principle**: Ship minimal JavaScript, optimize everything, maintain 100% accessibility, leverage edge AI for enhanced UX.

---

## 2. Critical Developer Workflows

### Build & Development

```bash
pnpm dev                    # Development server with AI search dev proxy
pnpm build                  # Full build with search index generation
pnpm build             # Production build with git commit tracking
pnpm preview                # Preview built site
pnpm build && pnpm preview           # Build and preview production version
pnpm lint                   # ESLint all files (.js,.ts,.astro,.mdx)
pnpm exec eslint . --ext .js,.ts,.astro,.mdx --fix               # Auto-fix ESLint issues
pnpm typecheck              # TypeScript type checking with Astro
pnpm test                   # Vitest unit tests
pnpm test:coverage          # Run tests with coverage report
pnpm test:e2e              # Playwright e2e tests
pnpm test:e2e:essential:chromium    # Run essential e2e tests only (faster)
pnpm quality full               # Run both test suites (CI)
pnpm test -- --run           # Unit tests
```

### Performance & Optimization

```bash
pnpm optimize:images       # Advanced image optimization
pnpm perf:test             # Performance testing with Lighthouse
./scripts/build/performance-budget.sh  # Size/bundle budget gate
pnpm perf:summary          # Generate performance summary
pnpm perf:long-tasks       # Analyze long tasks
pnpm check   # Run comprehensive quality gate
```

### AI & Search Features

```bash
pnpm build  # search index via prebuild # Generate client search index
pnpm vectorize:index       # Index content in Cloudflare Vectorize
```

### Cloudflare Edge Deployment

```bash
pnpm deploy:worker         # Deploy Worker to Cloudflare
pnpm quality edge:validate         # Validate edge configuration
```

### Quality & Security

```bash
pnpm security:audit        # Audit dependencies for vulnerabilities
pnpm audit:contrast        # Audit color contrast compliance
pnpm quality:summary       # Generate quality metrics summary
pnpm quality:badges        # Generate quality badges
pnpm design:lint           # Lint design system usage
pnpm a11y:trend            # Track accessibility trends
```

---

## 3. File Structure & Naming Conventions

### Pages & Routing

- `src/pages/` - Astro file-based routing (kebab-case filenames)
- API/edge handlers live in `functions/` (Workers), not `src/pages/api/`
- Always include proper frontmatter with Layout, title, description, canonicalUrl

### Components & Assets

- `src/components/` - Organized by category (features/, ui/, layout/, primitives/, islands/)
  - `features/` - Feature-specific components (home/, blog/, contact/, projects/, search/, about/)
  - `ui/` - Reusable UI components
  - `layout/` - Layout components (Header, Footer, etc.)
  - `primitives/` - Base primitive components (Container, Stack, Section, etc.)
  - `islands/` - Interactive client-side islands (React components)
  - `chat/` - AI chat widget components (MessageBubble, etc.)
- `AIChatWidget.astro` - Main AI chat interface component
- `ErrorBoundary.tsx` - React error boundary for client components
- `src/layouts/BaseLayout.astro` - Main layout with critical CSS inlining
- `src/content/` - Type-safe collections (blog/, projects/) with Zod schemas
- `src/lib/` - Utility libraries (chat-types, chat-helpers, ai-search, analytics, etc.)
- `src/styles/global.css` - Tailwind entry (`@import`, plugins) plus theme/components imports
- `src/styles/theme.css` - Design tokens + `@theme inline` bridge
- `src/styles/components.css` - Shared chrome (`layout-gutter`, nav, reduced-motion)

### Testing & Scripts

- `tests/vitest/` - Component and unit tests
- `tests/playwright/` - E2E and accessibility tests
- `tests/accessibility-baseline.json` - Accessibility baseline metrics
- `scripts/` - Build optimization and performance tooling
  - `scripts/optimization/` - Image optimization, quality gates, deployment checks
  - `scripts/quality/` - Quality metrics and contrast audits
  - `scripts/build/` - Build-time scripts and performance testing
  - `scripts/content/` - Content processing (search index generation)
- `functions/` - Cloudflare Workers (functions/index.ts, send-email.js, ConversationDO.js)

---

## 4. Content & Styling Patterns

### Content Collections

Always use the defined Zod schemas in `src/content/config.ts`:

```typescript
// Blog posts: title, description, pubDate, author?, tags?, draft?
// Projects: title, description?, date, image?, tags?, link?, draft?
```

### Styling with Tailwind

- Use CSS variables in `src/styles/theme.css` bridged via `@theme inline` (CSS-first; no JS Tailwind config)
- Typography: wrap Markdown/MDX with the `Prose` primitive (not ad-hoc `prose-*` class walls)
- Dark mode: `class` strategy with `dark:` variants
- Glass morphism: Pre-defined CSS variables for glass surfaces and borders
- **Never** write custom CSS - extend Tailwind or use CSS variables

### Component Patterns

**Image Components**:
- **OptimizedImage.astro**: Use for all images with automatic format conversion
  - When: Any static or content images (blog, projects, hero)
  - Why: Handles AVIF/WebP/JPEG generation, lazy loading, responsive sizes
  - Props: `src`, `alt`, `width`, `height`, `loading="lazy"`
  
- **CoinFlipImage.astro**: Interactive image flipper with proper accessibility
  - When: Need front/back image transition (team photos, cards)
  - Why: Accessible click/keyboard flip with live announcement; hover multi-spin optional
  - Props: `frontSrc`, `backSrc`, `alt`, `altBack`, `size`, `flipMultipleTimes`, `flipOnClick`, `flipAxis`

**Search & Navigation**:
- **SearchOverlay.astro**: Client-side search over a generated index
  - When: Need fuzzy search across blog/projects
  - Why: Fast client-side search with keyboard shortcuts (Cmd+K)
  - Data: Pre-generated search index from `generate:search-index`
  
- **ThemeToggle.jsx**: React component for dark/light mode switching
  - When: Need theme toggle in layout/header
  - Why: Client-side theme persistence with smooth transitions
  - Island: `client:load` for immediate interactivity

**AI Chat Components**:
- **AIChatWidget.astro**: AI chat interface with RAG-powered responses and WebSocket support
  - When: Main chat widget integration point
  - Why: Coordinates AI chat UI, state management, accessibility
  - Deps: Requires ConversationDurableObject deployed
  
- **AIChatIsland.tsx**: React island for AI chat with typing indicators and real-time updates
  - When: Client-side chat logic needed
  - Why: Manages WebSocket connection, typing state, message history
  - Island: `client:only="react"` (no SSR)
  
- **MessageBubble.tsx**: Chat message component with source citations and expandable details
  - When: Rendering individual chat messages
  - Why: Handles user/AI messages, sources, markdown, copy/cite
  - Props: `message`, `role`, `sources[]`, `onCopy`, `onCite`

**Error Handling**:
- **ErrorBoundary.tsx**: React error boundary for graceful client-side error handling
  - When: Wrapping any React islands that might error
  - Why: Prevents full page crashes, shows fallback UI
  - Usage: Wrap islands in `<ErrorBoundary><Island /></ErrorBoundary>`

**Edge/Backend**:
- **ConversationDurableObject** (functions/ConversationDO.js): Stateful WebSocket handler
  - When: Real-time chat, presence, typing indicators needed
  - Why: Maintains conversation state, broadcasts updates, rate limits
  - Bindings: Requires `CONVERSATION_DO`, `AI`, `VECTORIZE_INDEX`, KV namespaces

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
- Edge caching with tiered TTL strategies (immutable hashed assets, stale-while-revalidate for API)
- Bundle analysis and tree shaking with manual vendor chunks
- Search index pre-generation
- CSP reporting and security headers at the edge
- Rate limiting per IP and per session
- **Target**: 95+ Lighthouse scores across all metrics

---

## 6. Anti-Patterns & Common Pitfalls

### ❌ What NOT to Do

**Never:**
- Hardcode colors, spacing, or font sizes (always use design tokens)
- Use `waitForTimeout()` in tests (use deterministic waits from test utilities)
- Add dependencies without discussion (stack is intentionally minimal)
- Skip accessibility testing (required for all interactive features)
- Use `any` type in TypeScript (prefer `unknown` and narrow with guards)
- Write custom CSS when Tailwind utilities exist
- Ignore ESLint warnings (fix or document suppressions)
- Deploy without running quality gates (`pnpm check`)
- Use Cloudflare Pages APIs (deprecated; use Workers flow)
- Increase test retry counts to mask flakiness (fix root cause)

**Common Mistakes:**

1. **Forgetting to read specialized instructions**: Always check `.github/instructions/` for domain-specific guidance
2. **Not running typechecker**: Run `pnpm typecheck` before committing
3. **Skipping quality gates**: CI will catch issues that are faster to fix locally
4. **Hardcoding environment URLs**: Use environment variables for all endpoints
5. **Not testing in dark mode**: Every UI change needs both light and dark mode validation
6. **Ignoring performance budgets**: Check Lighthouse scores for visual changes
7. **Missing ARIA attributes**: Interactive elements need proper accessibility markup
8. **Not updating tests**: Code changes should include test updates

### ✅ Decision Trees

**"I need to create a new component"**
```
1. Is it reusable across features?
   ├─ Yes → Create in src/components/features/ or src/components/primitives/
   └─ No → Create in src/components/features/{feature-name}/

2. Does it need client-side interactivity?
   ├─ Product surface (Ask / Find / contact / overlay) → src/features/<name>/
   └─ No → Create Astro component

3. Before creating:
   ├─ Read components.instructions.md
   ├─ Check for similar existing components
   └─ Plan props interface with TypeScript
```

**"I need to style something"**
```
1. Can this be done with Tailwind utilities?
   ├─ Yes → Use Tailwind classes
   └─ No → Continue to #2

2. Does a design token exist for this?
   ├─ Yes → Use the bridged utility from `@theme inline` in theme.css
   └─ No → Propose new token in design.instructions.md / theme.css

3. Is this component-specific chrome?
   ├─ Yes → Prefer utilities; shared chrome goes in components.css
   └─ No → Create reusable pattern
```

**"A test is failing"**
```
1. Is it flaky (passes on retry)?
   ├─ Yes → Fix timing/race condition (use test utilities)
   └─ No → Continue to #2

2. Does it fail consistently?
   ├─ Yes → Fix the bug or update test expectations
   └─ No → Check for state pollution between tests

3. Do NOT:
   ├─ Increase retry count
   ├─ Add arbitrary timeouts
   └─ Skip the test without investigation
```

---

## 8. Linting & Code Quality

### ESLint Configuration

- **Browser files**: `assets-source/`, `public/`, `src/assets/` - include DOM globals
- **Node files**: `scripts/`, `functions/`, config files - include Node globals  
- **Test files**: Vitest + DOM testing environment
- **Archived files**: Files in `archived-js/` may need manual environment fixes

### Common Patterns

- TypeScript for logic, JavaScript acceptable in Astro frontmatter
- React components only when client-side interactivity needed (React 19.2.0+)
- Use Astro Islands architecture (`client:load`, `client:only`, etc.) for hydration control
- Product React features (Ask / Find / contact / overlay) live in `src/features/`
- Comprehensive testing coverage with property-based testing
- Performance budgets enforced through automation

---

## 7. Code Quality Signals

### 🟢 Good Patterns (Reinforce These)

**Component Design**:
- Props interface with JSDoc comments and TypeScript types
- Single responsibility (one component does one thing well)
- Composition over inheritance (combine smaller components)
- Islands used only when client-side interaction needed
- Error boundaries wrapping React islands

**Styling**:
- All values from design tokens (colors, spacing, typography)
- Responsive modifiers: `sm:`, `md:`, `lg:`, `xl:`
- Dark mode variants: `dark:bg-surface`, `dark:text-primary`
- Semantic class names via `@apply` when needed (rare)
- Glass morphism via CSS variables: `bg-glass` / `var(--color-glass)`

**TypeScript**:
- Strict mode enabled, no `any` types
- Discriminated unions for state (`type Status = 'idle' | 'loading' | 'success' | 'error'`)
- Zod schemas for runtime validation (content collections, API responses)
- Type guards for narrowing (`if (isErrorResponse(data)) { ... }`)
- Exported types from components for reuse

**Testing**:
- Descriptive test names: `it('should display error message when API fails', ...)`
- Deterministic waits: `await page.waitForSelector()`, not `waitForTimeout()`
- Accessibility assertions in every UI test
- Test utilities reused (testUtils.ts, testHelpers.ts)
- Property-based testing for complex logic

### 🟡 Warning Signs (Investigate)

- Component files >300 lines (consider splitting)
- Nested ternaries in JSX (extract to variables)
- Hardcoded strings that should be constants
- Duplicate code across files (extract to utility)
- Tests with >3 retry attempts (fix flakiness)
- Mixed concerns (styling + logic + data fetching in one file)
- Missing error handling (try/catch, error states)
- `console.log` in production code (use proper logging)

### 🔴 Red Flags (Fix Immediately)

- Hardcoded colors/spacing (not using design tokens)
- `any` type in TypeScript (use `unknown` + guards)
- `waitForTimeout()` in tests (use deterministic waits)
- Missing alt text on images (accessibility violation)
- Skipped tests without explanation (`it.skip()` with no comment)
- Disabled ESLint rules without justification
- Client-side API keys (use environment variables)
- Missing error boundaries around React islands
- No ARIA labels on interactive elements
- Performance budget violations (>95 Lighthouse target)

### Code Review Checklist

Before submitting changes, verify:
```bash
# Static Analysis
pnpm lint           # ESLint (0 warnings)
pnpm typecheck      # TypeScript (0 errors)
pnpm design:lint    # Design token usage

# Testing
pnpm test           # Unit tests (15%+ coverage)
pnpm test:e2e       # E2E tests (all pass)
pnpm audit:contrast # Color contrast (4.5:1+)

# Performance
pnpm perf:test      # Lighthouse (95+ all metrics)
./scripts/build/performance-budget.sh  # Size/bundle budget gate

# Security
pnpm security:audit # Dependency vulnerabilities
```

---

## 8. Emergency Procedures

### 🚨 Critical Issues (Act Immediately)

**Site Down / Build Failing**:
```bash
# 1. Check recent changes
git log -5 --oneline
git diff HEAD~1

# 2. Try clean build
pnpm quality clean && pnpm install --frozen-lockfile && pnpm build

# 3. Check for errors
pnpm typecheck
pnpm lint

# 4. Rollback if needed
git revert HEAD
pnpm build && pnpm deploy:worker
```

**Worker Errors (5xx responses)**:
```bash
# 1. View live logs
pnpm exec wrangler tail

# 2. Check Sentry errors
# Visit: https://sentry.io/organizations/[org]/issues/

# 3. Verify environment bindings
pnpm quality edge:validate
cat wrangler.toml  # Check KV, DO, AI bindings

# 4. Test locally
pnpm dev
curl -I http://localhost:4321
```

**Performance Degradation (Lighthouse <90)**:
```bash
# 1. Identify regression
pnpm perf:test
pnpm perf:long-tasks

# 2. Check bundle size
pnpm build
# Review dist/ sizes

# 3. Profile images
pnpm optimize:images

# 4. Check third-party scripts
# Review BaseLayout.astro for new scripts
```

**Security Alert (CSP violations, vulnerabilities)**:
```bash
# 1. Audit dependencies
pnpm security:audit

# 2. Review CSP headers in public/_headers and edge responses

# 3. Update dependencies
pnpm update --latest
pnpm audit fix

# 4. Verify security headers
curl -I https://blakeoxford.com | grep -i "security\\|csp"
```

**AI Features Broken (Chat not working)**:
```bash
# 1. Check Durable Object
pnpm exec wrangler tail --filter ConversationDO

# 2. Verify AI bindings
echo $AI  # Should show Workers AI binding
echo $VECTORIZE_INDEX  # Should show index name

# 3. Test Vectorize index
pnpm vectorize:index  # Reindex content

# 4. Check rate limits
# Review KV: RATE_LIMIT_KV
```

### 🔧 Common Fixes

**Flaky Tests**:
```typescript
// ❌ Don't do this
await page.waitForTimeout(1000);
test.retries = 5;  // Masking flakiness

// ✅ Do this instead
import { waitForElement } from '../testUtils';
await waitForElement(page, '[data-testid="chat-message"]');
await page.waitForLoadState('networkidle');
```

**Type Errors After Update**:
```bash
# Clear cache and reinstall
rm -rf node_modules .astro dist
pnpm install --frozen-lockfile
pnpm typecheck --verbose
```

**Dark Mode Issues**:
```typescript
// Always test both modes
import { setTheme } from '../testUtils';

test('component renders in dark mode', async ({ page }) => {
  await setTheme(page, 'dark');
  // Verify dark mode classes applied
  await expect(page.locator('body')).toHaveClass(/dark/);
});
```

**Build Performance (>60s)**:
```bash
# Disable compression for dev builds
export ENABLE_ASTRO_COMPRESS=false
pnpm build

# Check for bottlenecks
DEBUG=astro:* pnpm build 2>&1 | grep -i "slow\\|warn"
```

### 📞 Escalation Path

1. **Check documentation first**: Relevant `.github/instructions/` file
2. **Review similar working code**: Search codebase for patterns
3. **Check project history**: `git log --grep="[feature]"`, review completion docs
4. **Consult external docs**: Astro docs, Cloudflare docs, library READMEs
5. **If still stuck**: Document what you tried, provide context for user

---

## 9. Integration Points & Dependencies

### Cloudflare Services

- **Workers**: Edge runtime for routing, CSP reporting, security headers, rate limiting, and caching (functions/index.ts)
- **ASSETS binding**: Serves the static build (dist/) from Workers
- **KV**: Contact form storage, AI response caching, rate limiting, and CSP report storage
- **Durable Objects**: ConversationDurableObject for stateful AI chat with WebSocket support, typing indicators, and presence tracking
- **Workers AI**: On-edge AI inference for chat responses
- **Vectorize**: Semantic search index for blog posts and project content
- **Analytics Engine**: AI analytics tracking for usage patterns
- **Web Analytics**: Privacy-friendly analytics (optional)

Note: Cloudflare Pages is deprecated for this project. Do not use `wrangler pages ...`; use the Workers deploy flow instead.

### External APIs

- **Cloudflare Email Service**: Native Worker binding for contact form delivery
- **Client search**: Generated JSON index + local ranking
- **Cloudflare AI**: Workers AI for on-edge inference
- **Cloudflare Vectorize**: Vector database for semantic search
- **Lighthouse CI**: Automated performance testing
- **Sentry**: Error tracking and monitoring (@sentry/astro, @sentry/cloudflare)

### Build Pipeline

- **Astro**: Static site generation with MDX, sitemap, and RSS feed support
- **Vite**: Build tool with React plugin for client components, Lightning CSS minification
- **Sharp**: Image optimization with AVIF/WebP/JPEG format support
- **Lightning CSS**: CSS minification in the Astro/Vite pipeline (no PostCSS Tailwind config)
- **astro-compress**: HTML/CSS/JS compression (conditionally enabled via `ENABLE_ASTRO_COMPRESS=true`)

**Important**: Use `pnpm` as the package manager (pnpm@11.9.0+). Do not add new dependencies without explicit discussion - the stack is intentionally minimal.

---

## 10. Specialized Documentation

For detailed guidance on specific areas, refer to:

### Instruction Files (`.github/instructions/`)
- **design.instructions.md** - Design tokens, Tailwind patterns, accessibility standards, visual hierarchy
- **components.instructions.md** - Component architecture, categories, composition patterns, Islands
- **testing.instructions.md** - Unit/E2E testing, flakiness management, performance testing, quality gates
- **playwright.instructions.md** - Playwright-specific patterns, selectors, deterministic waits
- **cloudflare.instructions.md** - Workers development, edge caching, Durable Objects, security headers
- **ai-features.instructions.md** - Chat widget, RAG implementation, WebSocket patterns, AI analytics

### Project Documentation (`docs/`)
- **COMPONENT_DOCUMENTATION_GUIDE.md** - Component documentation standards and templates
- **DESIGN_BEST_PRACTICES.md** - Detailed design philosophy and token system
- **CONTRIBUTING.md** - Contribution workflow, quality gates, and development practices
- **TYPE_SYSTEM.md** - TypeScript patterns and type safety guidelines

### Reference Files
- `README.md` - Project overview and quick start
- `PHASES_34-42_COMPLETE.md` - Recent feature completions
- `quality-summary.md` - Current quality metrics and trends
- `VECTORIZE_SETUP_INSTRUCTIONS.md` - AI/RAG setup guide

### Quick Start

```bash
pnpm dev                   # Start development
pnpm build                 # Build for production
pnpm quality full              # Run all tests
pnpm check  # Pre-deployment validation
pnpm deploy:worker        # Deploy to Cloudflare
```

### When Making Changes
1. Read relevant instruction file from `.github/instructions/`
2. Follow established patterns in similar components
3. Run `pnpm lint && pnpm typecheck` before committing
4. Add/update tests for new functionality
5. Check quality gates: `pnpm check`

### Need Help?
- Check instruction files for domain-specific guidance
- Review `CONTRIBUTING.md` for workflow details
- Examine existing similar components
- Refer to `docs/` for detailed documentation

---

## 11. Common Workflows & Examples

### When Making Changes
1. Read relevant instruction file from `.github/instructions/`
2. Follow established patterns in similar components
3. Run `pnpm lint && pnpm typecheck` before committing
4. Add/update tests for new functionality
5. Check quality gates: `pnpm check`

### Need Help?
- Check instruction files for domain-specific guidance
- Review `CONTRIBUTING.md` for workflow details
- Examine existing similar components
- Refer to `docs/` for detailed documentation

---

## 11. Common Workflows & Examples

### Adding a New Component

```bash
# 1. Read relevant instructions
cat .github/instructions/components.instructions.md

# 2. Create component file
# src/components/primitives/MyComponent.astro

# 3. Write tests
# tests/vitest/components/MyComponent.test.ts

# 4. Validate
pnpm lint
pnpm typecheck
pnpm test
```

### Making Design Changes

```bash
# 1. Check design tokens
rg -- "--color-" src/styles/theme.css

# 2. Extend the CSS-first theme if needed
# Edit src/styles/theme.css (@theme inline) and global.css (@plugin / variants)

# 3. Apply changes using tokens
# Use Tailwind utilities

# 4. Validate accessibility
pnpm audit:contrast
pnpm test:e2e
```

### Deploying Changes

```bash
# 1. Full quality check
pnpm check

# 2. Build production
pnpm build

# 3. Deploy to edge
pnpm deploy:worker

# 4. Verify deployment
curl -I https://blakeoxford.com
```

---

## 12. Troubleshooting

### Build Failures

**TypeScript errors**:
```bash
pnpm typecheck --verbose  # See detailed errors
```

**Lint errors**:
```bash
pnpm exec eslint . --ext .js,.ts,.astro,.mdx --fix  # Auto-fix many issues
```

**Test failures**:
```bash
pnpm test -- --reporter=verbose  # Detailed test output
pnpm test:e2e --debug  # Debug Playwright tests
```

### Performance Issues

**Slow builds**:
```bash
# Disable compression for faster dev builds
export ENABLE_ASTRO_COMPRESS=false
pnpm build
```

**Lighthouse scores dropping**:
```bash
pnpm perf:test  # Run Lighthouse
pnpm perf:long-tasks  # Identify JS bottlenecks
pnpm perf:summary  # Compare against budgets
```

### Edge/Worker Issues

**Worker not deploying**:
```bash
pnpm quality edge:validate  # Check configuration
pnpm exec wrangler tail  # View live logs
```

**AI features not working**:
```bash
# Check environment variables
echo $AI_SEARCH_API_TOKEN
echo $AI_SEARCH_API_ENDPOINT

# Test locally with dev proxy
pnpm dev
```

### Test Flakiness

```bash
# Check flakiness metrics
pnpm flakiness:track
pnpm flakiness:check

# Review failing tests
node scripts/quality/report-flaky-tests.js
```

---

## 13. Success Criteria

**Before considering a change complete**:

### Code Quality
- [ ] Code follows established patterns from specialized instructions
- [ ] TypeScript types are properly defined (no `any`)
- [ ] Design tokens used (no hardcoded values)
- [ ] No ESLint warnings (or documented suppressions)
- [ ] Imports organized (type imports separated)
- [ ] Console logs removed (unless intentional debug utility)

### Testing
- [ ] Tests written and passing (unit and/or e2e)
- [ ] Test coverage maintained or improved (≥15%)
- [ ] No flaky tests (passes consistently without retries)
- [ ] Accessibility validated (contrast, keyboard, ARIA)
- [ ] Tested in all 3 browsers (Chromium, Firefox, WebKit)

### Visual & UX
- [ ] Dark mode tested (if UI changes)
- [ ] Mobile responsive (if visual changes)
- [ ] Keyboard navigation works (Tab, Enter, Esc, Arrows)
- [ ] Focus indicators visible (no outline removal)
- [ ] Loading states handled (skeletons, spinners)
- [ ] Error states handled (user-friendly messages)

### Performance
- [ ] Performance budgets met (if visual changes)
- [ ] Images optimized (using OptimizedImage.astro)
- [ ] JavaScript bundle impact checked (`pnpm build` output)
- [ ] No layout shifts (test with slow 3G)
- [ ] Lighthouse scores maintained (≥95 all metrics)

### Integration
- [ ] Lint and typecheck passing (`pnpm lint && pnpm typecheck`)
- [ ] Quality gate passes: `pnpm check`
- [ ] Edge deployment validated (if Worker changes)
- [ ] Environment variables documented (if new ones added)
- [ ] Documentation updated (if new patterns)

### Pre-Deployment Checklist
```bash
# Run this before every commit
pnpm lint && pnpm typecheck && pnpm quality full

# Run this before deployment
pnpm check

# Check specific areas if changed
pnpm audit:contrast        # If colors changed
pnpm perf:test            # If visual changes
pnpm test:e2e             # If interactive features changed
```

**Quality Metrics Targets**:

- Lighthouse Performance: ≥95
- Lighthouse Accessibility: ≥95
- Lighthouse Best Practices: ≥95
- Lighthouse SEO: ≥95
- Test Coverage: ≥15% (minimum)
- TypeScript: Strict mode, no errors
- Flakiness: <5% retry rate
- Build Time: <60s (without compression)
- [ ] Loading states handled (skeletons, spinners)
- [ ] Error states handled (user-friendly messages)

### Performance
- [ ] Performance budgets met (if visual changes)
- [ ] Images optimized (using OptimizedImage.astro)
- [ ] JavaScript bundle impact checked (`pnpm build` output)
- [ ] No layout shifts (test with slow 3G)
- [ ] Lighthouse scores maintained (≥95 all metrics)

### Integration
- [ ] Lint and typecheck passing (`pnpm lint && pnpm typecheck`)
- [ ] Quality gate passes: `pnpm check`
- [ ] Edge deployment validated (if Worker changes)
- [ ] Environment variables documented (if new ones added)
- [ ] Documentation updated (if new patterns)

### Pre-Deployment Checklist
```bash
# Run this before every commit
pnpm lint && pnpm typecheck && pnpm quality full

# Run this before deployment
pnpm check

# Check specific areas if changed
pnpm audit:contrast        # If colors changed
pnpm perf:test            # If visual changes
pnpm test:e2e             # If interactive features changed
```

**Quality Metrics Targets**:

- Lighthouse Performance: ≥95
- Lighthouse Accessibility: ≥95
- Lighthouse Best Practices: ≥95
- Lighthouse SEO: ≥95
- Test Coverage: ≥15% (minimum)
- TypeScript: Strict mode, no errors
- Flakiness: <5% retry rate
- Build Time: <60s (without compression)

---

## 14. Quick Command Reference Card

### Essential Daily Commands
```bash
# Development Workflow
pnpm dev                      # Start dev server (http://localhost:4321)
pnpm build                    # Build site + generate search index
pnpm preview                  # Preview build locally

# Pre-Commit Checks (run before every commit)
pnpm lint && pnpm typecheck   # Static analysis
pnpm test                     # Unit tests
pnpm test:e2e:essential:chromium      # Fast e2e tests (~2 min)

# Full Validation (run before PR/deploy)
pnpm quality full                  # All tests (unit + e2e)
pnpm check      # Complete quality checks
```

### Testing & Quality
```bash
# Unit Testing (Vitest)
pnpm test                     # Run all unit tests
pnpm test:coverage            # With coverage report (15%+ target)
pnpm test -- MyComponent      # Run specific test file
pnpm test -- --watch          # Watch mode

# E2E Testing (Playwright)
pnpm test:e2e                # All browsers (Chromium, Firefox, WebKit)
pnpm test:e2e:essential:chromium      # Essential tests only (faster)
pnpm test:e2e:ui             # Interactive UI mode (debugging)
pnpm test:e2e -- --headed    # See browser
pnpm test:e2e -- --debug     # Debug mode with Playwright Inspector

# Quality Assurance
pnpm test -- --run               # Unit tests
pnpm audit:contrast          # Color contrast WCAG AA (4.5:1+)
pnpm a11y:trend             # Accessibility trend analysis
pnpm design:lint            # Design token usage audit
pnpm security:audit         # Dependency vulnerabilities
```

### Performance & Optimization
```bash
# Performance Testing
pnpm perf:test              # Lighthouse (target: 95+ all metrics)
./scripts/build/performance-budget.sh  # Size/bundle budget gate
pnpm perf:summary           # Generate summary report
pnpm perf:long-tasks        # Analyze JS long tasks (>50ms)

# Optimization
pnpm optimize:images        # Advanced image optimization (AVIF/WebP)
pnpm build            # Production build with git tracking
pnpm quality:summary       # Quality metrics dashboard
pnpm quality:badges        # Generate quality badges
```

### Cloudflare Edge
```bash
# Deployment
pnpm deploy:worker          # Deploy Worker to Cloudflare
pnpm quality edge:validate         # Validate edge configuration

# AI & Search
pnpm build  # search index via prebuild  # Generate client search index
pnpm vectorize:index       # Index content in Vectorize (RAG)

# Debugging
pnpm exec wrangler tail     # Live Worker logs
pnpm exec wrangler tail --filter ConversationDO  # Durable Object logs
pnpm exec wrangler dev     # Local Worker dev mode
```

### Code Quality
```bash
# Linting
pnpm lint                   # ESLint (.js,.ts,.astro,.mdx)
pnpm exec eslint . --ext .js,.ts,.astro,.mdx --fix              # Auto-fix issues
pnpm typecheck             # TypeScript + Astro type checking

# Build Variants
pnpm quality clean         # Remove dist/, .astro/, node_modules/.vite
pnpm build                 # Standard build
pnpm build           # Production build (with git commit ID)
export ENABLE_ASTRO_COMPRESS=false && pnpm build  # Fast dev build
```

### Debugging & Diagnostics
```bash
# View Reports
cat quality-summary.md              # Quality metrics
cat deployment-summary.json         # Last deployment info
cat long-tasks-report.json         # Performance bottlenecks
cat tests/accessibility-baseline.json  # A11y baseline

# Troubleshooting
node scripts/quality/report-flaky-tests.js  # Flakiness report
pnpm flakiness:check                # Check flakiness metrics
pnpm exec wrangler whoami           # Verify Cloudflare auth
pnpm exec astro info                # Astro environment info

# Live Monitoring
pnpm exec wrangler tail             # Worker logs (production)
DEBUG=astro:* pnpm dev             # Verbose Astro logs
```

### Common Workflows
```bash
# New Component
# 1. Create component file in src/components/[category]/
# 2. Create test in tests/vitest/components/
pnpm typecheck && pnpm test

# Styling Change
# 1. Check design tokens in src/styles/theme.css
# 2. Apply changes using Tailwind utilities
pnpm audit:contrast && pnpm test:e2e

# Bug Fix
# 1. Write failing test first
# 2. Fix the bug
# 3. Verify test passes
pnpm test && pnpm test:e2e

# Deploy Changes
pnpm check    # Full validation
pnpm build            # Production build
pnpm deploy:worker         # Deploy to edge
curl -I https://blakeoxford.com  # Verify
```

### Emergency Commands
```bash
# Rollback Deployment
git revert HEAD
pnpm build && pnpm deploy:worker

# Force Clean Build
rm -rf node_modules .astro dist
pnpm install --frozen-lockfile
pnpm build

# Fix Flaky Tests
node scripts/quality/report-flaky-tests.js
pnpm test:e2e -- --repeat-each=10  # Test stability
```
