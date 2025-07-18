
# Optimized Images Usage

## Generated Files
- `avif/` - Modern AVIF format (best compression)
- `webp/` - WebP format (good compression, wide support)
- `jpeg/` - Optimized JPEG (fallback)
- `png/` - Optimized PNG (for images requiring transparency)

## Responsive Images
Images larger than 640px include responsive variants:
- @320w, @640w, @768w, @1024w, @1280w, @1536w, @1920w

## Usage in HTML
```html
<picture>
  <source srcset="/assets/images/optimized/avif/image@320w.avif 320w,
                  /assets/images/optimized/avif/image@640w.avif 640w,
                  /assets/images/optimized/avif/image@1024w.avif 1024w"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          type="image/avif">
  <source srcset="/assets/images/optimized/webp/image@320w.webp 320w,
                  /assets/images/optimized/webp/image@640w.webp 640w,
                  /assets/images/optimized/webp/image@1024w.webp 1024w"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          type="image/webp">
  <img src="/assets/images/optimized/jpeg/image.jpeg"
       alt="Description"
       loading="lazy">
</picture>
```

## Astro Component Usage
Use the generated JSON manifests to automate picture element generation.
