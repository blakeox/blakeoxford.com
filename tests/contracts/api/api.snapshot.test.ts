import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ProjectsApiSchema } from '../../../src/config/apiSchemas.ts';

interface Baseline { source: string; schemaVersion: number; entries: any[] }

const root = path.resolve(__dirname, '../../..');
const baselineDir = path.join(root, 'tests/contracts/baselines');

function loadJSON(rel: string) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf-8'));
}

function loadBaseline(name: string): Baseline | null {
  const p = path.join(baselineDir, `${name}.baseline.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as Baseline;
}

function writeBaseline(name: string, data: any) {
  const p = path.join(baselineDir, `${name}.baseline.json`);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function writeDiffReport(name: string, beforeEntries: any[], afterEntries: any[]) {
  const reportDir = path.join(baselineDir, 'diff-reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const added = afterEntries.filter(a => !beforeEntries.some(b => JSON.stringify(b) === JSON.stringify(a)));
  const removed = beforeEntries.filter(b => !afterEntries.some(a => JSON.stringify(a) === JSON.stringify(b)));
  const changed: Array<{ id: string; before: any; after: any }> = [];
  // Naive changed detection (matching slug/id but different serialization)
  for (const a of afterEntries) {
    const key = a.slug || a.id;
    if (!key) continue;
    const prev = beforeEntries.find(b => (b.slug || b.id) === key);
    if (prev && JSON.stringify(prev) !== JSON.stringify(a) && !added.includes(a)) {
      changed.push({ id: key, before: prev, after: a });
    }
  }
  const lines = [
    `# API Snapshot Diff – ${name}`,
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Added: ${added.length}`,
    `Removed: ${removed.length}`,
    `Changed: ${changed.length}`,
    '',
    added.length ? '## Added\n' + added.map(a => '- ' + (a.slug || a.id)).join('\n') : '',
    removed.length ? '## Removed\n' + removed.map(a => '- ' + (a.slug || a.id)).join('\n') : '',
    changed.length ? '## Changed\n' + changed.map(ch => `### ${ch.id}\n- Before: \n\n\`\`\`json\n${JSON.stringify(ch.before, null, 2)}\n\`\`\`\n- After: \n\n\`\`\`json\n${JSON.stringify(ch.after, null, 2)}\n\`\`\``).join('\n\n') : ''
  ].filter(Boolean);
  fs.writeFileSync(path.join(reportDir, `${name}-diff.md`), lines.join('\n'));
}

function normalizeEntries(entries: any[]) {
  return entries.map(e => ({ ...e })).sort((a,b) => (a.slug || a.id || '').localeCompare(b.slug || b.id || ''));
}

describe('API Snapshot Baselines', () => {
  const cases = [
    { name: 'projects', rel: 'public/api/projects.json', schema: ProjectsApiSchema }
  ];

  for (const c of cases) {
    it(`${c.name} snapshot stable`, () => {
      const data = loadJSON(c.rel);
  const parsed = c.schema.parse(data) as unknown as any[];
  const normalized = normalizeEntries(parsed);
      const baseline = loadBaseline(c.name);
      if (!baseline || !baseline.entries.length) {
        writeBaseline(c.name, { source: c.rel, schemaVersion: 1, entries: normalized });
        expect(normalized.length).toBeGreaterThan(0);
        return;
      }
      if (process.env.UPDATE_API_BASELINES === '1') {
        writeDiffReport(c.name, baseline.entries, normalized);
        writeBaseline(c.name, { source: c.rel, schemaVersion: 1, entries: normalized });
        expect(normalized.length).toBeGreaterThan(0);
        return;
      }
      // Compare length
      expect(normalized.length, 'Entry count changed').toBe(baseline.entries.length);
      // Compare each entry shallowly by serializing
      const currentStr = JSON.stringify(normalized);
      const baselineStr = JSON.stringify(baseline.entries);
      if (currentStr !== baselineStr) {
        writeDiffReport(c.name, baseline.entries, normalized);
      }
      expect(currentStr).toBe(baselineStr);
    });
  }
});
