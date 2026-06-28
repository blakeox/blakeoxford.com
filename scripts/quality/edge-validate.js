#!/usr/bin/env node
/**
 * Cloudflare Edge Function Export Validator
 * Ensures each file in functions/ exports at least one handler-like function.
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const functionsDir = path.join(root, 'functions');
const exportedFunctionRegex = /export\s+(async\s+)?function\s+/;
const commonJsExportRegex = /module\.exports\s*=/;
const defaultFetchExportRegex = /export\s+default\s+\{[\s\S]*?\bfetch\s*\(/m;
const defaultExportIdentifierRegex = /export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/;

let failures = 0;
for (const f of fs.readdirSync(functionsDir)) {
  if (!f.endsWith('.js')) continue;
  const full = path.join(functionsDir, f);
  const src = fs.readFileSync(full, 'utf-8');
  const hasNamedOrCommonJsExport =
    exportedFunctionRegex.test(src) || commonJsExportRegex.test(src);
  const hasDefaultFetchExport = defaultFetchExportRegex.test(src);
  let hasExportedFetchObject = false;
  const match = src.match(defaultExportIdentifierRegex);
  if (match?.[1]) {
    const ident = match[1];
    const identObjectRegex = new RegExp(
      `(?:const|let|var)\\s+${ident}\\s*=\\s*\\{[\\s\\S]*?\\bfetch\\s*\\(`,
      'm'
    );
    hasExportedFetchObject = identObjectRegex.test(src);
  }
  if (!hasNamedOrCommonJsExport && !hasDefaultFetchExport && !hasExportedFetchObject) {
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
