#!/usr/bin/env node

/**
 * Automated Image Optimization Pipeline
 * Converts images to modern formats and generates responsive versions
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, '../../public/assets/images');
const OUTPUT_DIR = path.join(__dirname, '../../public/assets/images/optimized');

// Image optimization configurations
const FORMATS = {
  avif: { quality: 80, effort: 4 },
  webp: { quality: 85, effort: 4 },
  jpeg: { quality: 85, progressive: true },
  png: { compressionLevel: 9 }
};

const RESPONSIVE_SIZES = [320, 640, 768, 1024, 1280, 1536, 1920];

async function ensureDirectory(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function responsiveWidths(originalWidth) {
  if (!originalWidth || originalWidth <= 640) return [];
  return RESPONSIVE_SIZES.filter((width) => width < originalWidth);
}

async function optimizedOutputsExist(nameWithoutExt, originalWidth) {
  const widths = responsiveWidths(originalWidth);
  const needed = [];

  for (const format of Object.keys(FORMATS)) {
    needed.push(path.join(OUTPUT_DIR, format, `${nameWithoutExt}.${format}`));
    for (const width of widths) {
      needed.push(path.join(OUTPUT_DIR, format, `${nameWithoutExt}@${width}w.${format}`));
    }
  }

  needed.push(path.join(OUTPUT_DIR, `${nameWithoutExt}.json`));

  for (const filePath of needed) {
    if (!(await fileExists(filePath))) return false;
  }
  return true;
}

async function optimizeImage(inputPath, filename) {
  const nameWithoutExt = path.parse(filename).name;

  // Skip if already optimized
  if (filename.includes('.optimized.') || filename.includes('@')) {
    return;
  }

  console.log(`🖼️  Processing: ${filename}`);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    const originalWidth = metadata.width;
    const force = process.env.FORCE_OPTIMIZE === '1';

    if (!force && (await optimizedOutputsExist(nameWithoutExt, originalWidth))) {
      console.log('   ⏭️  Outputs exist — skipping (set FORCE_OPTIMIZE=1 to regenerate)');
      return;
    }

    // Generate responsive sizes for each format
    for (const format of Object.keys(FORMATS)) {
      const formatDir = path.join(OUTPUT_DIR, format);
      await ensureDirectory(formatDir);

      // Original size in new format
      const originalOutputPath = path.join(formatDir, `${nameWithoutExt}.${format}`);
      await image.clone()[format](FORMATS[format]).toFile(originalOutputPath);

      // Responsive sizes (only if image is large enough)
      for (const width of responsiveWidths(originalWidth)) {
        const responsiveOutputPath = path.join(formatDir, `${nameWithoutExt}@${width}w.${format}`);
        await image.clone()
          .resize(width, null, { withoutEnlargement: true })
          // eslint-disable-next-line no-unexpected-multiline
          [format](FORMATS[format])
          .toFile(responsiveOutputPath);
      }
    }

    // Generate srcset manifest
    const srcsetData = {
      original: filename,
      formats: Object.keys(FORMATS),
      sizes: responsiveWidths(originalWidth),
      width: originalWidth,
      height: metadata.height
    };

    const manifestPath = path.join(OUTPUT_DIR, `${nameWithoutExt}.json`);
    await fs.writeFile(manifestPath, JSON.stringify(srcsetData, null, 2));

    console.log(`   ✅ Generated ${Object.keys(FORMATS).length} formats with responsive variants`);

  } catch (error) {
    console.error(`   ❌ Error processing ${filename}:`, error.message);
  }
}

async function generateOptimizedImages() {
  console.log('🚀 AUTOMATED IMAGE OPTIMIZATION PIPELINE\n');

  await ensureDirectory(OUTPUT_DIR);

  try {
    const files = await fs.readdir(INPUT_DIR);
    const imageFiles = files.filter(file =>
      /\.(jpg|jpeg|png|webp)$/i.test(file) &&
      !file.includes('.optimized.')
    );

    console.log(`📂 Found ${imageFiles.length} images to process\n`);

    for (const file of imageFiles) {
      const inputPath = path.join(INPUT_DIR, file);
      await optimizeImage(inputPath, file);
    }

    // Generate usage instructions
    const usageInstructions = `
# Optimized Images Usage

## Generated Files
- \`avif/\` - Modern AVIF format (best compression)
- \`webp/\` - WebP format (good compression, wide support)
- \`jpeg/\` - Optimized JPEG (fallback)
- \`png/\` - Optimized PNG (for images requiring transparency)

## Responsive Images
Images larger than 640px include responsive variants:
- @320w, @640w, @768w, @1024w, @1280w, @1536w, @1920w

## Usage in HTML
\`\`\`html
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
\`\`\`

## Astro Component Usage
Use the generated JSON manifests to automate picture element generation.
`;

    await fs.writeFile(path.join(OUTPUT_DIR, 'README.md'), usageInstructions);

    console.log('\n🎉 Image optimization complete!');
    console.log(`   Output directory: ${OUTPUT_DIR}`);
    console.log(`   Formats generated: ${Object.keys(FORMATS).join(', ')}`);
    console.log(`   Responsive breakpoints: ${RESPONSIVE_SIZES.join(', ')}`);

  } catch (error) {
    console.error('❌ Error during image optimization:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateOptimizedImages();
}

export { generateOptimizedImages };
