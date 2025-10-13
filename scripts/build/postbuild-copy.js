import { cpSync, existsSync, writeFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, extname } from 'node:path';

const dist = join(process.cwd(), 'dist');

// Copy _headers and _redirects if present
for (const f of ['_headers', '_redirects']) {
  if (existsSync(join(process.cwd(), f))) {
    cpSync(join(process.cwd(), f), join(dist, f), { recursive: false });
    console.log(`Copied ${f} -> dist/${f}`);
  }
}

// Add a basic .assetsignore to skip junk
const ignorePath = join(dist, '.assetsignore');
try {
  writeFileSync(ignorePath, '**/.DS_Store\n**/.git\n**/node_modules\n');
  console.log('Created dist/.assetsignore');
} catch { /* noop */ }

// Remove any test-only debug artifacts that should never ship
try {
  const testOnlyFiles = [
    'search-debug-manual.js',
  ];
  for (const rel of testOnlyFiles) {
    const p = join(dist, rel);
    if (existsSync(p)) {
      unlinkSync(p);
      console.log(`Removed test-only artifact: dist/${rel}`);
    }
  }
} catch {
  // non-blocking cleanup
}

// No legacy monolithic bundles remain; islands handle progressive enhancements

// Combined search index built via content generator; nothing else to do here.

// Ensure WebP/AVIF siblings for proficiency logos exist alongside PNGs in dist
try {
  const srcProfs = join(process.cwd(), 'src', 'assets', 'images', 'proficiencies');
  const distProfs = join(dist, 'assets', 'images', 'proficiencies');
  if (existsSync(srcProfs) && existsSync(distProfs)) {
    const srcEntries = readdirSync(srcProfs);
    // Copy over any .webp or .avif from src if not present in dist
    for (const name of srcEntries) {
      const ext = extname(name).toLowerCase();
      if (ext === '.webp' || ext === '.avif') {
        const srcPath = join(srcProfs, name);
        const destPath = join(distProfs, name);
        if (!existsSync(destPath)) {
          cpSync(srcPath, destPath);
          console.log(`Copied optimized logo format: assets/images/proficiencies/${name}`);
        }
      }
    }
  }
} catch {
  // ignore if copying optimized logo formats fails
}

// Remove any oversized PNG artifacts that could exceed Cloudflare's 25 MiB asset limit
try {
  const astroDir = join(dist, '_astro');
  if (existsSync(astroDir)) {
    const entries = readdirSync(astroDir);
    for (const name of entries) {
      if (name.toLowerCase().endsWith('.png')) {
        const filePath = join(astroDir, name);
        const sizeBytes = statSync(filePath).size;
        const sizeMiB = sizeBytes / (1024 * 1024);
        if (sizeMiB > 10) { // conservative threshold below Workers 25 MiB limit
          unlinkSync(filePath);
          console.log(`Removed oversized PNG asset: ${name} (${sizeMiB.toFixed(1)} MiB)`);
        }
      }
    }
  }
} catch {
  // ignore cleanup errors
}

// Fuse.js is no longer bundled; search overlay lazy-loads a module via CDN
