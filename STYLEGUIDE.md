# Style Guide

This project uses [Tailwind CSS](https://tailwindcss.com/) for most styling, with support for plain CSS and SCSS modules if needed.

## Linting & Formatting

- **Stylelint** is enforced for all CSS, SCSS, and inline styles in `.astro` files.
- **Prettier** is recommended for code formatting (optionally with an Astro plugin).

## File Organization

- Use `src/styles/global.css` for Tailwind and global styles.
- Place reusable component styles in the same folder as the component, or in `src/styles/` if shared.
- Use SCSS only if you need advanced features not available in Tailwind or CSS.

## Tailwind Best Practices

- Prefer utility classes for layout, spacing, and color.
- Use `@apply` in CSS for repeated utility patterns.
- Use Tailwind’s config for custom colors, fonts, and breakpoints.

## Custom CSS/SCSS

- Use BEM or another clear naming convention for custom classes.
- Keep custom CSS minimal and document any design tokens or variables.

## Accessibility

- Use semantic HTML and ARIA attributes as needed.
- Ensure color contrast meets WCAG AA standards.

## Token Usage Policy

- **All design primitives** (colors, spacing, font sizes, font weights, border radius, z-index, etc.) **must use tokens** defined in `src/tokens/` and exposed via Tailwind utility classes.
- **Do not use hardcoded values** (e.g., hex colors, px, rem, em, etc.) in class names, inline styles, or CSS. Always use the corresponding Tailwind class (e.g., `bg-primary`, `text-accent`, `p-4`, `rounded-lg`, etc.).
- **If a needed value is missing from the token set,** add it to the appropriate token file and Tailwind config before using it in the codebase.
- **Code review must enforce this policy.**

> This ensures your design system remains scalable, consistent, and easy to update across the project.

## Color Palette

| Name             | Swatch                                                          | Tailwind Class          | Hex     | Usage                   |
| ---------------- | --------------------------------------------------------------- | ----------------------- | ------- | ----------------------- |
| Primary          | ![#2563eb](https://via.placeholder.com/24/2563eb/000000?text=+) | `bg-primary`            | #2563eb | Main actions, links     |
| Primary Light    | ![#3b82f6](https://via.placeholder.com/24/3b82f6/000000?text=+) | `bg-primary-light`      | #3b82f6 | Hover, focus            |
| Primary Dark     | ![#1e40af](https://via.placeholder.com/24/1e40af/ffffff?text=+) | `bg-primary-dark`       | #1e40af | Active, dark mode       |
| Secondary        | ![#f59e42](https://via.placeholder.com/24/f59e42/000000?text=+) | `bg-secondary`          | #f59e42 | Highlights, accents     |
| Secondary Light  | ![#fbbf24](https://via.placeholder.com/24/fbbf24/000000?text=+) | `bg-secondary-light`    | #fbbf24 | Hover, focus            |
| Secondary Dark   | ![#b45309](https://via.placeholder.com/24/b45309/ffffff?text=+) | `bg-secondary-dark`     | #b45309 | Active, dark mode       |
| Accent           | ![#10b981](https://via.placeholder.com/24/10b981/000000?text=+) | `bg-accent`             | #10b981 | Buttons, highlights     |
| Accent Light     | ![#6ee7b7](https://via.placeholder.com/24/6ee7b7/000000?text=+) | `bg-accent-light`       | #6ee7b7 | Hover, focus            |
| Accent Dark      | ![#047857](https://via.placeholder.com/24/047857/ffffff?text=+) | `bg-accent-dark`        | #047857 | Active, dark mode       |
| Background       | ![#f9fafb](https://via.placeholder.com/24/f9fafb/000000?text=+) | `bg-background`         | #f9fafb | Page background         |
| Background Dark  | ![#18181b](https://via.placeholder.com/24/18181b/ffffff?text=+) | `bg-background-dark`    | #18181b | Dark mode background    |
| Foreground       | ![#18181b](https://via.placeholder.com/24/18181b/ffffff?text=+) | `text-foreground`       | #18181b | Text, headings          |
| Foreground Light | ![#f9fafb](https://via.placeholder.com/24/f9fafb/000000?text=+) | `text-foreground-light` | #f9fafb | Inverted text           |
| Neutral          | ![#64748b](https://via.placeholder.com/24/64748b/ffffff?text=+) | `bg-neutral`            | #64748b | Secondary text, borders |
| Neutral Light    | ![#cbd5e1](https://via.placeholder.com/24/cbd5e1/000000?text=+) | `bg-neutral-light`      | #cbd5e1 | Backgrounds, dividers   |
| Neutral Dark     | ![#334155](https://via.placeholder.com/24/334155/ffffff?text=+) | `bg-neutral-dark`       | #334155 | Dark borders, text      |
| Success          | ![#22c55e](https://via.placeholder.com/24/22c55e/ffffff?text=+) | `bg-success`            | #22c55e | Success states          |
| Success Light    | ![#4ade80](https://via.placeholder.com/24/4ade80/000000?text=+) | `bg-success-light`      | #4ade80 | Success backgrounds     |
| Success Dark     | ![#15803d](https://via.placeholder.com/24/15803d/ffffff?text=+) | `bg-success-dark`       | #15803d | Success accents         |
| Warning          | ![#facc15](https://via.placeholder.com/24/facc15/000000?text=+) | `bg-warning`            | #facc15 | Warning states          |
| Warning Light    | ![#fde047](https://via.placeholder.com/24/fde047/000000?text=+) | `bg-warning-light`      | #fde047 | Warning backgrounds     |
| Warning Dark     | ![#a16207](https://via.placeholder.com/24/a16207/ffffff?text=+) | `bg-warning-dark`       | #a16207 | Warning accents         |
| Error            | ![#ef4444](https://via.placeholder.com/24/ef4444/ffffff?text=+) | `bg-error`              | #ef4444 | Error states            |
| Error Light      | ![#f87171](https://via.placeholder.com/24/f87171/000000?text=+) | `bg-error-light`        | #f87171 | Error backgrounds       |
| Error Dark       | ![#991b1b](https://via.placeholder.com/24/991b1b/ffffff?text=+) | `bg-error-dark`         | #991b1b | Error accents           |
| Info             | ![#0ea5e9](https://via.placeholder.com/24/0ea5e9/ffffff?text=+) | `bg-info`               | #0ea5e9 | Info states             |
| Info Light       | ![#38bdf8](https://via.placeholder.com/24/38bdf8/000000?text=+) | `bg-info-light`         | #38bdf8 | Info backgrounds        |
| Info Dark        | ![#0369a1](https://via.placeholder.com/24/0369a1/ffffff?text=+) | `bg-info-dark`          | #0369a1 | Info accents            |

> All colors are available as Tailwind classes (e.g., `bg-primary`, `text-accent-dark`).

## Typography Tokens

### Font Families

| Name    | CSS Stack                                                 | Usage Class    |
| ------- | --------------------------------------------------------- | -------------- |
| sans    | Inter, ui-sans-serif, system-ui, sans-serif               | `font-sans`    |
| heading | Montserrat, ui-sans-serif, system-ui, sans-serif          | `font-heading` |
| mono    | Fira Mono, ui-monospace, SFMono-Regular, Menlo, monospace | `font-mono`    |

### Font Sizes

| Name | Value    | Usage Class |
| ---- | -------- | ----------- |
| xs   | 0.75rem  | `text-xs`   |
| sm   | 0.875rem | `text-sm`   |
| base | 1rem     | `text-base` |
| lg   | 1.125rem | `text-lg`   |
| xl   | 1.25rem  | `text-xl`   |
| 2xl  | 1.5rem   | `text-2xl`  |
| 3xl  | 1.875rem | `text-3xl`  |
| 4xl  | 2.25rem  | `text-4xl`  |
| 5xl  | 3rem     | `text-5xl`  |
| 6xl  | 3.75rem  | `text-6xl`  |
| 7xl  | 4.5rem   | `text-7xl`  |
| 8xl  | 6rem     | `text-8xl`  |
| 9xl  | 8rem     | `text-9xl`  |

### Font Weights

| Name       | Value | Usage Class       |
| ---------- | ----- | ----------------- |
| thin       | 100   | `font-thin`       |
| extralight | 200   | `font-extralight` |
| light      | 300   | `font-light`      |
| normal     | 400   | `font-normal`     |
| medium     | 500   | `font-medium`     |
| semibold   | 600   | `font-semibold`   |
| bold       | 700   | `font-bold`       |
| extrabold  | 800   | `font-extrabold`  |
| black      | 900   | `font-black`      |

### Line Heights

| Name    | Value | Usage Class       |
| ------- | ----- | ----------------- |
| none    | 1     | `leading-none`    |
| tight   | 1.25  | `leading-tight`   |
| snug    | 1.375 | `leading-snug`    |
| normal  | 1.5   | `leading-normal`  |
| relaxed | 1.625 | `leading-relaxed` |
| loose   | 2     | `leading-loose`   |

### Letter Spacing

| Name    | Value    | Usage Class        |
| ------- | -------- | ------------------ |
| tighter | -0.05em  | `tracking-tighter` |
| tight   | -0.025em | `tracking-tight`   |
| normal  | 0em      | `tracking-normal`  |
| wide    | 0.025em  | `tracking-wide`    |
| wider   | 0.05em   | `tracking-wider`   |
| widest  | 0.1em    | `tracking-widest`  |

## Spacing Scale

| Key | Value   | Usage Class    |
| --- | ------- | -------------- |
| 18  | 4.5rem  | `p-18`, `m-18` |
| 22  | 5.5rem  | `p-22`, `m-22` |
| 26  | 6.5rem  | `p-26`, `m-26` |
| 30  | 7.5rem  | `p-30`, `m-30` |
| 34  | 8.5rem  | `p-34`, `m-34` |
| 38  | 9.5rem  | `p-38`, `m-38` |
| 42  | 10.5rem | `p-42`, `m-42` |

## Breakpoints (Screens)

| Name | Min Width | Media Query Class |
| ---- | --------- | ----------------- |
| xs   | 400px     | `screen:xs`       |
| sm   | 640px     | `screen:sm`       |
| md   | 768px     | `screen:md`       |
| lg   | 1024px    | `screen:lg`       |
| xl   | 1280px    | `screen:xl`       |
| 2xl  | 1536px    | `screen:2xl`      |

## Sizing Tokens

### Max Width

| Name  | Value       | Usage Class   |
| ----- | ----------- | ------------- |
| none  | none        | `max-w-none`  |
| xs    | 20rem       | `max-w-xs`    |
| sm    | 24rem       | `max-w-sm`    |
| md    | 28rem       | `max-w-md`    |
| lg    | 32rem       | `max-w-lg`    |
| xl    | 36rem       | `max-w-xl`    |
| 2xl   | 42rem       | `max-w-2xl`   |
| 3xl   | 48rem       | `max-w-3xl`   |
| 4xl   | 56rem       | `max-w-4xl`   |
| 5xl   | 64rem       | `max-w-5xl`   |
| 6xl   | 72rem       | `max-w-6xl`   |
| 7xl   | 80rem       | `max-w-7xl`   |
| full  | 100%        | `max-w-full`  |
| min   | min-content | `max-w-min`   |
| max   | max-content | `max-w-max`   |
| prose | 65ch        | `max-w-prose` |

### Min Width & Min Height

| Name | Min Width Value | Class        | Min Height Value | Class        |
| ---- | --------------- | ------------ | ---------------- | ------------ |
| 0    | 0               | `min-w-0`    | 0                | `min-h-0`    |
| full | 100%            | `min-w-full` | full             | `min-h-full` |
| min  | min-content     | `min-w-min`  | min              | `min-h-min`  |
| max  | max-content     | `min-w-max`  | max              | `min-h-max`  |
| xs   | 20rem           | `min-w-xs`   |                  |              |
| sm   | 24rem           | `min-w-sm`   |                  |              |
| md   | 28rem           | `min-w-md`   |                  |              |
| lg   | 32rem           | `min-w-lg`   |                  |              |
| xl   | 36rem           | `min-w-xl`   |                  |              |

### Container Padding

| Breakpoint | Padding | Class                     |
| ---------- | ------- | ------------------------- |
| DEFAULT    | 1rem    | `container`               |
| sm         | 2rem    | `container sm:container`  |
| lg         | 4rem    | `container lg:container`  |
| xl         | 5rem    | `container xl:container`  |
| 2xl        | 6rem    | `container 2xl:container` |

## Aspect Ratios

| Name   | Ratio  | Usage Class     |
| ------ | ------ | --------------- |
| square | 1 / 1  | `aspect-square` |
| video  | 16 / 9 | `aspect-video`  |

## Animations

| Name        | Value                          | Class                 |
| ----------- | ------------------------------ | --------------------- |
| spin-slow   | spin 3s linear infinite        | `animate-spin-slow`   |
| fade-in     | fadeIn 0.5s ease-in forwards   | `animate-fade-in`     |
| pulse-slow  | pulseSlow 2s cubic-bezier(...) | `animate-pulse-slow`  |
| bounce-y    | bounceY 1s infinite            | `animate-bounce-y`    |
| slide-up    | slideUp 0.5s easing both       | `animate-slide-up`    |
| slide-down  | slideDown 0.5s easing both     | `animate-slide-down`  |
| slide-left  | slideLeft 0.5s easing both     | `animate-slide-left`  |
| slide-right | slideRight 0.5s easing both    | `animate-slide-right` |

## Keyframes

The following keyframes are defined for use with animations:

- `fadeIn`
- `pulseSlow`
- `bounceY`
- `slideUp`
- `slideDown`
- `slideLeft`
- `slideRight`

---

For more, see the [Tailwind CSS documentation](https://tailwindcss.com/docs) and [Astro styling guide](https://docs.astro.build/en/guides/styling/).
