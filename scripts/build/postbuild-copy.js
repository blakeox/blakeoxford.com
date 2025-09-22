import { cpSync, existsSync, writeFileSync, readdirSync, statSync, unlinkSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { readFileSync } from 'node:fs';

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

// Remove legacy standalone JS files that were consolidated into core-boot.js
try {
  const legacyJs = [
    'assets/js/performance-monitor.js',
    'assets/js/pwa-enhancer.js',
    'assets/js/resource-preloader.js',
  ];
  for (const rel of legacyJs) {
    const p = join(dist, rel);
    if (existsSync(p)) {
      unlinkSync(p);
      console.log(`Removed legacy JS: dist/${rel}`);
    }
  }
} catch {
  // ignore cleanup errors
}

// Build a combined search index at dist/search/index.json for quality gate
try {
  const searchDir = join(dist, 'search');
  const blogPath = join(searchDir, 'blog.json');
  const projectsPath = join(searchDir, 'projects.json');
  if (existsSync(blogPath) && existsSync(projectsPath)) {
    const blog = JSON.parse(readFileSync(blogPath, 'utf8'));
    const projects = JSON.parse(readFileSync(projectsPath, 'utf8'));
    const combined = [
      ...projects.map((p) => ({ ...p, type: 'project' })),
      ...blog.map((b) => ({ ...b, type: 'blog' })),
    ];
    mkdirSync(searchDir, { recursive: true });
    writeFileSync(join(searchDir, 'index.json'), JSON.stringify(combined, null, 2));
    console.log('Created dist/search/index.json');
  }
} catch {
  // non-blocking; skip if search files not present
}

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

// Ensure the final build includes the full Fuse.js distribution for search (override placeholder)
try {
  const fuseSrc = join(process.cwd(), 'node_modules', 'fuse.js', 'dist', 'fuse.min.js');
  const fuseDestDir = join(dist, 'assets', 'js');
  if (existsSync(fuseSrc)) {
    mkdirSync(fuseDestDir, { recursive: true });
    cpSync(fuseSrc, join(fuseDestDir, 'fuse.min.js'));
    console.log('Copied Fuse.js -> dist/assets/js/fuse.min.js');
  } else {
    console.warn('Fuse.js distribution not found, skipping copy');
  }
} catch {
  // non-blocking; search overlay has a lightweight fallback
}
