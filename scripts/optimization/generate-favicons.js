#!/usr/bin/env node
/**
 * Generate favicon + PWA icon PNGs (and favicon.ico) from public/favicon.svg.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const SVG_PATH = path.join(ROOT, 'public/favicon.svg');
const IMAGES_DIR = path.join(ROOT, 'public/assets/images');
const ICO_PATH = path.join(ROOT, 'public/favicon.ico');

const SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-96x96.png', size: 96 },
  { name: 'favicon.png', size: 64 },
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
];

async function renderPng(size) {
  return sharp(SVG_PATH, { density: Math.max(72, size * 3) })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function writeOptimizedMeta(original, width, height) {
  const base = path.basename(original, path.extname(original));
  const metaPath = path.join(IMAGES_DIR, 'optimized', `${base}.json`);
  const payload = {
    original: path.basename(original),
    formats: ['avif', 'webp', 'jpeg', 'png'],
    sizes: [],
    width,
    height,
  };
  await fs.writeFile(metaPath, `${JSON.stringify(payload, null, 2)}\n`);
}

async function writeModernSiblings(pngPath, buf) {
  const ext = path.extname(pngPath);
  const base = pngPath.slice(0, -ext.length);
  await fs.writeFile(`${base}.webp`, await sharp(buf).webp({ quality: 90 }).toBuffer());
  await fs.writeFile(`${base}.avif`, await sharp(buf).avif({ quality: 60 }).toBuffer());
}

async function writeIco(png32, png16) {
  const tmp16 = path.join(IMAGES_DIR, '.tmp-favicon-16.png');
  const tmp32 = path.join(IMAGES_DIR, '.tmp-favicon-32.png');
  try {
    await fs.writeFile(tmp16, png16);
    await fs.writeFile(tmp32, png32);
    await execFileAsync('magick', [tmp16, tmp32, ICO_PATH]);
  } finally {
    await fs.unlink(tmp16).catch(() => {});
    await fs.unlink(tmp32).catch(() => {});
  }
}

async function run() {
  await fs.access(SVG_PATH);
  await fs.mkdir(path.join(IMAGES_DIR, 'optimized'), { recursive: true });

  const rendered = new Map();
  for (const { name, size } of SIZES) {
    const buf = await renderPng(size);
    const outPath = path.join(IMAGES_DIR, name);
    await fs.writeFile(outPath, buf);
    await writeModernSiblings(outPath, buf);
    await writeOptimizedMeta(outPath, size, size);
    rendered.set(name, buf);
    console.log(`✅ ${name} (${size}×${size})`);
  }

  await writeIco(rendered.get('favicon-32x32.png'), rendered.get('favicon-16x16.png'));
  console.log(`✅ favicon.ico`);
  console.log('🏁 Favicon generation complete.');
}

run().catch((error) => {
  console.error('❌ Favicon generation failed:', error);
  process.exit(1);
});
