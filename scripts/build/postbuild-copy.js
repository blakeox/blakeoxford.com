import { cpSync, existsSync, writeFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

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
} catch {
  /* noop */
}

// Remove oversized PNG artifacts that could exceed Cloudflare's 25 MiB asset limit
try {
  const astroDir = join(dist, '_astro');
  if (existsSync(astroDir)) {
    const entries = readdirSync(astroDir);
    for (const name of entries) {
      if (name.toLowerCase().endsWith('.png')) {
        const filePath = join(astroDir, name);
        const sizeBytes = statSync(filePath).size;
        const sizeMiB = sizeBytes / (1024 * 1024);
        if (sizeMiB > 10) {
          unlinkSync(filePath);
          console.log(`Removed oversized PNG asset: ${name} (${sizeMiB.toFixed(1)} MiB)`);
        }
      }
    }
  }
} catch {
  // ignore cleanup errors
}

console.log('Postbuild complete');
