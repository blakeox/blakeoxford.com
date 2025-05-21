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
| `src/styles/global.css`      | Tailwind base, `@tailwind` directives.   |
| `src/styles/theme.css`       | **Design‑token declarations** (CSS vars) |
| Component folder + `.astro`  | Collocated styles via `<style>` or `*.module.scss` |
| `src/styles/*.scss`          | Shared bespoke styles (rare)             |

Prefer co‑locating truly one‑off styles with their component.

---

## 4. Design‑Token Philosophy

* Single source of truth → `src/styles/theme.css`  
* Exposed **one‑to‑one** in `tailwind.config.mjs` (`theme.extend`)  
* **Never** use raw values (`#2563eb`, `16px`, `2rem`, …) – instead use CSS vars via Tailwind classes:

| Primitive      | ✅ **Do**                                | ❌ **Don’t**     |
| -------------- | ---------------------------------------- | ---------------- |
| Colour         | `class="text-primary-dark"`              | `style="color:#1e40af"` |
| Spacing        | `class="p-4"`                            | `style="padding:1rem"` |
| Radius         | `class="rounded-lg"`                     | `border‑radius:0.5rem` |

If a token is missing, add it in **theme.css** *and* mirror it in **tailwind.config.mjs** before use.

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

Tailwind utilities are mapped via `backgroundImage`.

---

## 6. Surfaces & Elevation

* **Surface colours** – `--color-surface` / `--color-surface-dark`  
* **Shadow chroma** auto‑switches for dark‑mode (`prefers‑color‑scheme`).  
* Semantic elevation tokens: `--elevation‑{1..5}` → `shadow‑sm` … `shadow‑xl`.

> Use `class="shadow-elevation-3"` (shortcut plugin) instead of picking a size manually.

---

## 7. Motion & Duration

| Token                | Value       | Typical usage                            |
| -------------------- | ----------- | ---------------------------------------- |
| `--duration-fast`    | 150 ms      | micro‑feedback (buttons)                 |
| `--duration`         | 250 ms      | default UI transitions                   |
| `--duration-slow`    | 400 ms      | overlays / page transitions              |
| Easings              | `--ease-standard`, `--ease-decelerate`, `--ease-accelerate`, `--ease-emphasized` |

Use via Tailwind plugin **`transition‑token`**:  
`class="transition duration-fast ease-standard"`

---

## 8. Animations

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

## 9. Accessibility

* All colour combos meet **WCAG AA** (`⩾ 4.5:1` for text).  
* Use semantic HTML (`<button>`, `<nav>`, etc.) and ARIA only when necessary.  
* Keyboard focus ring uses `--focus-ring` (2 px, brand colour).

---

## 10. Commit & Review Checklist

1. **No hard‑coded primitives** – all values come from tokens/Tailwind utilities.  
2. Components are responsive from **xs → 2xl** breakpoints.  
3. Colours pass contrast tests (`pnpm a11y`) in both light & dark.  
4. Stylelint + Prettier pass (`pnpm ci`).  
5. New tokens documented in this Style‑Guide if applicable.

---

## 11. Further Reading

* Tailwind docs – <https://tailwindcss.com/docs>  
* Astro styling – <https://docs.astro.build/en/guides/styling/>  

Stay consistent, keep it tokenised, and your UI will scale beautifully. ✨
