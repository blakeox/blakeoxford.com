#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECTS_DIR = path.join(__dirname, '../../public/assets/projects');
const MAX_WIDTH = 1400; // keep quality but reduce oversized images
const PNG_OPTIONS = { compressionLevel: 9, quality: 85, palette: true }; // palette requires libimagequant; sharp will ignore if unsupported

async function optimizePng(filePath) {
  try {
    const buf = await fs.readFile(filePath);
    const image = sharp(buf);
    const meta = await image.metadata();
    let pipeline = image;

    if (meta.width && meta.width > MAX_WIDTH) {
      pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }

    const optimized = await pipeline.png(PNG_OPTIONS).toBuffer();

    if (optimized.length < buf.length) {
      await fs.writeFile(filePath, optimized);
      const savedKB = Math.round((buf.length - optimized.length) / 1024);
      console.log(`✅ Optimized ${path.basename(filePath)} (-${savedKB} KB)`);
    } else {
      console.log(`ℹ️  Skipped ${path.basename(filePath)} (no size improvement)`);
    }
  } catch (e) {
    console.error(`❌ Failed to optimize ${filePath}:`, e.message);
    throw e;
  }
}

async function run() {
  const files = await fs.readdir(PROJECTS_DIR);
  const pngs = files.filter((f) => f.toLowerCase().endsWith('.png'));
  let failures = 0;
  console.log(`🔧 Optimizing ${pngs.length} project PNGs in ${PROJECTS_DIR}`);
  for (const f of pngs) {
    try {
      await optimizePng(path.join(PROJECTS_DIR, f));
    } catch {
      failures += 1;
    }
  }
  if (failures > 0) throw new Error(`Project image optimization failed for ${failures} file(s)`);
  console.log('🏁 Project image optimization complete.');
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
