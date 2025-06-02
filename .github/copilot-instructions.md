# Copilot Instructions for Blake Oxford’s Portfolio

These guidelines apply to all Copilot Chat and code-generation prompts within this repository (`.github/copilot-instructions.md`). They describe our conventions for file structure, styling, naming, accessibility, and component patterns. Follow them when generating new pages, components, or styling rules.

---

## 1. Project Overview

- **Framework**: Astro (“.astro” files for pages and components).  
- **Styling**: Tailwind CSS v4.1 with the Typography (prose) plugin; no inline CSS outside of utility classes.  
- **Language**: Prefer TypeScript for component logic (`.ts` or `.tsx` when using React inside Astro); use JavaScript in `.astro` frontmatter as needed.  
- **Content**: Markdown/MDX under `src/content`, rendered with `<Content {...body} />` and styled using Tailwind’s `prose` classes.  

Whenever you generate or modify code, assume this baseline. Do not deviate from these tools or add unrelated dependencies.

---

## 2. File Structure & Naming

1. **Pages:**  
   - Stored in `src/pages/`.  
   - File names are kebab-case (e.g., `about.astro`, `contact.astro`, `projects/[slug].astro`).  
   - Each page begins with frontmatter:
     ```astro
     ---
     import Layout from '../layouts/BaseLayout.astro';
     const title = "About Me";
     const description = "Learn about Blake Oxford, Systems Architect...";
     const canonicalUrl = "https://blakeoxford.com/about/";
     ---
     ```
   - Always include `Layout` with `title`, `description`, and `url` props.

2. **Layouts:**  
   - Stored in `src/layouts/` (e.g., `BaseLayout.astro`).  
   - Wrap pages with consistent header, footer, and metadata.  
   - Use Tailwind classes for grid or flex-based layout; avoid hardcoded pixel values outside of Tailwind’s scales.

3. **Components:**  
   - Stored in `src/components/`.  
   - File names are PascalCase (e.g., `CoinFlipImage.astro`, `ProjectCard.astro`).  
   - If a component requires logic or state, use a `.tsx` file inside `src/components/` or a paired `.ts` file exporting bindings.  
   - Keep each component focused on a single responsibility (e.g., card rendering, image flip, contact form).

4. **Styles & Theme:**  
   - Do not write CSS other than utility classes in `global.css` or theme variables in `theme.css`.  
   - If custom utility classes are needed—such as `.bg-primary`—add them in `src/styles/global.css` under the existing Tailwind imports.
   - Always use Tailwind’s `prose`, `prose-sm`, `prose-lg`, etc., for Markdown content. Do not override prose styles with inline CSS.
   - For responsive breakpoints, always follow the default Tailwind pattern (`sm:`, `md:`, `lg:`, `xl:`).

---

## 3. Tailwind & Typography

- **Use the Typography Plugin** for any block of Markdown/MDX:
  ```html
  <article class="prose mx-auto max-w-3xl">
    <Content {...body} />
  </article>
  ```

---

## 4. Accessibility (a11y)

- All generated code must meet WCAG AA color contrast (⩾ 4.5:1 for text). Use Tailwind or design tokens for all colors—never hard-code color values.
- Use semantic HTML elements (`<nav>`, `<main>`, `<button>`, etc.) as the default. Only add ARIA roles/attributes when necessary for clarity or screen reader support.
- Always provide descriptive `alt` text for images and icons. Decorative images should use `alt=""`.
- All interactive elements (links, buttons, toggles, menus) must be fully keyboard accessible (Tab, Shift+Tab, Enter, Space, Esc, Arrow keys as appropriate).
- Use a visible focus ring for all focusable elements. The focus ring should use the `--focus-ring` token (2px, brand color) or Tailwind's `ring` utilities.
- Include a skip link to main content at the top of every page (see NavBar.astro and a11y.js for implementation).
- For dropdowns, overlays, and modals: trap focus when open, restore focus when closed, and use ARIA attributes (`aria-modal`, `aria-expanded`, `aria-label`, etc.) as needed.
- Test all components with screen readers and keyboard navigation. Avoid relying solely on hover or mouse events for critical actions.
- Reference the Accessibility section in `STYLEGUIDE.md` for further details and commit checklist.

---

## 5. Third-Party Libraries

- Do not add new dependencies or third-party libraries unless explicitly discussed and approved. The stack must remain focused on Astro, Tailwind CSS, and the documented plugins (e.g., Typography, Lucide/Iconify for icons, Fuse.js for search, Framer Motion for React animations).
- Any exceptions must be justified and documented in the README and/or discussed in a pull request.

---

## 6. Cloud & Hosting (Cloudflare)

- All serverless, API, or hosting-related code must be compatible with Cloudflare Pages and Cloudflare Workers.
- When implementing features such as Edge Functions, KV storage, Turnstile CAPTCHA, or Durable Objects, follow Cloudflare’s best practices and reference the README for supported enhancements.
- Do not use Node.js-only APIs or features not supported by the Cloudflare runtime.
- Ensure all deployment, CI/CD, and CDN configurations are designed for Cloudflare’s global edge network.
- If you need to add or modify cloud/hosting features, document the change and ensure it does not break Cloudflare compatibility.

---