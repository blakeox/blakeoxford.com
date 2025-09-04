import { describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { BlogApiSchemaArray } from '../../../src/config/apiSchemas';

function loadJson(rel: string) {
  const filePath = path.join(process.cwd(), rel);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

describe('Blog API Contract', () => {
  it('public/search/blog.json matches contract', () => {
    const data = loadJson('public/search/blog.json');
  BlogApiSchemaArray.parse(data);
  });
});
