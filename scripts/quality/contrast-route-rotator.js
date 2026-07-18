#!/usr/bin/env node
/**
 * contrast-route-rotator.js
 * Selects a rotating subset of additional routes (project + blog slugs) for extended contrast auditing.
 * Usage: node scripts/quality/contrast-route-rotator.js --projects 3 --blogs 2
 * Prints a comma-separated list suitable for CONTRAST_EXTRA_ROUTES env variable.
 */
import fs from 'fs';
import path from 'path';

function readDirSafe(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function pickN(arr, n) {
  if (n >= arr.length) return [...arr];
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

const args = process.argv.slice(2);
function getFlag(name, def) {
  const i = args.indexOf(`--${name}`);
  if (i !== -1 && args[i + 1]) return parseInt(args[i + 1], 10);
  return def;
}
const projectCount = getFlag('projects', 3);
const blogCount = getFlag('blogs', 2);

const projectDir = path.join(process.cwd(), 'src/pages/projects');
const blogDir = path.join(process.cwd(), 'src/pages/blog');

const projectSlugs = readDirSafe(projectDir)
  .filter((e) => e.isFile() && /\.astro$/.test(e.name))
  .map((e) => e.name.replace(/\.astro$/, ''));

const blogSlugs = readDirSafe(blogDir)
  .filter((e) => e.isFile() && /\.astro$/.test(e.name))
  .map((e) => e.name.replace(/\.astro$/, ''));

const pickedProjects = pickN(projectSlugs, projectCount).map((s) => `/projects/${s}`);
const pickedBlogs = pickN(blogSlugs, blogCount).map((s) => `/blog/${s}`);

const extra = [...pickedProjects, ...pickedBlogs];
process.stdout.write(extra.join(','));
