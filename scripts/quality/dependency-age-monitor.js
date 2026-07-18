#!/usr/bin/env node
/**
 * Dependency Age Monitor
 * Scans package.json dependencies + devDependencies and queries npm registry for latest versions.
 * Outputs summary lines with major version lag and approximate publish age.
 */
import fs from 'fs';
import https from 'https';

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

const pkg = readJSON('package.json');
const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

function fetchPackageMeta(name) {
  return new Promise((resolve) => {
    const req = https.get(`https://registry.npmjs.org/${name}`, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
  });
}

function semverMajor(v) {
  const m = v.match(/(\d+)\.(\d+)\.(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

(async () => {
  const results = [];
  for (const [name, declared] of Object.entries(all)) {
    const clean = declared.replace(/^[^0-9]*/, '');
    const meta = await fetchPackageMeta(name);
    if (!meta) continue;
    const latest = meta['dist-tags']?.latest || Object.keys(meta.versions || {}).pop();
    const latestMajor = semverMajor(latest);
    const declaredMajor = semverMajor(clean);
    let majorLag = null;
    if (latestMajor != null && declaredMajor != null) majorLag = latestMajor - declaredMajor;
    // attempt publish time
    const time = meta.time?.[latest];
    let ageDays = null;
    if (time) {
      const diffMs = Date.now() - new Date(time).getTime();
      ageDays = Math.floor(diffMs / 86400000);
    }
    results.push({ name, declared, latest, majorLag, ageDays });
  }
  results.sort((a, b) => (b.majorLag || 0) - (a.majorLag || 0));
  const lines = results.map(
    (r) =>
      `${r.name}@${r.declared} -> latest ${r.latest}${r.majorLag != null ? ` (lag ${r.majorLag} major)` : ''}${r.ageDays != null ? ` age ${r.ageDays}d` : ''}`
  );
  const summary = '[deps:age]\n' + lines.join('\n');
  console.log(summary);
  fs.writeFileSync('dependency-age-report.txt', summary + '\n');
})();
