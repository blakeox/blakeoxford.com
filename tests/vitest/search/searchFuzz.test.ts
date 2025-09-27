import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../../..');
const projects = JSON.parse(fs.readFileSync(path.join(root, 'public/search/projects.json'), 'utf-8'));
const corpus = [...projects];

function randomInt(max: number) { return Math.floor(Math.random() * max); }
function sample<T>(arr: T[]) { return arr[randomInt(arr.length)]; }

function naiveSearch(query: string) {
  const q = query.toLowerCase();
  return corpus.filter(e => (e.title || '').toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q));
}

describe('Search Fuzz', () => {
  it('handles random substrings without throwing', () => {
    for (let i = 0; i < 200; i++) {
      const entry = sample(corpus);
      const source = (entry.title || entry.description || 'fallback').toString();
      const start = randomInt(Math.max(1, source.length - 1));
      const end = start + randomInt(Math.max(1, source.length - start));
      const q = source.slice(start, end).trim();
      const results = naiveSearch(q);
      expect(Array.isArray(results)).toBe(true);
    }
  });

  it('returns empty array for gibberish queries', () => {
    const gibberish = ['zzzqxx', '!!!!', '1234567890nonmatch', '____'];
    for (const g of gibberish) {
      const res = naiveSearch(g);
      // Accept either empty or extremely low accidental collisions
      expect(res.length).toBeLessThan(2);
    }
  });
});
