#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../../src/assets/images/carousel');

// Target max dimensions for carousel usage (desktop uses 640x640)
const TARGET_WIDTH = 1280;   // Generate crisp assets; Astro will downscale further as needed
const TARGET_HEIGHT = 1280;

async function ensureDir(dir) {
  try { await fs.mkdir(dir, { recursive: true }); } catch { /* dir exists */ }
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function optimizeOne(file) {
  const ext = path.extname(file).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return null;

  const srcPath = path.join(SRC_DIR, file);
  const base = path.basename(file, ext);
  const avifPath = path.join(SRC_DIR, `${base}.avif`);
  const webpPath = path.join(SRC_DIR, `${base}.webp`);
  const originalsDir = path.join(SRC_DIR, 'originals');

  const input = sharp(srcPath, { limitInputPixels: false });
  const meta = await input.metadata();

  // Resize if larger than target to cap memory/size
  const resized = input.resize({
    width: Math.min(TARGET_WIDTH, meta.width || TARGET_WIDTH),
    height: Math.min(TARGET_HEIGHT, meta.height || TARGET_HEIGHT),
    fit: 'inside',
    withoutEnlargement: true,
  });

  // Create WebP if missing
  if (!(await fileExists(webpPath))) {
    const webpBuf = await resized.clone().webp({ quality: 78 }).toBuffer();
    await fs.writeFile(webpPath, webpBuf);
    console.log(`✅ WebP: ${path.basename(webpPath)} (${Math.round(webpBuf.length/1024)}KB)`);
  } else {
    console.log(`ℹ️  WebP exists: ${path.basename(webpPath)}`);
  }

  // Create AVIF if missing
  if (!(await fileExists(avifPath))) {
    const avifBuf = await resized.clone().avif({ quality: 55 }).toBuffer();
    await fs.writeFile(avifPath, avifBuf);
    console.log(`✅ AVIF: ${path.basename(avifPath)} (${Math.round(avifBuf.length/1024)}KB)`);
  } else {
    console.log(`ℹ️  AVIF exists: ${path.basename(avifPath)}`);
  }

  // If the original is a very large PNG/JPG (> 2MB), move it out of the import path
  try {
    const stat = await fs.stat(srcPath);
    const isOriginalFormat = ['.png', '.jpg', '.jpeg'].includes(ext);
    if (isOriginalFormat && stat.size > 2 * 1024 * 1024 && !srcPath.includes(`${path.sep}originals${path.sep}`)) {
      await ensureDir(originalsDir);
      const dest = path.join(originalsDir, path.basename(srcPath));
      await fs.rename(srcPath, dest);
      console.log(`📦 Moved large original to originals/: ${path.basename(srcPath)} (${Math.round(stat.size/1024)}KB)`);
    }
  } catch { /* ignore move errors */ }

  return { base, srcPath, avifPath, webpPath };
}

async function run() {
  await ensureDir(SRC_DIR);
  const files = await fs.readdir(SRC_DIR);
  const targets = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
  if (targets.length === 0) {
    console.log(`No carousel images found in ${SRC_DIR}`);
    return;
  }
  console.log(`🔧 Optimizing ${targets.length} carousel images in ${SRC_DIR}`);
  let created = 0;
  for (const f of targets) {
    try {
      const res = await optimizeOne(f);
      if (res) created++;
    } catch (e) {
      console.error(`❌ Failed to optimize ${f}:`, e.message);
    }
  }
  console.log(`🏁 Carousel optimization complete (${created} processed).`);
}

run();
