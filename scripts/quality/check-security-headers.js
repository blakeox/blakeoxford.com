#!/usr/bin/env node
/**
 * Validates presence of critical security headers in the root _headers file.
 * This is a static sanity check to prevent accidental removal of policies.
 *
 * Checks (default):
 *  - Content-Security-Policy
 *  - X-Content-Type-Options
 *  - X-Frame-Options
 *  - Referrer-Policy
 *  - Strict-Transport-Security
 *  - Permissions-Policy (advisory)
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const headersPath = path.join(root, '_headers');
const REQUIRED = [
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Strict-Transport-Security',
];
const ADVISORY = ['Permissions-Policy'];

if (!fs.existsSync(headersPath)) {
  console.error('❌ _headers file not found at repo root.');
  process.exit(1);
}

const raw = fs.readFileSync(headersPath, 'utf8');
const missing = REQUIRED.filter((h) => !new RegExp('^[\t ]*' + h + ':', 'mi').test(raw));
const advisoryMissing = ADVISORY.filter((h) => !new RegExp('^[\t ]*' + h + ':', 'mi').test(raw));

if (missing.length) {
  console.error('❌ Missing required security headers:');
  missing.forEach((h) => console.error('  - ' + h));
} else {
  console.log('✅ All required security headers present.');
}
if (advisoryMissing.length) {
  console.warn('⚠️ Advisory headers absent (consider adding):');
  advisoryMissing.forEach((h) => console.warn('  - ' + h));
}

process.exit(missing.length ? 1 : 0);
