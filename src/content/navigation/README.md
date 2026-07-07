# Navigation content (reference)

The live site navigation is driven by **`src/config/navLinks.ts`**, which powers `NavBar.astro` and search index generation.

The JSON files in this folder are a **content-collection mirror** for documentation and future CMS-style workflows. They are not loaded by the production nav bar today.

When updating navigation labels or hrefs, change `navLinks.ts` first, then sync these JSON files if you want them to stay aligned.

CI enforces link parity via `tests/vitest/navLinksSync.test.ts`.
