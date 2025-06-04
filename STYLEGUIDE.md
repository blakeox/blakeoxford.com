# 🔖 Design & Code Style‑Guide

> **TL;DR** – Use Tailwind utilities powered by our design‑tokens.  
> Never hard‑code primitives (colours, spacing, etc.) in HTML, CSS, or JavaScript.

---

## 1. Stack

| Layer            | Tool / Standard                              | Purpose                                    |
| ---------------- | -------------------------------------------- | ------------------------------------------ |
| UI framework     | **[Astro](https://astro.build/)**            | Component‑driven, partial hydration        |
| Styling engine   | **[Tailwind CSS](https://tailwindcss.com/)** | Utility‑first classes + token exposure     |
| Lint / quality   | **Stylelint** + **Prettier**                 | Consistent formatting & property ordering  |
| CSS extensions   | Plain CSS / SCSS (optional)                  | For rare cases where utilities fall short |

---

## 2. Linting & Formatting

| Tool       | Scope                           | Notes                                                                                           |
| ---------- | --------------------------------| ------------------------------------------------------------------------------------------------ |
| Stylelint  | `*.css`, `*.scss`, inline `<style>` | Uses the **stylelint‑order** plugin with our custom “Concentric” property order.<br>**`color` must precede any `background*` properties.** |
| Prettier   | all code files                  | Astro plugin is recommended. Runs on commit via Husky.                                           |

Run locally:

```bash
pnpm lint           # Stylelint
pnpm format         # Prettier
```

---

## 3. File Organisation

| Folder / file                | Purpose                                  |
| ---------------------------- | ---------------------------------------- |
| `src/styles/global.css`      | Tailwind base, `@tailwind` directives, custom utility classes (e.g., gradient workarounds). |
| `src/styles/theme.css`       | **Design‑token declarations** (CSS vars; single source of truth for all design primitives) |
| Component folder + `.astro`  | Collocated styles via `<style>` or `*.module.scss` |
| `src/styles/*.scss`          | Shared bespoke styles (rare)             |

> **Note:** All design tokens (colors, spacing, radius, font, etc.) are defined in `theme.css` and mapped one-to-one in `tailwind.config.js` via `theme.extend`. If a token is missing, add it in both files before use. Do not use raw values anywhere in the codebase.

---

## 4. Design‑Token Philosophy

* **Single source of truth** → `src/styles/theme.css`  
* **Mapped one‑to‑one** in `tailwind.config.mjs` (`theme.extend`) for all Tailwind utilities (colors, spacing, radius, font, z-index, shadow, etc.)
* **Never** use raw values (`#2563eb`, `16px`, `2rem`, …) – instead use CSS vars via Tailwind classes:

| Primitive      | ✅ **Do**                                | ❌ **Don’t**     |
| -------------- | ---------------------------------------- | ---------------- |
| Colour         | `class="text-primary-dark"`              | `style="color:#1e40af"` |
| Spacing        | `class="p-4"`                            | `style="padding:1rem"` |
| Radius         | `class="rounded-lg"`                     | `border‑radius:0.5rem` |
| Font size      | `class="text-lg"`                        | `font-size:1.125rem` |
| Z-index        | `class="z-50"`                           | `z-index:50` |
| Shadow         | `class="shadow-lg"`                      | `box-shadow:...` |

If a token is missing, add it in **theme.css** *and* mirror it in **tailwind.config.mjs** before use.

> **Semantic tokens**: Use semantic names for tokens (e.g., `--color-primary`, `--fs-h1`, `--radius-lg`) and reference them in Tailwind config. See `tailwind.config.js` for all mapped utilities.

---

## 4a. Custom Utilities & Plugins

* **Custom utilities** (e.g., `.from-accent`) are defined in `global.css` to work around Tailwind v4+ limitations for gradients. Use these classes as needed for consistent theming.
* **Tailwind plugins**: The project uses the Typography plugin (`@tailwindcss/typography`) for Markdown/MDX content and the Container Queries plugin (`@tailwindcss/container-queries`).
* **Safelist**: Common gradient and color classes are safelisted in `tailwind.config.js` to ensure they are always available, even if not statically detected.

---

## 5. Colour System

| Token            | Swatch | Example Tailwind class | Usage |
| ---------------- | ------ | ---------------------- | ----- |
| `--color-primary` | ![#2563eb](https://via.placeholder.com/18/2563eb/000?text=+) | `bg-primary` | Main CTAs |
| `--color-secondary` | ![#f59e42](https://via.placeholder.com/18/f59e42/000?text=+) | `bg-secondary` | Highlights |
| `--color-accent` | ![#10b981](https://via.placeholder.com/18/10b981/000?text=+) | `bg-accent` | Positive UI accents |
| `--color-tertiary` | ![#8b5cf6](https://via.placeholder.com/18/8b5cf6/000?text=+) | `bg-tertiary` | Optional brand violet |
| Neutral & Functional | ![#64748b](https://via.placeholder.com/18/64748b/000?text=+) | `text-neutral-dark`, `bg-error` etc. | Text, states |

Light / dark / *light‑alpha* variants follow the same naming.

### Gradients

| Name               | CSS variable                      | Tailwind class      |
| ------------------ | --------------------------------- | ------------------- |
| Brand primary      | `--gradient-primary`              | `bg-gradient-primary` |
| Brand secondary    | `--gradient-secondary`            | `bg-gradient-secondary` |
| Brand accent       | `--gradient-accent`               | `bg-gradient-accent` |
| Brand tertiary     | `--gradient-tertiary`             | `bg-gradient-tertiary` |

Tailwind utilities are mapped via `backgroundImage` in `tailwind.config.js`. For dynamic or custom gradients, use the custom utility classes defined in `global.css`.

---

## 6. Surfaces, Elevation & Animation

* **Surface colours** – `--color-surface` / `--color-surface-dark`  
* **Shadow chroma** auto‑switches for dark‑mode (`prefers‑color‑scheme`).  
* Semantic elevation tokens: `--elevation‑{1..5}` → `shadow‑sm` … `shadow‑xl` (all mapped in Tailwind config).
* **All animation, shadow, and z-index utilities** are mapped to tokens in `theme.css` and extended in Tailwind config.

> Use `class="shadow-elevation-3"` (shortcut plugin) instead of picking a size manually.

---

## 7. Typography, Spacing & Responsive

* **Typography**: All font sizes, weights, line heights, and letter spacings are tokenized in `theme.css` and mapped in `tailwind.config.js` (e.g., `text-h1`, `font-heading`, `leading-heading`).
* **Spacing**: Use only Tailwind spacing utilities mapped to tokens (e.g., `p-4`, `gap-18`).
* **Breakpoints**: Responsive breakpoints are defined in both `theme.css` and `tailwind.config.js`.
* **Container max-widths**: Use `max-w-container-lg` etc., as mapped in Tailwind config.

---

## 8. Motion & Duration

| Token                | Value       | Typical usage                            |
| -------------------- | ----------- | ---------------------------------------- |
| `--duration-fast`    | 150 ms      | micro‑feedback (buttons)                 |
| `--duration`         | 250 ms      | default UI transitions                   |
| `--duration-slow`    | 400 ms      | overlays / page transitions              |
| Easings              | `--ease-standard`, `--ease-decelerate`, `--ease-accelerate`, `--ease-emphasized` |

Use via Tailwind plugin **`transition‑token`**:  
`class="transition duration-fast ease-standard"`

---

## 9. Animations

Built‑in keyframes & utilities:

| Class                     | Keyframe    | Purpose                |
| ------------------------- | ----------- | ---------------------- |
| `animate-spin-slow`       | `spin`      | Subtle loaders         |
| `animate-fade-in`         | `fadeIn`    | Appear / mount         |
| `animate-bounce-y`        | `bounceY`   | Attention draw         |
| `animate-shimmer`         | `shimmer`   | Skeleton loaders       |
| `animate-wiggle`          | `wiggle`    | Light playful cue      |
| `animate-slide-[dir]`     | `slide{dir}`| Dialogs, tooltips      |

---

## 10. Accessibility

* All colour combos meet **WCAG AA** (`⩾ 4.5:1` for text).  
* Use semantic HTML (`<button>`, `<nav>`, etc.) and ARIA only when necessary.  
* Keyboard focus ring uses `--focus-ring` (2 px, brand colour).

---

## 11. Commit & Review Checklist

1. **No hard‑coded primitives** – all values come from tokens/Tailwind utilities.  
2. Components are responsive from **xs → 2xl** breakpoints.  
3. Colours pass contrast tests (`pnpm a11y`) in both light & dark.  
4. Stylelint + Prettier pass (`pnpm ci`).  
5. New tokens documented in this Style‑Guide if applicable.

---

## 12. Further Reading

* Tailwind docs – <https://tailwindcss.com/docs>  
* Astro styling – <https://docs.astro.build/en/guides/styling/>  

Stay consistent, keep it tokenised, and your UI will scale beautifully. ✨
