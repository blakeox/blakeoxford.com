import { cpSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readFileSync, mkdirSync } from 'node:fs';

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
