import path from 'path';
import { fileURLToPath } from 'url';

// Helper for ESM environment to replicate __dirname/__filename
export function fileMeta(importMeta: ImportMeta) {
  const filename = fileURLToPath(importMeta.url);
  const dirname = path.dirname(filename);
  return { filename, dirname } as const;
}

export function resolveFrom(importMeta: ImportMeta, ...segments: string[]) {
  const { dirname } = fileMeta(importMeta);
  return path.resolve(dirname, ...segments);
}
