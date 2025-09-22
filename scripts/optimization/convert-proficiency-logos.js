#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../../src/assets/images/proficiencies');

async function ensureConverted(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') return;

  const base = path.join(SRC_DIR, path.basename(file, ext));
  const srcPath = path.join(SRC_DIR, file);
  const webpPath = `${base}.webp`;
  const avifPath = `${base}.avif`;

  const src = sharp(srcPath);
  const meta = await src.metadata();

  // Convert to WebP if missing
  try {
    await fs.access(webpPath);
    console.log(`ℹ️  WebP exists: ${path.basename(webpPath)}`);
  } catch {
    const buf = await src.webp({ quality: 85 }).toBuffer();
    await fs.writeFile(webpPath, buf);
    const saved = Math.max(0, (meta.size || 0) - buf.length);
    console.log(`✅ Created WebP: ${path.basename(webpPath)} (${Math.round(buf.length/1024)}KB, saved ~${Math.round(saved/1024)}KB)`);
  }

  // Convert to AVIF if missing
  try {
    await fs.access(avifPath);
    console.log(`ℹ️  AVIF exists: ${path.basename(avifPath)}`);
  } catch {
    const buf = await sharp(srcPath).avif({ quality: 80 }).toBuffer();
    await fs.writeFile(avifPath, buf);
    console.log(`✅ Created AVIF: ${path.basename(avifPath)} (${Math.round(buf.length/1024)}KB)`);
  }
}

async function run() {
  const files = await fs.readdir(SRC_DIR);
  const targets = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));
  if (targets.length === 0) {
    console.log('No PNG/JPG logos found to convert.');
    return;
  }
  console.log(`🔧 Converting ${targets.length} logos in ${SRC_DIR}`);
  for (const f of targets) {
    try {
      await ensureConverted(f);
    } catch (e) {
      console.error(`❌ Failed to convert ${f}:`, e.message);
    }
  }
  console.log('🏁 Logo conversion complete.');
}

run();
