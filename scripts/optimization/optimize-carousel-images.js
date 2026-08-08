#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = path.join(__dirname, '../../src/assets/images/carousel');
const IN_REPO_ORIGINALS = path.join(OUT_DIR, 'originals');

// Target max dimensions for carousel usage (desktop uses 640x640)
const TARGET_WIDTH = 1280; // Generate crisp assets; Astro will downscale further as needed
const TARGET_HEIGHT = 1280;

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    /* dir exists */
  }
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function resolveSourceDirectory() {
  const candidates = [process.env.CAROUSEL_ORIGINALS_DIR, IN_REPO_ORIGINALS].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) return path.resolve(candidate);
    } catch {
      // Try the next source location.
    }
  }

  return null;
}

async function optimizeOne(sourceDirectory, file) {
  const ext = path.extname(file).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return null;

  const srcPath = path.join(sourceDirectory, file);
  const base = path.basename(file, ext);
  const avifPath = path.join(OUT_DIR, `${base}.avif`);
  const webpPath = path.join(OUT_DIR, `${base}.webp`);
  const [hasAvif, hasWebp] = await Promise.all([fileExists(avifPath), fileExists(webpPath)]);

  if (hasAvif && hasWebp) {
    console.log(`Outputs exist: ${base}.avif, ${base}.webp`);
    return { base, srcPath, avifPath, webpPath };
  }

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
  if (!hasWebp) {
    const webpBuf = await resized.clone().webp({ quality: 78 }).toBuffer();
    await fs.writeFile(webpPath, webpBuf);
    console.log(`WebP: ${path.basename(webpPath)} (${Math.round(webpBuf.length / 1024)}KB)`);
  } else {
    console.log(`WebP exists: ${path.basename(webpPath)}`);
  }

  // Create AVIF if missing
  if (!hasAvif) {
    const avifBuf = await resized.clone().avif({ quality: 55 }).toBuffer();
    await fs.writeFile(avifPath, avifBuf);
    console.log(`AVIF: ${path.basename(avifPath)} (${Math.round(avifBuf.length / 1024)}KB)`);
  } else {
    console.log(`AVIF exists: ${path.basename(avifPath)}`);
  }

  return { base, srcPath, avifPath, webpPath };
}

async function run() {
  await ensureDir(OUT_DIR);

  const sourceDirectory = await resolveSourceDirectory();
  if (!sourceDirectory) {
    console.log(
      `No carousel masters found. Add them under ${IN_REPO_ORIGINALS} or set CAROUSEL_ORIGINALS_DIR. Skipping.`
    );
    return;
  }

  const files = await fs.readdir(sourceDirectory);
  const targets = files.filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file));
  if (targets.length === 0) {
    console.log(`No carousel masters found in ${sourceDirectory}`);
    return;
  }

  console.log(`Optimizing ${targets.length} carousel masters from ${sourceDirectory}`);
  let created = 0;
  let failed = 0;
  for (const file of targets) {
    try {
      const res = await optimizeOne(sourceDirectory, file);
      if (res) created++;
    } catch (error) {
      failed++;
      console.error(`Failed to optimize ${file}:`, error.message);
    }
  }

  console.log(`Carousel optimization complete (${created} processed, ${failed} failed).`);
  if (failed > 0) process.exitCode = 1;
}

run();
