#!/usr/bin/env node
/**
 * Cloudflare Edge Function Export Validator
 * Ensures each file in functions/ exports at least one handler-like function.
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const functionsDir = path.join(root, 'functions');
const handlerRegex = /(fetch|onRequest|get|post|put|del)\s*\(/;

let failures = 0;
for (const f of fs.readdirSync(functionsDir)) {
  if (!f.endsWith('.js')) continue;
  const full = path.join(functionsDir, f);
  const src = fs.readFileSync(full, 'utf-8');
  // simple heuristic: look for export keyword before handler name
  const hasExport = /export\s+(async\s+)?function\s+/.test(src) || /module\.exports\s*=/.test(src);
  const hasHandler = handlerRegex.test(src);
  if (!hasExport || !hasHandler) {
    console.error(`[edge:validate] Missing export/handler pattern in ${f}`);
    failures++;
  }
}
if (failures) {
  console.error(`[edge:validate] FAIL (${failures} file(s) invalid)`);
  process.exit(1);
} else {
  console.log('[edge:validate] OK');
}
