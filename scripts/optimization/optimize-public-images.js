#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../../public/assets/images');

async function ensureSiblings(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return false;
  const base = filePath.slice(0, -ext.length);
  const webpPath = `${base}.webp`;
  const avifPath = `${base}.avif`;

  try {
    await fs.access(webpPath);
  } catch {
    const buf = await sharp(filePath).webp({ quality: 80 }).toBuffer();
    await fs.writeFile(webpPath, buf);
    console.log(`✅ public webp: ${path.basename(webpPath)} (${Math.round(buf.length/1024)}KB)`);
  }

  try {
    await fs.access(avifPath);
  } catch {
    const buf = await sharp(filePath).avif({ quality: 55 }).toBuffer();
    await fs.writeFile(avifPath, buf);
    console.log(`✅ public avif: ${path.basename(avifPath)} (${Math.round(buf.length/1024)}KB)`);
  }
  return true;
}

async function run() {
  try {
    const entries = await fs.readdir(PUBLIC_DIR, { withFileTypes: true });
    const files = entries.filter(e => e.isFile()).map(e => path.join(PUBLIC_DIR, e.name));
    let processed = 0;
    for (const f of files) {
      try { if (await ensureSiblings(f)) processed++; } catch (e) { console.error('❌ public optimize failed:', e.message); }
    }
    console.log(`🏁 Public image optimization complete (${processed} processed).`);
  } catch {
    // directory may not exist in some builds
    console.log('ℹ️  No public/assets/images directory found. Skipping.');
  }
}

run();
