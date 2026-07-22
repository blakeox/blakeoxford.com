# Carousel master images (local only)

Masters are **not** stored in git. Optimized WebP/AVIF in this folder are what Astro imports.

## Local path (this machine)

```text
~/Documents/blakeoxford-local/carousel-originals
```

A gitignored symlink `originals →` that directory may exist for convenience.

## Regenerate outputs

```bash
# optional override
# export CAROUSEL_ORIGINALS_DIR=/path/to/masters

pnpm exec node scripts/optimization/optimize-carousel-images.js
# or: pnpm prebuild
```

Then commit only `.webp` / `.avif` changes under `src/assets/images/carousel/`.
